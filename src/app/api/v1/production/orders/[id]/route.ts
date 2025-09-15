import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { updateProcessOrderSchema, idParamSchema } from "../validation";
import { validateRequest } from "@/lib/validation";
import prisma from "@/lib/prisma";

// 获取单个加工单详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证用户身份
    await requireAuth(request);

    // 验证参数
    const { id } = await params;
    const validatedParams = validateRequest(idParamSchema, { id });

    // 查询加工单详情
    const processOrder = await prisma.processOrder.findUnique({
      where: { id: validatedParams.id },
      include: {
        product: {
          select: {
            sku: true,
            name: true,
            type: true,
          },
        },
        supplier: {
          select: {
            code: true,
            fullName: true,
          },
        },
        materialUsages: {
          include: {
            rawMaterialBatch: {
              include: {
                product: {
                  select: {
                    sku: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        finishedProductBatches: {
          select: {
            id: true,
            batchNumber: true,
            inboundQuantity: true,
            remainingQuantity: true,
            actualUnitCost: true,
            inboundDate: true,
          },
        },
      },
    });

    if (!processOrder) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "加工单不存在",
          },
        },
        { status: 404 }
      );
    }

    // 转换为响应格式
    const responseData = {
      id: processOrder.id,
      order_number: processOrder.orderNumber,
      product_id: processOrder.productId,
      product_sku: processOrder.product.sku,
      product_name: processOrder.product.name,
      planned_quantity: Number(processOrder.plannedQuantity),
      actual_quantity: processOrder.actualQuantity
        ? Number(processOrder.actualQuantity)
        : null,
      material_cost: Number(processOrder.materialCost),
      processing_fee: Number(processOrder.processingFee),
      total_cost: Number(processOrder.totalCost),
      supplier_id: processOrder.supplierId,
      supplier_code: processOrder.supplier?.code || null,
      supplier_name: processOrder.supplier?.fullName || null,
      status: processOrder.status.toLowerCase(),
      payment_status: processOrder.paymentStatus.toLowerCase(),
      order_date: processOrder.orderDate.toISOString(),
      start_date: processOrder.startDate?.toISOString(),
      completion_date: processOrder.completionDate?.toISOString(),
      quality_status: processOrder.qualityStatus,
      remark: processOrder.remark,
      created_at: processOrder.createdAt.toISOString(),
      updated_at: processOrder.updatedAt.toISOString(),
      material_usages: processOrder.materialUsages.map((usage: any) => ({
        id: usage.id,
        batch_id: usage.rawMaterialBatchId,
        batch_number: usage.rawMaterialBatch.batchNumber,
        product_sku: usage.rawMaterialBatch.product.sku,
        product_name: usage.rawMaterialBatch.product.name,
        used_quantity: Number(usage.usedQuantity),
        unit_cost: Number(usage.unitCost),
        total_cost: Number(usage.totalCost),
      })),
      finished_batches: processOrder.finishedProductBatches.map((batch: any) => ({
        id: batch.id,
        batch_number: batch.batchNumber,
        inbound_quantity: Number(batch.inboundQuantity),
        remaining_quantity: Number(batch.remainingQuantity),
        actual_unit_cost: Number(batch.actualUnitCost),
        inbound_date: batch.inboundDate.toISOString(),
      })),
    };

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Get process order error:", error);
    const message = error instanceof Error ? error.message : "获取加工单详情失败";

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
          message: "服务器内部错误",
        },
      },
      { status: 500 }
    );
  }
}

// 更新加工单
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证用户身份
    await requireAuth(request);

    // 验证参数
    const { id } = await params;
    const validatedParams = validateRequest(idParamSchema, { id });

    // 解析请求体
    const requestData = await request.json();

    // 验证请求数据
    const validatedData = validateRequest(
      updateProcessOrderSchema,
      requestData
    );

    // 开始事务
    const result = await prisma.$transaction(async (tx: any) => {
      // 检查加工单是否存在
      const existingOrder = await tx.processOrder.findUnique({
        where: { id: validatedParams.id },
        include: {
          product: true,
          supplier: true,
        },
      });

      if (!existingOrder) {
        throw new Error("加工单不存在");
      }

      // 检查是否可以修改
      if (existingOrder.status === "COMPLETED") {
        throw new Error("已完成的加工单不能修改");
      }

      // 验证供应商（如果提供）
      let supplier = existingOrder.supplier;
      if (validatedData.supplier_id && validatedData.supplier_id !== existingOrder.supplierId) {
        supplier = await tx.supplier.findUnique({
          where: { id: validatedData.supplier_id },
        });
        if (!supplier) {
          throw new Error(`供应商ID ${validatedData.supplier_id} 不存在`);
        }
      }

      // 构建更新数据
      const updateData: any = {};

      if (validatedData.planned_quantity !== undefined) {
        updateData.plannedQuantity = validatedData.planned_quantity;
      }

      if (validatedData.actual_quantity !== undefined) {
        updateData.actualQuantity = validatedData.actual_quantity;
      }

      if (validatedData.supplier_id !== undefined) {
        updateData.supplierId = validatedData.supplier_id;
      }

      if (validatedData.processing_fee !== undefined) {
        updateData.processingFee = validatedData.processing_fee;
        // 重新计算总成本
        updateData.totalCost = Number(existingOrder.materialCost) + validatedData.processing_fee;
      }

      if (validatedData.start_date !== undefined) {
        updateData.startDate = validatedData.start_date ? new Date(validatedData.start_date) : null;
      }

      if (validatedData.completion_date !== undefined) {
        updateData.completionDate = validatedData.completion_date ? new Date(validatedData.completion_date) : null;
      }

      if (validatedData.quality_status !== undefined) {
        updateData.qualityStatus = validatedData.quality_status;
      }

      if (validatedData.remark !== undefined) {
        updateData.remark = validatedData.remark;
      }

      // 更新加工单
      const updatedOrder = await tx.processOrder.update({
        where: { id: validatedParams.id },
        data: updateData,
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

      return { updatedOrder };
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
        actual_quantity: result.updatedOrder.actualQuantity
          ? Number(result.updatedOrder.actualQuantity)
          : null,
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
      },
    });
  } catch (error) {
    console.error("Update process order error:", error);
    const message = error instanceof Error ? error.message : "更新加工单失败";

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

// 删除加工单
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证用户身份
    await requireAuth(request);

    // 验证参数
    const { id } = await params;
    const validatedParams = validateRequest(idParamSchema, { id });

    // 开始事务
    await prisma.$transaction(async (tx: any) => {
      // 检查加工单是否存在
      const existingOrder = await tx.processOrder.findUnique({
        where: { id: validatedParams.id },
        include: {
          materialUsages: true,
          finishedProductBatches: true,
        },
      });

      if (!existingOrder) {
        throw new Error("加工单不存在");
      }

      // 检查是否可以删除
      if (existingOrder.status === "COMPLETED") {
        throw new Error("已完成的加工单不能删除");
      }

      if (existingOrder.status === "IN_PROGRESS") {
        throw new Error("进行中的加工单不能删除");
      }

      if (existingOrder.finishedProductBatches.length > 0) {
        throw new Error("已产生成品批次的加工单不能删除");
      }

      // 如果有物料使用记录，需要恢复库存
      if (existingOrder.materialUsages.length > 0) {
        for (const usage of existingOrder.materialUsages) {
          await tx.rawMaterialBatch.update({
            where: { id: usage.rawMaterialBatchId },
            data: {
              remainingQuantity: {
                increment: Number(usage.usedQuantity),
              },
            },
          });
        }

        // 删除物料使用记录
        await tx.materialUsage.deleteMany({
          where: { processOrderId: validatedParams.id },
        });
      }

      // 删除加工单
      await tx.processOrder.delete({
        where: { id: validatedParams.id },
      });
    });

    return NextResponse.json({
      success: true,
      message: "加工单删除成功",
    });
  } catch (error) {
    console.error("Delete process order error:", error);
    const message = error instanceof Error ? error.message : "删除加工单失败";

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
