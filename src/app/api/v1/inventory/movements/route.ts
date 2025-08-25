import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { queryInventoryMovementsSchema } from "./validation";
import { validateRequest } from "@/lib/validation";
import prisma from "@/lib/prisma";

// 获取库存移动记录列表
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    await requireAuth(request);

    // 解析查询参数
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const per_page = parseInt(url.searchParams.get("per_page") || "10");
    const product_id = url.searchParams.get("product_id") || undefined;
    const batch_id = url.searchParams.get("batch_id") || undefined;
    const movement_type = url.searchParams.get("movement_type") || undefined;
    const source_type = url.searchParams.get("source_type") || undefined;
    const date_from = url.searchParams.get("date_from") || undefined;
    const date_to = url.searchParams.get("date_to") || undefined;
    const sort = url.searchParams.get("sort") || "createdAt";
    const order = url.searchParams.get("order") || "desc";

    // 验证查询参数
    const validatedParams = validateRequest(queryInventoryMovementsSchema, {
      page,
      per_page,
      product_id,
      batch_id,
      movement_type,
      source_type,
      date_from,
      date_to,
      sort,
      order,
    });

    // 构建查询条件
    const where: any = {};

    if (validatedParams.product_id) {
      where.productId = validatedParams.product_id;
    }

    if (validatedParams.batch_id) {
      where.batchId = validatedParams.batch_id;
    }

    if (validatedParams.movement_type) {
      where.movementType = validatedParams.movement_type;
    }

    if (validatedParams.source_type) {
      where.sourceType = validatedParams.source_type;
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
    const total = await prisma.inventoryMovement.count({ where });

    // 查询库存移动记录列表
    const movements = await prisma.inventoryMovement.findMany({
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
        fromLocation: {
          select: {
            code: true,
            name: true,
          },
        },
        toLocation: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    });

    // 转换为响应格式
    const movementList = movements.map((movement: any) => ({
      id: movement.id,
      product_id: movement.productId,
      product_sku: movement.product.sku,
      product_name: movement.product.name,
      batch_id: movement.batchId,
      batch_number: null, // TODO: 关联批次获取批次号
      movement_type: movement.movementType,
      source_type: movement.sourceType,
      source_reference: movement.sourceReference,
      quantity: Number(movement.quantity),
      unit_cost: movement.unitCost ? Number(movement.unitCost) : null,
      total_cost: movement.totalCost ? Number(movement.totalCost) : null,
      from_location: movement.fromLocation
        ? `${movement.fromLocation.code} - ${movement.fromLocation.name}`
        : null,
      to_location: movement.toLocation
        ? `${movement.toLocation.code} - ${movement.toLocation.name}`
        : null,
      created_at: movement.createdAt.toISOString(),
    }));

    // 返回响应
    return NextResponse.json({
      success: true,
      data: {
        movements: movementList,
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
    console.error("Get inventory movements error:", error);
    const message =
      error instanceof Error ? error.message : "获取库存移动记录失败";

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
