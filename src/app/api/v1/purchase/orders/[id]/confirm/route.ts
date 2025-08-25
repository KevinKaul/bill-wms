import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { confirmPurchaseOrderSchema, idParamSchema } from "../../validation";
import { validateRequest } from "@/lib/validation";
import prisma from "@/lib/prisma";

// 确认采购单
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证用户身份
    await requireAuth(request);

    // 验证路径参数
    const { id } = validateRequest(idParamSchema, params);

    // 解析请求体
    const requestData = await request.json().catch(() => ({}));

    // 验证请求数据
    const validatedData = validateRequest(
      confirmPurchaseOrderSchema,
      requestData
    );

    // 检查采购单是否存在且可确认
    const existingOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: {
          select: {
            code: true,
            fullName: true,
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

    if (existingOrder.status !== "draft") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_REQUEST",
            message: "只有草稿状态的采购单才能确认",
          },
        },
        { status: 400 }
      );
    }

    // 更新采购单状态为已确认
    const order = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: "confirmed",
        remark: validatedData.remark || existingOrder.remark,
        updatedAt: new Date(),
      },
    });

    // 返回响应
    return NextResponse.json({
      success: true,
      data: {
        id: order.id,
        order_number: order.orderNumber,
        supplier_id: order.supplierId,
        supplier_code: existingOrder.supplier.code,
        supplier_name: existingOrder.supplier.fullName,
        status: order.status,
        payment_status: order.paymentStatus.toLowerCase(),
        delivery_status: order.deliveryStatus.toLowerCase().replace("_", "_"),
        total_amount: Number(order.totalAmount),
        remark: order.remark,
        order_date: order.orderDate.toISOString(),
        expected_delivery_date: order.expectedDeliveryDate?.toISOString(),
        created_at: order.createdAt.toISOString(),
        updated_at: order.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Confirm purchase order error:", error);
    const message = error instanceof Error ? error.message : "确认采购单失败";

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
