import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { markArrivedSchema, idParamSchema } from "../../validation";
import { validateRequest } from "@/lib/validation";
import prisma from "@/lib/prisma";

// 标记采购单为已到货（触发库存入库）
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证用户身份
    await requireAuth(request);

    // 验证路径参数
    const resolvedParams = await params;
    const { id } = validateRequest(idParamSchema, resolvedParams);

    // 解析请求体
    const requestData = await request.json().catch(() => ({}));

    // 验证请求数据
    const validatedData = validateRequest(markArrivedSchema, requestData);

    // 检查采购单是否存在且可标记到货
    const existingOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: {
          select: {
            code: true,
            fullName: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                sku: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "采购单不存在",
          },
        },
        { status: 404 }
      );
    }

    if (existingOrder.status !== "confirmed") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_REQUEST",
            message: "只有已确认状态的采购单才能标记到货",
          },
        },
        { status: 400 }
      );
    }

    if (existingOrder.deliveryStatus === "DELIVERED") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_REQUEST",
            message: "采购单已经标记为已到货",
          },
        },
        { status: 400 }
      );
    }

    // 验证所有产品都是原材料类型
    const nonRawMaterials = existingOrder.items.filter(
      (item) => item.product.type !== "RAW_MATERIAL"
    );

    if (nonRawMaterials.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_REQUEST",
            message: "采购单中包含非原材料产品，无法入库",
          },
        },
        { status: 400 }
      );
    }

    // 开始事务：更新采购单状态并创建库存批次
    const result = await prisma.$transaction(async (tx: any) => {
      // 更新采购单状态
      const order = await tx.purchaseOrder.update({
        where: { id },
        data: {
          status: "completed",
          deliveryStatus: "DELIVERED",
          actualDeliveryDate: validatedData.actual_delivery_date
            ? new Date(validatedData.actual_delivery_date)
            : new Date(),
          remark: validatedData.remark || existingOrder.remark,
          updatedAt: new Date(),
        },
      });

      // 计算附加费用分摊
      const totalSkuAmount = existingOrder.items.reduce(
        (sum, item) => sum + Number(item.totalPrice),
        0
      );
      const additionalCost = Number(existingOrder.additionalPrice);

      const createdBatches = [];

      // 为每个SKU创建库存批次
      for (const item of existingOrder.items) {
        // 计算分摊比例
        const allocationRatio = Number(item.totalPrice) / totalSkuAmount;
        const allocatedAdditionalCost = additionalCost * allocationRatio;

        // 计算实际总成本
        const actualTotalCost =
          Number(item.totalPrice) + allocatedAdditionalCost;

        // 计算实际入库单价
        const actualUnitPrice = actualTotalCost / Number(item.quantity);

        // 生成批次号
        const batchNumber = await generateBatchNumber(tx, item.productId);

        // 创建原材料批次
        const batch = await tx.rawMaterialBatch.create({
          data: {
            batchNumber,
            productId: item.productId,
            purchaseOrderId: order.id,
            inboundQuantity: item.quantity,
            remainingQuantity: item.quantity,
            actualUnitPrice: actualUnitPrice,
          },
        });

        // 创建库存移动记录
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            batchId: batch.id,
            movementType: "inbound",
            sourceType: "purchase",
            sourceReference: order.orderNumber,
            quantity: item.quantity,
            unitCost: actualUnitPrice,
            totalCost: actualTotalCost,
          },
        });

        createdBatches.push({
          ...batch,
          product: item.product,
          allocatedAdditionalCost,
          actualTotalCost,
        });
      }

      return { order, batches: createdBatches };
    });

    // 返回响应
    return NextResponse.json({
      success: true,
      data: {
        order: {
          id: result.order.id,
          order_number: result.order.orderNumber,
          supplier_id: result.order.supplierId,
          supplier_code: existingOrder.supplier.code,
          supplier_name: existingOrder.supplier.fullName,
          status: result.order.status,
          payment_status: result.order.paymentStatus.toLowerCase(),
          delivery_status: result.order.deliveryStatus
            .toLowerCase()
            .replace("_", "_"),
          total_amount: Number(result.order.totalAmount),
          actual_delivery_date: result.order.actualDeliveryDate?.toISOString(),
          remark: result.order.remark,
          created_at: result.order.createdAt.toISOString(),
          updated_at: result.order.updatedAt.toISOString(),
        },
        created_batches: result.batches.map((batch) => ({
          batch_id: batch.id,
          batch_number: batch.batchNumber,
          product_id: batch.productId,
          product_sku: batch.product.sku,
          product_name: batch.product.name,
          inbound_quantity: Number(batch.inboundQuantity),
          remaining_quantity: Number(batch.remainingQuantity),
          actual_unit_price: Number(batch.actualUnitPrice),
          allocated_additional_cost: Number(batch.allocatedAdditionalCost),
          actual_total_cost: Number(batch.actualTotalCost),
          inbound_date: batch.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error("Mark purchase order arrived error:", error);
    const message = error instanceof Error ? error.message : "标记到货失败";

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
          message: "服务器内部错误",
        },
      },
      { status: 500 }
    );
  }
}

// 生成批次号
async function generateBatchNumber(
  tx: any,
  productId: string
): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  // 查询当天该产品的批次数量
  const startOfDay = new Date(year, now.getMonth(), now.getDate());
  const endOfDay = new Date(
    year,
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  );

  const count = await tx.rawMaterialBatch.count({
    where: {
      productId,
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  const sequence = String(count + 1).padStart(3, "0");
  return `RM${year}${month}${day}${sequence}`;
}
