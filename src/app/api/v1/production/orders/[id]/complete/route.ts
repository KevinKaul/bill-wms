import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { completeProductionSchema, idParamSchema } from "../../validation";
import { validateRequest } from "@/lib/validation";
import prisma from "@/lib/prisma";

// 完成生产
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== 开始完成生产操作 ===');
    
    // 验证用户身份
    await requireAuth(request);

    // 验证参数
    const { id } = await params;
    const validatedParams = validateRequest(idParamSchema, { id });
    console.log('加工单ID:', validatedParams.id);

    // 解析请求体
    const requestData = await request.json();
    console.log('请求数据:', requestData);
    const validatedData = validateRequest(completeProductionSchema, requestData);
    console.log('验证后的数据:', validatedData);

    // 开始事务
    const result = await prisma.$transaction(async (tx: any) => {
      // 检查加工单是否存在
      const existingOrder = await tx.processOrder.findUnique({
        where: { id: validatedParams.id },
        include: {
          product: {
            select: {
              sku: true,
              name: true,
            },
          },
          supplier: {
            select: {
              code: true,
              fullName: true,
            },
          },
        },
      });

      if (!existingOrder) {
        throw new Error("加工单不存在");
      }

      console.log('找到加工单:', {
        id: existingOrder.id,
        orderNumber: existingOrder.orderNumber,
        status: existingOrder.status,
        productId: existingOrder.productId,
        productSku: existingOrder.product.sku,
        totalCost: existingOrder.totalCost
      });

      // 检查状态是否允许完成生产
      if (existingOrder.status !== "IN_PROGRESS") {
        throw new Error(`当前状态为 ${existingOrder.status}，不能完成生产`);
      }

      // 计算实际单位成本
      const actualUnitCost = Number(existingOrder.totalCost) / validatedData.actual_quantity;
      console.log('计算单位成本:', {
        totalCost: existingOrder.totalCost,
        actualQuantity: validatedData.actual_quantity,
        actualUnitCost
      });

      // 更新加工单状态
      const updatedOrder = await tx.processOrder.update({
        where: { id: validatedParams.id },
        data: {
          status: "COMPLETED",
          actualQuantity: validatedData.actual_quantity,
          completionDate: validatedData.completion_date
            ? new Date(validatedData.completion_date)
            : new Date(),
          qualityStatus: validatedData.quality_status,
          remark: validatedData.remark || existingOrder.remark,
        },
        include: {
          product: {
            select: {
              sku: true,
              name: true,
            },
          },
          supplier: {
            select: {
              code: true,
              fullName: true,
            },
          },
        },
      });

      console.log('加工单状态已更新为COMPLETED');

      // 生成成品批次号
      const batchNumber = await generateFinishedProductBatchNumber(
        existingOrder.productId,
        tx
      );
      console.log('生成批次号:', batchNumber);

      // 创建成品库存批次
      const finishedBatch = await tx.finishedProductBatch.create({
        data: {
          batchNumber,
          productId: existingOrder.productId,
          processOrderId: validatedParams.id,
          inboundQuantity: validatedData.actual_quantity,
          remainingQuantity: validatedData.actual_quantity,
          actualUnitCost,
          inboundDate: updatedOrder.completionDate,
        },
      });

      console.log('成品批次已创建:', {
        id: finishedBatch.id,
        batchNumber: finishedBatch.batchNumber,
        productId: finishedBatch.productId,
        inboundQuantity: finishedBatch.inboundQuantity,
        actualUnitCost: finishedBatch.actualUnitCost
      });

      return { updatedOrder, finishedBatch };
    });

    console.log('=== 生产完成操作成功 ===');
    console.log('返回数据:', {
      orderId: result.updatedOrder.id,
      batchId: result.finishedBatch.id,
      batchNumber: result.finishedBatch.batchNumber
    });

    // 返回响应
    return NextResponse.json({
      success: true,
      data: {
        id: result.updatedOrder.id,
        order_number: result.updatedOrder.orderNumber,
        product_id: result.updatedOrder.productId,
        product_sku: result.updatedOrder.product.sku,
        product_name: result.updatedOrder.product.name,
        planned_quantity: Number(result.updatedOrder.plannedQuantity),
        actual_quantity: Number(result.updatedOrder.actualQuantity),
        material_cost: Number(result.updatedOrder.materialCost),
        processing_fee: Number(result.updatedOrder.processingFee),
        total_cost: Number(result.updatedOrder.totalCost),
        supplier_id: result.updatedOrder.supplierId,
        supplier_code: result.updatedOrder.supplier?.code || null,
        supplier_name: result.updatedOrder.supplier?.fullName || null,
        status: result.updatedOrder.status.toLowerCase(),
        payment_status: result.updatedOrder.paymentStatus.toLowerCase(),
        order_date: result.updatedOrder.orderDate.toISOString(),
        start_date: result.updatedOrder.startDate?.toISOString(),
        completion_date: result.updatedOrder.completionDate?.toISOString(),
        quality_status: result.updatedOrder.qualityStatus,
        remark: result.updatedOrder.remark,
        created_at: result.updatedOrder.createdAt.toISOString(),
        updated_at: result.updatedOrder.updatedAt.toISOString(),
        finished_batch: {
          id: result.finishedBatch.id,
          batch_number: result.finishedBatch.batchNumber,
          inbound_quantity: Number(result.finishedBatch.inboundQuantity),
          actual_unit_cost: Number(result.finishedBatch.actualUnitCost),
        },
      },
      message: "生产已完成，成品已入库",
    });
  } catch (error) {
    console.error("Complete production error:", error);
    const message = error instanceof Error ? error.message : "完成生产失败";

    if (message.startsWith("VALIDATION_ERROR:")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_REQUEST",
            message: message.replace("VALIDATION_ERROR: ", ""),
          },
        },
        { status: 400 }
      );
    }

    if (message === "UNAUTHORIZED") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "未授权访问",
          },
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: message,
        },
      },
      { status: 500 }
    );
  }
}

// 生成成品批次号
async function generateFinishedProductBatchNumber(
  productId: string,
  tx: any
): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  // 获取产品SKU
  const product = await tx.product.findUnique({
    where: { id: productId },
    select: { sku: true },
  });

  if (!product) {
    throw new Error("产品不存在");
  }

  // 查询当天该产品的批次数量
  const startOfDay = new Date(year, now.getMonth(), now.getDate());
  const endOfDay = new Date(year, now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const count = await tx.finishedProductBatch.count({
    where: {
      productId,
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  const sequence = String(count + 1).padStart(3, "0");
  return `FP${product.sku}${year}${month}${day}${sequence}`;
}
