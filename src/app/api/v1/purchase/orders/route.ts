import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  createPurchaseOrderSchema,
  queryPurchaseOrdersSchema,
} from "./validation";
import { validateRequest } from "@/lib/validation";
import prisma from "@/lib/prisma";

// 创建采购单
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    await requireAuth(request);

    // 解析请求体
    const requestData = await request.json();

    // 验证请求数据
    const validatedData = validateRequest(
      createPurchaseOrderSchema,
      requestData
    );

    // 生成采购单号
    const orderNumber = await generateOrderNumber();

    // 计算总金额
    const subtotal = validatedData.items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    );
    const totalAmount = subtotal + (validatedData.additional_cost || 0);

    // 开始事务
    const result = await prisma.$transaction(async (tx: any) => {
      // 验证供应商是否存在
      const supplier = await tx.supplier.findUnique({
        where: { id: validatedData.supplier_id },
      });

      if (!supplier) {
        throw new Error(`供应商ID ${validatedData.supplier_id} 不存在`);
      }

      // 创建采购单
      const order = await tx.purchaseOrder.create({
        data: {
          orderNumber,
          supplierId: validatedData.supplier_id,
          additionalPrice: validatedData.additional_cost || 0,
          totalAmount,
          expectedDeliveryDate: validatedData.expected_delivery_date
            ? new Date(validatedData.expected_delivery_date)
            : null,
          remark: validatedData.remark,
        },
      });

      // 创建采购单明细项
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

      return { order, items, supplier };
    });

    // 返回响应
    return NextResponse.json({
      success: true,
      data: {
        id: result.order.id,
        order_number: result.order.orderNumber,
        supplier_id: result.order.supplierId,
        supplier_code: result.supplier.code,
        supplier_name: result.supplier.fullName,
        status: result.order.status,
        payment_status: result.order.paymentStatus.toLowerCase(),
        delivery_status: result.order.deliveryStatus
          .toLowerCase()
          .replace("_", "_"),
        subtotal: subtotal,
        additional_cost: Number(result.order.additionalPrice),
        total_amount: Number(result.order.totalAmount),
        order_date: result.order.orderDate.toISOString(),
        expected_delivery_date:
          result.order.expectedDeliveryDate?.toISOString(),
        actual_delivery_date: result.order.actualDeliveryDate?.toISOString(),
        items_count: result.items.length,
        remark: result.order.remark,
        created_at: result.order.createdAt.toISOString(),
        updated_at: result.order.updatedAt.toISOString(),
        items: result.items.map((item) => ({
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
    console.error("Create purchase order error:", error);
    const message = error instanceof Error ? error.message : "创建采购单失败";

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

// 获取采购单列表
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    await requireAuth(request);

    // 解析查询参数
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const per_page = parseInt(url.searchParams.get("per_page") || "10");
    const search = url.searchParams.get("search") || undefined;
    const supplier_id = url.searchParams.get("supplier_id") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const payment_status = url.searchParams.get("payment_status") || undefined;
    const delivery_status =
      url.searchParams.get("delivery_status") || undefined;
    const date_from = url.searchParams.get("date_from") || undefined;
    const date_to = url.searchParams.get("date_to") || undefined;
    const sort = url.searchParams.get("sort") || "createdAt";
    const order = url.searchParams.get("order") || "desc";

    // 验证查询参数
    const validatedParams = validateRequest(queryPurchaseOrdersSchema, {
      page,
      per_page,
      search,
      supplier_id,
      status,
      payment_status,
      delivery_status,
      date_from,
      date_to,
      sort,
      order,
    });

    // 构建查询条件
    const where: any = {};

    if (validatedParams.search) {
      where.OR = [
        {
          orderNumber: {
            contains: validatedParams.search,
            mode: "insensitive",
          },
        },
        {
          supplier: {
            OR: [
              {
                code: { contains: validatedParams.search, mode: "insensitive" },
              },
              {
                fullName: {
                  contains: validatedParams.search,
                  mode: "insensitive",
                },
              },
            ],
          },
        },
      ];
    }

    if (validatedParams.supplier_id) {
      where.supplierId = validatedParams.supplier_id;
    }

    if (validatedParams.status) {
      where.status = validatedParams.status;
    }

    if (validatedParams.payment_status) {
      where.paymentStatus = validatedParams.payment_status.toUpperCase();
    }

    if (validatedParams.delivery_status) {
      where.deliveryStatus = validatedParams.delivery_status
        .toUpperCase()
        .replace("_", "_");
    }

    if (validatedParams.date_from || validatedParams.date_to) {
      where.orderDate = {};
      if (validatedParams.date_from) {
        where.orderDate.gte = new Date(validatedParams.date_from);
      }
      if (validatedParams.date_to) {
        where.orderDate.lte = new Date(validatedParams.date_to);
      }
    }

    // 查询总数
    const total = await prisma.purchaseOrder.count({ where });

    // 查询采购单列表
    const orders = await prisma.purchaseOrder.findMany({
      where,
      orderBy: {
        [validatedParams.sort || "createdAt"]: validatedParams.order || "desc",
      },
      skip:
        ((validatedParams.page || 1) - 1) * (validatedParams.per_page || 10),
      take: validatedParams.per_page || 10,
      include: {
        supplier: {
          select: {
            code: true,
            fullName: true,
          },
        },
        items: {
          select: {
            id: true,
            totalPrice: true,
          },
        },
      },
    });

    // 转换为响应格式
    const orderList = orders.map((order: any) => {
      const subtotal = order.items.reduce(
        (sum: number, item: any) => sum + Number(item.totalPrice),
        0
      );

      return {
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
        items_count: order.items.length,
        remark: order.remark,
        created_at: order.createdAt.toISOString(),
        updated_at: order.updatedAt.toISOString(),
      };
    });

    // 返回响应
    return NextResponse.json({
      success: true,
      data: {
        orders: orderList,
        total,
        page: validatedParams.page || 1,
        per_page: validatedParams.per_page || 10,
        has_next:
          total >
          (validatedParams.page || 1) * (validatedParams.per_page || 10),
      },
      meta: {
        total,
        page: validatedParams.page || 1,
        per_page: validatedParams.per_page || 10,
        has_next:
          total >
          (validatedParams.page || 1) * (validatedParams.per_page || 10),
      },
    });
  } catch (error) {
    console.error("Get purchase orders error:", error);
    const message =
      error instanceof Error ? error.message : "获取采购单列表失败";

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
async function generateOrderNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  // 查询当月的采购单数量
  const startOfMonth = new Date(year, now.getMonth(), 1);
  const endOfMonth = new Date(year, now.getMonth() + 1, 0, 23, 59, 59, 999);

  const count = await prisma.purchaseOrder.count({
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
