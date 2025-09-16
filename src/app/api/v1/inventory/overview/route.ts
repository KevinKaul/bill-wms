import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// 获取库存概览
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    await requireAuth(request);

    // 查询总产品数量
    const totalProducts = await prisma.product.count({
      where: {
        status: "active",
      },
    });

    // 查询原材料批次总数
    const totalRawMaterialBatches = await prisma.rawMaterialBatch.count({
      where: {
        remainingQuantity: {
          gt: 0,
        },
      },
    });

    // 查询成品批次总数
    const totalFinishedProductBatches = await prisma.finishedProductBatch.count(
      {
        where: {
          remainingQuantity: {
            gt: 0,
          },
        },
      }
    );

    const totalBatches = totalRawMaterialBatches + totalFinishedProductBatches;

    // 查询原材料总价值
    const rawMaterialBatches = await prisma.rawMaterialBatch.findMany({
      where: {
        remainingQuantity: {
          gt: 0,
        },
      },
      select: {
        remainingQuantity: true,
        actualUnitPrice: true,
      },
    });

    const rawMaterialValue = rawMaterialBatches.reduce(
      (sum, batch) =>
        sum + Number(batch.remainingQuantity) * Number(batch.actualUnitPrice),
      0
    );

    // 查询成品总价值
    const finishedProductBatches = await prisma.finishedProductBatch.findMany({
      where: {
        remainingQuantity: {
          gt: 0,
        },
      },
      select: {
        remainingQuantity: true,
        actualUnitCost: true,
      },
    });

    const finishedProductValue = finishedProductBatches.reduce(
      (sum, batch) =>
        sum + Number(batch.remainingQuantity) * Number(batch.actualUnitCost),
      0
    );

    const totalValue = rawMaterialValue + finishedProductValue;

    // 计算低库存预警数量（这里简化处理，实际应该基于库存阈值）
    const lowStockAlerts = 0; // TODO: 实现库存阈值功能

    // 按产品类型统计库存
    const rawMaterialStats = await prisma.$queryRaw`
      SELECT 
        'RAW_MATERIAL' as category_id,
        '原材料' as category_name,
        COUNT(DISTINCT p.id) as products_count,
        COALESCE(SUM(rmb."remainingQuantity"), 0) as total_quantity,
        COALESCE(SUM(rmb."remainingQuantity" * rmb."actualUnitPrice"), 0) as total_value
      FROM products p
      LEFT JOIN raw_material_batches rmb ON p.id = rmb."productId" AND rmb."remainingQuantity" > 0
      WHERE p.type = 'RAW_MATERIAL' AND p.status = 'active'
    `;

    const finishedProductStats = await prisma.$queryRaw`
      SELECT 
        'FINISHED_PRODUCT' as category_id,
        '成品' as category_name,
        COUNT(DISTINCT p.id) as products_count,
        COALESCE(SUM(fpb."remainingQuantity"), 0) as total_quantity,
        COALESCE(SUM(fpb."remainingQuantity" * fpb."actualUnitCost"), 0) as total_value
      FROM products p
      LEFT JOIN finished_product_batches fpb ON p.id = fpb."productId" AND fpb."remainingQuantity" > 0
      WHERE p.type = 'FINISHED_PRODUCT' AND p.status = 'active'
    `;

    const categories = [
      ...(rawMaterialStats as any[]).map((stat) => ({
        category_id: stat.category_id,
        category_name: stat.category_name,
        products_count: Number(stat.products_count),
        total_quantity: Number(stat.total_quantity),
        total_value: Number(stat.total_value),
      })),
      ...(finishedProductStats as any[]).map((stat) => ({
        category_id: stat.category_id,
        category_name: stat.category_name,
        products_count: Number(stat.products_count),
        total_quantity: Number(stat.total_quantity),
        total_value: Number(stat.total_value),
      })),
    ];

    // 返回响应
    return NextResponse.json({
      success: true,
      data: {
        total_products: totalProducts,
        total_batches: totalBatches,
        total_value: totalValue,
        low_stock_alerts: lowStockAlerts,
        categories,
      },
    });
  } catch (error) {
    console.error("Get inventory overview error:", error);
    const message = error instanceof Error ? error.message : "获取库存概览失败";

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
