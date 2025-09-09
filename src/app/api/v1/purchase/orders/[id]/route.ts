import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { updatePurchaseOrderSchema, idParamSchema } from "../validation";
import { validateRequest } from "@/lib/validation";
import prisma from "@/lib/prisma";

// 获取采购单详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证用户身份
    await requireAuth(request);

    // 获取并验证路径参数
    const resolvedParams = await params;
    const { id } = validateRequest(idParamSchema, resolvedParams);

    // 查询采购单详情
    const order = await prisma.purchaseOrder.findUnique({
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
              },
            },
          },
        },
      },
    });

    if (!order) {
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

    // 计算小计
    const subtotal = order.items.reduce(
      (sum, item) => sum + Number(item.totalPrice),
      0
    );

    // 返回响应
    return NextResponse.json({
      success: true,
      data: {
        order: {
          id: order.id,
          order_number: order.orderNumber,
          supplier_id: order.supplierId,
          supplier_code: order.supplier.code,
          supplier_name: order.supplier.fullName,
          status: order.status,
          payment_status: order.paymentStatus.toLowerCase(),
          delivery_status: order.deliveryStatus.toLowerCase().replace("_", "_"),
          subtotal,
          additional_cost: Number(order.additionalPrice),
          total_amount: Number(order.totalAmount),
          order_date: order.orderDate.toISOString(),
          expected_delivery_date: order.expectedDeliveryDate?.toISOString(),
          actual_delivery_date: order.actualDeliveryDate?.toISOString(),
          remark: order.remark,
          created_at: order.createdAt.toISOString(),
          updated_at: order.updatedAt.toISOString(),
        },
        items: order.items.map((item) => ({
          id: item.id,
          product_id: item.productId,
          product_sku: item.product.sku,
          product_name: item.product.name,
          quantity: Number(item.quantity),
          unit_price: Number(item.unitPrice),
          total_price: Number(item.totalPrice),
          received_quantity: 0, // TODO: 实现接收数量跟踪
        })),
      },
    });
  } catch (error) {
    console.error("Get purchase order detail error:", error);
    const message =
      error instanceof Error ? error.message : "获取采购单详情失败";

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

// 更新采购单
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证用户身份
    await requireAuth(request);

    // 获取并验证路径参数
    const resolvedParams = await params;
    const { id } = validateRequest(idParamSchema, resolvedParams);

    // 解析请求体
    const requestData = await request.json();

    // 验证请求数据
    const validatedData = validateRequest(
      updatePurchaseOrderSchema,
      requestData
    );

    // 检查采购单是否存在且可编辑
    const existingOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        items: true,
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
            message: "只有草稿状态的采购单才能编辑",
          },
        },
        { status: 400 }
      );
    }

    // 计算新的总金额
    let subtotal = existingOrder.items.reduce(
      (sum, item) => sum + Number(item.totalPrice),
      0
    );
    let totalAmount = subtotal + Number(existingOrder.additionalPrice);

    if (validatedData.items) {
      subtotal = validatedData.items.reduce(
        (sum, item) => sum + item.quantity * item.unit_price,
        0
      );
      totalAmount =
        subtotal +
        (validatedData.additional_cost ??
          Number(existingOrder.additionalPrice));
    } else if (validatedData.additional_cost !== undefined) {
      totalAmount = subtotal + validatedData.additional_cost;
    }

    // 开始事务
    const result = await prisma.$transaction(async (tx: any) => {
      // 验证供应商是否存在（如果有更新）
      if (validatedData.supplier_id) {
        const supplier = await tx.supplier.findUnique({
          where: { id: validatedData.supplier_id },
        });

        if (!supplier) {
          throw new Error(`供应商ID ${validatedData.supplier_id} 不存在`);
        }
      }

      // 更新采购单基础信息
      const updateData: any = {
        updatedAt: new Date(),
        totalAmount,
      };

      if (validatedData.supplier_id) {
        updateData.supplierId = validatedData.supplier_id;
      }
      if (validatedData.additional_cost !== undefined) {
        updateData.additionalPrice = validatedData.additional_cost;
      }
      if (validatedData.expected_delivery_date !== undefined) {
        updateData.expectedDeliveryDate = validatedData.expected_delivery_date
          ? new Date(validatedData.expected_delivery_date)
          : null;
      }
      if (validatedData.remark !== undefined) {
        updateData.remark = validatedData.remark;
      }

      const order = await tx.purchaseOrder.update({
        where: { id },
        data: updateData,
        include: {
          supplier: {
            select: {
              code: true,
              fullName: true,
            },
          },
        },
      });

      // 如果有新的items，则替换所有items
      if (validatedData.items) {
        // 删除原有的items
        await tx.purchaseOrderItem.deleteMany({
          where: { purchaseOrderId: id },
        });

        // 创建新的items
        const items = await Promise.all(
          validatedData.items.map(async (item) => {
            // 验证产品是否存在
            const product = await tx.product.findUnique({
              where: { id: item.product_id },
            });

            if (!product) {
              throw new Error(`产品ID ${item.product_id} 不存在`);
            }

            const totalPrice = item.quantity * item.unit_price;

            return tx.purchaseOrderItem.create({
              data: {
                purchaseOrderId: order.id,
                productId: item.product_id,
                quantity: item.quantity,
                unitPrice: item.unit_price,
                totalPrice,
              },
              include: {
                product: {
                  select: {
                    sku: true,
                    name: true,
                  },
                },
              },
            });
          })
        );

        return { order, items };
      }

      // 如果没有更新items，查询现有items
      const items = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: id },
        include: {
          product: {
            select: {
              sku: true,
              name: true,
            },
          },
        },
      });

      return { order, items };
    });

    // 计算最终小计
    const finalSubtotal = result.items.reduce(
      (sum: any, item: any) => sum + Number(item.totalPrice),
      0
    );

    // 返回响应
    return NextResponse.json({
      success: true,
      data: {
        order: {
          id: result.order.id,
          order_number: result.order.orderNumber,
          supplier_id: result.order.supplierId,
          supplier_code: result.order.supplier.code,
          supplier_name: result.order.supplier.fullName,
          status: result.order.status,
          payment_status: result.order.paymentStatus.toLowerCase(),
          delivery_status: result.order.deliveryStatus
            .toLowerCase()
            .replace("_", "_"),
          subtotal: finalSubtotal,
          additional_cost: Number(result.order.additionalPrice),
          total_amount: Number(result.order.totalAmount),
          order_date: result.order.orderDate.toISOString(),
          expected_delivery_date:
            result.order.expectedDeliveryDate?.toISOString(),
          actual_delivery_date: result.order.actualDeliveryDate?.toISOString(),
          remark: result.order.remark,
          created_at: result.order.createdAt.toISOString(),
          updated_at: result.order.updatedAt.toISOString(),
        },
        items: result.items.map((item: any) => ({
          id: item.id,
          product_id: item.productId,
          product_sku: item.product.sku,
          product_name: item.product.name,
          quantity: Number(item.quantity),
          unit_price: Number(item.unitPrice),
          total_price: Number(item.totalPrice),
        })),
      },
    });
  } catch (error) {
    console.error("Update purchase order error:", error);
    const message = error instanceof Error ? error.message : "更新采购单失败";

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

// 删除采购单
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证用户身份
    await requireAuth(request);

    // 获取并验证路径参数
    const resolvedParams = await params;
    const { id } = validateRequest(idParamSchema, resolvedParams);

    // 检查采购单是否存在且可删除
    const existingOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
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

    if (
      existingOrder.status !== "draft" &&
      existingOrder.status !== "cancelled"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_REQUEST",
            message: "只有草稿或已取消状态的采购单才能删除",
          },
        },
        { status: 400 }
      );
    }

    // 删除采购单（级联删除items）
    await prisma.purchaseOrder.delete({
      where: { id },
    });

    // 返回响应
    return NextResponse.json({
      success: true,
      data: {
        message: "采购单删除成功",
      },
    });
  } catch (error) {
    console.error("Delete purchase order error:", error);
    const message = error instanceof Error ? error.message : "删除采购单失败";

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
