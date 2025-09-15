import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { idParamSchema } from "../../validation";
import { validateRequest } from "@/lib/validation";
import prisma from "@/lib/prisma";
import { z } from "zod";

// 状态更新验证Schema
const updateStatusSchema = z.object({
  payment_status: z.enum(["unpaid", "paid"]).optional(),
});

// 更新加工单状态
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
    const validatedData = validateRequest(updateStatusSchema, requestData);

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

      // 构建更新数据
      const updateData: any = {};

      if (validatedData.payment_status !== undefined) {
        // 检查是否有加工费用
        if (Number(existingOrder.processingFee) <= 0) {
          throw new Error("该加工单没有加工费用，无需付款操作");
        }

        updateData.paymentStatus = validatedData.payment_status.toUpperCase();
      }

      // 如果没有需要更新的字段，返回错误
      if (Object.keys(updateData).length === 0) {
        throw new Error("没有提供需要更新的状态字段");
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
      message: "状态更新成功",
    });
  } catch (error) {
    console.error("Update status error:", error);
    const message = error instanceof Error ? error.message : "状态更新失败";

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
