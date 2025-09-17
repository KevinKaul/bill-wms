import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, requireAuth } from "@/lib/auth";
import {
  createInventoryAdjustmentSchema,
  queryInventoryAdjustmentsSchema,
} from "./validation";
import { validateRequest } from "@/lib/validation";
import prisma from "@/lib/prisma";

// 创建库存调整
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const user = await getCurrentUser();

    // 解析请求体
    const requestData = await request.json();

    // 验证请求数据
    const validatedData = validateRequest(
      createInventoryAdjustmentSchema,
      requestData
    );

    // 验证产品是否存在
    const product = await prisma.product.findUnique({
      where: { id: validatedData.product_id },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "产品不存在",
          },
        },
        { status: 404 }
      );
    }

    // 计算总成本
    const totalCost = validatedData.unit_cost
      ? validatedData.quantity * validatedData.unit_cost
      : null;

    // 开始事务
    const result = await prisma.$transaction(async (tx: any) => {
      // 创建库存调整记录
      const adjustment = await tx.inventoryAdjustment.create({
        data: {
          productId: validatedData.product_id,
          type: validatedData.type,
          quantity: validatedData.quantity,
          unitCost: validatedData.unit_cost,
          totalCost,
          reason: validatedData.reason,
          remark: validatedData.remark,
          createdById: user?.id,
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

      // 创建库存移动记录
      await tx.inventoryMovement.create({
        data: {
          productId: validatedData.product_id,
          movementType:
            validatedData.type === "increase" ? "inbound" : "outbound",
          sourceType: "adjustment",
          sourceReference: adjustment.id,
          quantity: validatedData.quantity,
          unitCost: validatedData.unit_cost,
          totalCost,
        },
      });

      // 如果是增加库存，可能需要创建新的批次（这里简化处理）
      if (
        validatedData.type === "increase" &&
        product.type === "RAW_MATERIAL" &&
        validatedData.unit_cost
      ) {
        // 生成调整批次号
        const batchNumber = `ADJ${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}${String(Date.now()).slice(-4)}`;

        await tx.rawMaterialBatch.create({
          data: {
            batchNumber,
            productId: validatedData.product_id,
            purchaseOrderId: null, // 调整没有关联采购单
            inboundQuantity: validatedData.quantity,
            remainingQuantity: validatedData.quantity,
            actualUnitPrice: validatedData.unit_cost,
          },
        });
      }

      return adjustment;
    });

    // 返回响应
    return NextResponse.json({
      success: true,
      data: {
        id: result.id,
        product_id: result.productId,
        product_sku: result.product.sku,
        product_name: result.product.name,
        type: result.type,
        quantity: Number(result.quantity),
        unit_cost: result.unitCost ? Number(result.unitCost) : null,
        total_cost: result.totalCost ? Number(result.totalCost) : null,
        reason: result.reason,
        remark: result.remark,
        created_by: user?.fullName || "System",
        created_at: result.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Create inventory adjustment error:", error);
    const message = error instanceof Error ? error.message : "创建库存调整失败";

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

// 获取库存调整记录列表
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    await requireAuth(request);

    // 解析查询参数
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const per_page = parseInt(url.searchParams.get("per_page") || "10");
    const product_id = url.searchParams.get("product_id") || undefined;
    const type = url.searchParams.get("type") || undefined;
    const reason = url.searchParams.get("reason") || undefined;
    const date_from = url.searchParams.get("date_from") || undefined;
    const date_to = url.searchParams.get("date_to") || undefined;
    const sort = url.searchParams.get("sort") || "createdAt";
    const order = url.searchParams.get("order") || "desc";

    // 验证查询参数
    const validatedParams = validateRequest(queryInventoryAdjustmentsSchema, {
      page,
      per_page,
      product_id,
      type,
      reason,
      date_from,
      date_to,
      sort,
      order,
    });

    // 构建查询条件
    const where: any = {
      deletedAt: null, // 排除已删除的记录
    };

    if (validatedParams.product_id) {
      where.productId = validatedParams.product_id;
    }

    if (validatedParams.type) {
      where.type = validatedParams.type;
    }

    if (validatedParams.reason) {
      where.reason = {
        contains: validatedParams.reason,
        mode: "insensitive",
      };
    }

    if (validatedParams.date_from || validatedParams.date_to) {
      where.createdAt = {};
      if (validatedParams.date_from) {
        where.createdAt.gte = new Date(validatedParams.date_from);
      }
      if (validatedParams.date_to) {
        where.createdAt.lte = new Date(validatedParams.date_to);
      }
    }

    // 查询总数
    const total = await prisma.inventoryAdjustment.count({ where });

    // 查询库存调整记录列表
    const adjustments = await prisma.inventoryAdjustment.findMany({
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
      },
    });

    // 转换为响应格式
    const adjustmentList = adjustments.map((adjustment: any) => ({
      id: adjustment.id,
      product_id: adjustment.productId,
      product_sku: adjustment.product.sku,
      product_name: adjustment.product.name,
      type: adjustment.type,
      quantity: Number(adjustment.quantity),
      unit_cost: adjustment.unitCost ? Number(adjustment.unitCost) : null,
      total_cost: adjustment.totalCost ? Number(adjustment.totalCost) : null,
      reason: adjustment.reason,
      remark: adjustment.remark,
      created_by: adjustment.createdById, // TODO: 关联用户表获取用户名
      created_at: adjustment.createdAt.toISOString(),
    }));

    // 返回响应
    return NextResponse.json({
      success: true,
      data: {
        adjustments: adjustmentList,
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
    console.error("Get inventory adjustments error:", error);
    const message =
      error instanceof Error ? error.message : "获取库存调整记录失败";

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
