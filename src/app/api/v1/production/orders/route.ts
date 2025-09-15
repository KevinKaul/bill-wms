import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  createProcessOrderSchema,
  queryProcessOrdersSchema,
} from "./validation";
import { validateRequest } from "@/lib/validation";
import prisma from "@/lib/prisma";

// 创建加工单
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    await requireAuth(request);

    // 解析请求体
    const requestData = await request.json();

    // 验证请求数据
    const validatedData = validateRequest(
      createProcessOrderSchema,
      requestData
    );

    // 生成加工单号
    const orderNumber = await generateOrderNumber();

    // 开始事务
    const result = await prisma.$transaction(async (tx: any) => {
      // 验证产品是否存在且为组合产品
      const product = await tx.product.findUnique({
        where: { id: validatedData.product_id },
        include: {
          bomItems: {
            include: {
              component: true,
            },
          },
        },
      });

      if (!product) {
        throw new Error(`产品ID ${validatedData.product_id} 不存在`);
      }

      if (product.type !== "FINISHED_PRODUCT") {
        throw new Error("只能为组合产品创建加工单");
      }

      if (product.bomItems.length === 0) {
        throw new Error("该产品没有配置BOM，无法创建加工单");
      }

      // 验证供应商（如果提供）
      let supplier = null;
      if (validatedData.supplier_id) {
        supplier = await tx.supplier.findUnique({
          where: { id: validatedData.supplier_id },
        });
        if (!supplier) {
          throw new Error(`供应商ID ${validatedData.supplier_id} 不存在`);
        }
      }

      // 计算物料需求并检查库存
      const materialRequirements = product.bomItems.map((bomItem: any) => ({
        productId: bomItem.componentId,
        product: bomItem.component,
        requiredQuantity: Number(bomItem.quantity) * validatedData.planned_quantity,
        bomQuantity: Number(bomItem.quantity),
      }));

      // 检查原材料库存是否充足（FIFO计算）
      for (const requirement of materialRequirements) {
        const availableBatches = await tx.rawMaterialBatch.findMany({
          where: {
            productId: requirement.productId,
            remainingQuantity: { gt: 0 },
          },
          orderBy: { inboundDate: "asc" }, // FIFO排序
        });

        const totalAvailable = availableBatches.reduce(
          (sum: number, batch: any) => sum + Number(batch.remainingQuantity),
          0
        );

        if (totalAvailable < requirement.requiredQuantity) {
          throw new Error(
            `原材料 ${requirement.product.name} 库存不足。需要: ${requirement.requiredQuantity}，可用: ${totalAvailable}`
          );
        }
      }

      // 计算物料成本（FIFO模拟计算）
      let totalMaterialCost = 0;
      const materialUsages = [];

      for (const requirement of materialRequirements) {
        const availableBatches = await tx.rawMaterialBatch.findMany({
          where: {
            productId: requirement.productId,
            remainingQuantity: { gt: 0 },
          },
          orderBy: { inboundDate: "asc" },
        });

        let remainingNeed = requirement.requiredQuantity;
        let materialCost = 0;

        for (const batch of availableBatches) {
          if (remainingNeed <= 0) break;

          const usedQuantity = Math.min(
            Number(batch.remainingQuantity),
            remainingNeed
          );
          const batchCost = usedQuantity * Number(batch.actualUnitPrice);

          materialUsages.push({
            rawMaterialBatchId: batch.id,
            usedQuantity,
            unitCost: Number(batch.actualUnitPrice),
            totalCost: batchCost,
          });

          materialCost += batchCost;
          remainingNeed -= usedQuantity;
        }

        totalMaterialCost += materialCost;
      }

      const totalCost = totalMaterialCost + (validatedData.processing_fee || 0);

      // 创建加工单
      const processOrder = await tx.processOrder.create({
        data: {
          orderNumber,
          productId: validatedData.product_id,
          plannedQuantity: validatedData.planned_quantity,
          materialCost: totalMaterialCost,
          processingFee: validatedData.processing_fee || 0,
          totalCost,
          supplierId: validatedData.supplier_id || null,
          startDate: validatedData.start_date
            ? new Date(validatedData.start_date)
            : null,
          remark: validatedData.remark,
        },
      });

      // 创建物料使用记录并更新库存
      for (const usage of materialUsages) {
        // 创建物料使用记录
        await tx.materialUsage.create({
          data: {
            processOrderId: processOrder.id,
            ...usage,
          },
        });

        // 更新原材料批次库存
        await tx.rawMaterialBatch.update({
          where: { id: usage.rawMaterialBatchId },
          data: {
            remainingQuantity: {
              decrement: usage.usedQuantity,
            },
          },
        });
      }

      return { processOrder, product, supplier, materialRequirements };
    });

    // 返回响应
    return NextResponse.json({
      success: true,
      data: {
        id: result.processOrder.id,
        order_number: result.processOrder.orderNumber,
        product_id: result.processOrder.productId,
        product_sku: result.product.sku,
        product_name: result.product.name,
        planned_quantity: Number(result.processOrder.plannedQuantity),
        actual_quantity: result.processOrder.actualQuantity
          ? Number(result.processOrder.actualQuantity)
          : null,
        material_cost: Number(result.processOrder.materialCost),
        processing_fee: Number(result.processOrder.processingFee),
        total_cost: Number(result.processOrder.totalCost),
        supplier_id: result.processOrder.supplierId,
        supplier_name: result.supplier?.fullName || null,
        status: result.processOrder.status.toLowerCase(),
        payment_status: result.processOrder.paymentStatus.toLowerCase(),
        order_date: result.processOrder.orderDate.toISOString(),
        start_date: result.processOrder.startDate?.toISOString(),
        completion_date: result.processOrder.completionDate?.toISOString(),
        quality_status: result.processOrder.qualityStatus,
        remark: result.processOrder.remark,
        created_at: result.processOrder.createdAt.toISOString(),
        updated_at: result.processOrder.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Create process order error:", error);
    const message = error instanceof Error ? error.message : "创建加工单失败";

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

// 获取加工单列表
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    await requireAuth(request);

    // 解析查询参数
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const per_page = parseInt(url.searchParams.get("per_page") || "10");
    const search = url.searchParams.get("search") || undefined;
    const product_id = url.searchParams.get("product_id") || undefined;
    const supplier_id = url.searchParams.get("supplier_id") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const payment_status = url.searchParams.get("payment_status") || undefined;
    const quality_status = url.searchParams.get("quality_status") || undefined;
    const date_from = url.searchParams.get("date_from") || undefined;
    const date_to = url.searchParams.get("date_to") || undefined;
    const sort = url.searchParams.get("sort") || "createdAt";
    const order = url.searchParams.get("order") || "desc";

    // 验证查询参数
    const validatedParams = validateRequest(queryProcessOrdersSchema, {
      page,
      per_page,
      search,
      product_id,
      supplier_id,
      status,
      payment_status,
      quality_status,
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
          product: {
            OR: [
              {
                sku: { contains: validatedParams.search, mode: "insensitive" },
              },
              {
                name: {
                  contains: validatedParams.search,
                  mode: "insensitive",
                },
              },
            ],
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

    if (validatedParams.product_id) {
      where.productId = validatedParams.product_id;
    }

    if (validatedParams.supplier_id) {
      where.supplierId = validatedParams.supplier_id;
    }

    if (validatedParams.status) {
      where.status = validatedParams.status;
    }

    if (validatedParams.payment_status) {
      where.paymentStatus = validatedParams.payment_status;
    }

    if (validatedParams.quality_status) {
      where.qualityStatus = validatedParams.quality_status;
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
    const total = await prisma.processOrder.count({ where });

    // 查询加工单列表
    const orders = await prisma.processOrder.findMany({
      where,
      orderBy: {
        [validatedParams.sort || "createdAt"]: validatedParams.order || "desc",
      },
      skip:
        ((validatedParams.page || 1) - 1) * (validatedParams.per_page || 10),
      take: validatedParams.per_page || 10,
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

    // 转换为响应格式
    const orderList = orders.map((order: any) => ({
      id: order.id,
      order_number: order.orderNumber,
      product_id: order.productId,
      product_sku: order.product.sku,
      product_name: order.product.name,
      planned_quantity: Number(order.plannedQuantity),
      actual_quantity: order.actualQuantity
        ? Number(order.actualQuantity)
        : null,
      material_cost: Number(order.materialCost),
      processing_fee: Number(order.processingFee),
      total_cost: Number(order.totalCost),
      supplier_id: order.supplierId,
      supplier_code: order.supplier?.code || null,
      supplier_name: order.supplier?.fullName || null,
      status: order.status.toLowerCase(),
      payment_status: order.paymentStatus.toLowerCase(),
      order_date: order.orderDate.toISOString(),
      start_date: order.startDate?.toISOString(),
      completion_date: order.completionDate?.toISOString(),
      quality_status: order.qualityStatus,
      remark: order.remark,
      created_at: order.createdAt.toISOString(),
      updated_at: order.updatedAt.toISOString(),
    }));

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
    console.error("Get process orders error:", error);
    const message =
      error instanceof Error ? error.message : "获取加工单列表失败";

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

// 生成加工单号
async function generateOrderNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  // 查询当月的加工单数量
  const startOfMonth = new Date(year, now.getMonth(), 1);
  const endOfMonth = new Date(year, now.getMonth() + 1, 0, 23, 59, 59, 999);

  const count = await prisma.processOrder.count({
    where: {
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });

  const sequence = String(count + 1).padStart(4, "0");
  return `PR${year}${month}${sequence}`;
}
