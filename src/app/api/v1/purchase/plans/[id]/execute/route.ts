import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { executePurchasePlanSchema, idParamSchema } from "../../validation";
import { validateRequest } from "@/lib/validation";
import prisma from "@/lib/prisma";

// 执行采购计划（生成采购单）
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
    const requestData = await request.json();

    // 验证请求数据
    const validatedData = validateRequest(
      executePurchasePlanSchema,
      requestData
    );

    // 检查采购计划是否存在且可执行
    const existingPlan = await prisma.purchasePlan.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!existingPlan) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "采购计划不存在",
          },
        },
        { status: 404 }
      );
    }

    if (existingPlan.status !== "approved") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_REQUEST",
            message: "只有已批准状态的采购计划才能执行",
          },
        },
        { status: 400 }
      );
    }

    // 验证供应商分组是否覆盖所有计划项
    const allItemIds = existingPlan.items.map((item) => item.id);
    const assignedItemIds = validatedData.supplier_groups.flatMap(
      (group) => group.item_ids
    );
    const missingItems = allItemIds.filter(
      (id) => !assignedItemIds.includes(id)
    );

    if (missingItems.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_REQUEST",
            message: "存在未分配供应商的计划项目",
          },
        },
        { status: 400 }
      );
    }

    // 开始事务
    const result = await prisma.$transaction(async (tx: any) => {
      const createdOrders = [];

      // 为每个供应商组创建采购单
      for (const group of validatedData.supplier_groups) {
        // 验证供应商是否存在
        const supplier = await tx.supplier.findUnique({
          where: { id: group.supplier_id },
        });

        if (!supplier) {
          throw new Error(`供应商ID ${group.supplier_id} 不存在`);
        }

        // 获取该组的计划项目
        const groupItems = existingPlan.items.filter((item) =>
          group.item_ids.includes(item.id)
        );

        if (groupItems.length === 0) {
          continue;
        }

        // 生成采购单号
        const orderNumber = await generateOrderNumber(tx);

        // 计算采购单总金额
        const subtotal = groupItems.reduce(
          (sum, item) => sum + Number(item.estimatedTotalPrice),
          0
        );
        const totalAmount = subtotal + (group.additional_cost || 0);

        // 创建采购单
        const purchaseOrder = await tx.purchaseOrder.create({
          data: {
            orderNumber,
            supplierId: group.supplier_id,
            additionalPrice: group.additional_cost || 0,
            totalAmount,
            expectedDeliveryDate: group.expected_delivery_date
              ? new Date(group.expected_delivery_date)
              : null,
            remark: group.remark,
          },
        });

        // 创建采购单明细项
        const orderItems = await Promise.all(
          groupItems.map(async (planItem) => {
            return tx.purchaseOrderItem.create({
              data: {
                purchaseOrderId: purchaseOrder.id,
                productId: planItem.productId,
                quantity: planItem.quantity,
                unitPrice: planItem.estimatedUnitPrice,
                totalPrice: planItem.estimatedTotalPrice,
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

        createdOrders.push({
          order: purchaseOrder,
          items: orderItems,
          supplier,
        });
      }

      // 更新采购计划状态为已执行
      const updatedPlan = await tx.purchasePlan.update({
        where: { id },
        data: {
          status: "executed",
          executedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return { plan: updatedPlan, orders: createdOrders };
    });

    // 返回响应
    return NextResponse.json({
      success: true,
      data: {
        plan: {
          id: result.plan.id,
          plan_number: result.plan.planNumber,
          title: result.plan.title,
          status: result.plan.status,
          executed_at: result.plan.executedAt?.toISOString(),
          updated_at: result.plan.updatedAt.toISOString(),
        },
        created_orders: result.orders.map((orderData) => ({
          id: orderData.order.id,
          order_number: orderData.order.orderNumber,
          supplier_id: orderData.order.supplierId,
          supplier_code: orderData.supplier.code,
          supplier_name: orderData.supplier.fullName,
          total_amount: Number(orderData.order.totalAmount),
          items_count: orderData.items.length,
          expected_delivery_date:
            orderData.order.expectedDeliveryDate?.toISOString(),
          items: orderData.items.map((item) => ({
            id: item.id,
            product_id: item.productId,
            product_sku: item.product.sku,
            product_name: item.product.name,
            quantity: Number(item.quantity),
            unit_price: Number(item.unitPrice),
            total_price: Number(item.totalPrice),
          })),
        })),
      },
    });
  } catch (error) {
    console.error("Execute purchase plan error:", error);
    const message = error instanceof Error ? error.message : "执行采购计划失败";

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

// 生成采购单号
async function generateOrderNumber(tx: any): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  // 查询当月的采购单数量
  const startOfMonth = new Date(year, now.getMonth(), 1);
  const endOfMonth = new Date(year, now.getMonth() + 1, 0, 23, 59, 59, 999);

  const count = await tx.purchaseOrder.count({
    where: {
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });

  const sequence = String(count + 1).padStart(4, "0");
  return `PO${year}${month}${sequence}`;
}
