import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { validateRequest } from "@/lib/validation";
import prisma from "@/lib/prisma";
import { z } from "zod";

// 查询批次列表的验证schema
const queryBatchesSchema = z.object({
  page: z.number().min(1).default(1),
  per_page: z.number().min(1).max(100).default(10),
  sort: z.string().default("inboundDate"),
  order: z.enum(["asc", "desc"]).default("desc"),
  batchNumber: z.string().optional(),
  productSku: z.string().optional(),
  sourceType: z.string().optional(),
  productId: z.string().optional(),
});

// 获取批次列表
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    await requireAuth();

    // 解析查询参数
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const per_page = parseInt(url.searchParams.get("per_page") || "10");
    const batchNumber = url.searchParams.get("batchNumber") || undefined;
    const productSku = url.searchParams.get("productSku") || undefined;
    const sourceType = url.searchParams.get("sourceType") || undefined;
    const productId = url.searchParams.get("productId") || undefined;
    const sortParam = url.searchParams.get("sort") || "inboundDate.desc";
    
    // 解析排序参数 (格式: "field.direction")
    const [parsedSortField, sortOrder] = sortParam.includes('.') 
      ? sortParam.split('.') 
      : [sortParam, "desc"];

    // 验证查询参数
    const validatedParams = validateRequest(queryBatchesSchema, {
      page,
      per_page,
      batchNumber,
      productSku,
      sourceType,
      productId,
      sort: parsedSortField,
      order: sortOrder as "asc" | "desc",
    });

    // 构建查询条件
    const where: any = {};

    if (validatedParams.batchNumber) {
      where.OR = [
        { batchNumber: { contains: validatedParams.batchNumber, mode: 'insensitive' } }
      ];
    }

    if (validatedParams.productSku) {
      where.product = {
        sku: { contains: validatedParams.productSku, mode: 'insensitive' }
      };
    }

    if (validatedParams.productId) {
      where.productId = validatedParams.productId;
    }

    // 构建排序对象
    const sortField = validatedParams.sort === "inboundDate" ? "inboundDate" : validatedParams.sort;
    const orderBy = { [sortField as string]: validatedParams.order };

    // 查询原材料批次
    const rawMaterialBatches = await prisma.rawMaterialBatch.findMany({
      where,
      orderBy,
      skip: ((validatedParams.page || 1) - 1) * (validatedParams.per_page || 10),
      take: validatedParams.per_page || 10,
      include: {
        product: {
          select: {
            sku: true,
            name: true,
            type: true,
          },
        },
        purchaseOrder: {
          select: {
            orderNumber: true,
            supplier: {
              select: {
                code: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    // 查询成品批次
    const finishedProductBatches = await prisma.finishedProductBatch.findMany({
      where,
      orderBy,
      skip: ((validatedParams.page || 1) - 1) * (validatedParams.per_page || 10),
      take: validatedParams.per_page || 10,
      include: {
        product: {
          select: {
            sku: true,
            name: true,
            type: true,
          },
        },
        processOrder: {
          select: {
            orderNumber: true,
          },
        },
      },
    });

    // 查询总数
    const rawMaterialTotal = await prisma.rawMaterialBatch.count({ where });
    const finishedProductTotal = await prisma.finishedProductBatch.count({ where });
    const total = rawMaterialTotal + finishedProductTotal;

    // 转换为统一格式
    const rawMaterialBatchList = rawMaterialBatches.map((batch: any) => ({
      id: batch.id,
      batch_number: batch.batchNumber,
      product_id: batch.productId,
      product_sku: batch.product.sku,
      product_name: batch.product.name,
      product_type: batch.product.type,
      source_type: "PURCHASE", // 原材料来源于采购
      source_reference: batch.purchaseOrder.orderNumber,
      supplier_name: batch.purchaseOrder.supplier ? 
        `${batch.purchaseOrder.supplier.code} - ${batch.purchaseOrder.supplier.fullName}` : null,
      inbound_quantity: Number(batch.inboundQuantity),
      remaining_quantity: Number(batch.remainingQuantity),
      unit_cost: Number(batch.actualUnitPrice),
      total_cost: Number(batch.inboundQuantity) * Number(batch.actualUnitPrice),
      inbound_date: batch.inboundDate.toISOString(),
      created_at: batch.createdAt.toISOString(),
    }));

    const finishedProductBatchList = finishedProductBatches.map((batch: any) => ({
      id: batch.id,
      batch_number: batch.batchNumber,
      product_id: batch.productId,
      product_sku: batch.product.sku,
      product_name: batch.product.name,
      product_type: batch.product.type,
      source_type: "PRODUCTION", // 成品来源于生产
      source_reference: batch.processOrder.orderNumber,
      supplier_name: null, // 成品没有供应商
      inbound_quantity: Number(batch.inboundQuantity),
      remaining_quantity: Number(batch.remainingQuantity),
      unit_cost: Number(batch.actualUnitCost),
      total_cost: Number(batch.inboundQuantity) * Number(batch.actualUnitCost),
      inbound_date: batch.inboundDate.toISOString(),
      created_at: batch.createdAt.toISOString(),
    }));

    // 合并并排序
    const allBatches = [...rawMaterialBatchList, ...finishedProductBatchList];
    allBatches.sort((a, b) => {
      const aValue = a[validatedParams.sort as keyof typeof a];
      const bValue = b[validatedParams.sort as keyof typeof b];
      
      if (validatedParams.order === "desc") {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });

    // 返回响应
    return NextResponse.json({
      success: true,
      data: {
        data: allBatches,
        total,
        page: validatedParams.page || 1,
        per_page: validatedParams.per_page || 10,
        has_next: total > (validatedParams.page || 1) * (validatedParams.per_page || 10),
      },
    });
  } catch (error) {
    console.error("Get batches error:", error);
    const message = error instanceof Error ? error.message : "获取批次数据失败";

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
