import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { markPaidSchema, idParamSchema } from "../../validation";
import { validateRequest } from "@/lib/validation";
import prisma from "@/lib/prisma";

// 标记加工费已付款
export async function PATCH(
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
    const validatedData = validateRequest(markPaidSchema, requestData);

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

      // 检查是否有加工费用
      if (Number(existingOrder.processingFee) <= 0) {
        throw new Error("该加工单没有加工费用，无需付款");
      }

      // 检查付款状态
      if (existingOrder.paymentStatus === "PAID") {
        throw new Error("该加工单已经付款");
      }

      // 更新付款状态
      const updatedOrder = await tx.processOrder.update({
        where: { id: validatedParams.id },
        data: {
          paymentStatus: "PAID",
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
      message: "加工费付款状态已更新",
    });
  } catch (error) {
    console.error("Mark paid error:", error);
    const message = error instanceof Error ? error.message : "标记付款失败";

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
