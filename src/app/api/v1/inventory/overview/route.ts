import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// 获取库存概览
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    await requireAuth(request);

    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const productType = searchParams.get('productType');
    const lowStock = searchParams.get('lowStock') === 'true';
    const hasStock = searchParams.get('hasStock') === 'true';

    console.log('库存概览API参数:', { page, limit, search, productType, lowStock, hasStock });

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

    // 按产品类型统计库存（MySQL 语法）
    const rawMaterialStats = await prisma.$queryRaw`
      SELECT 
        'RAW_MATERIAL' as category_id,
        '原材料' as category_name,
        COUNT(DISTINCT p.id) as products_count,
        COALESCE(SUM(rmb.remainingQuantity), 0) as total_quantity,
        COALESCE(SUM(rmb.remainingQuantity * rmb.actualUnitPrice), 0) as total_value
      FROM products p
      LEFT JOIN raw_material_batches rmb ON p.id = rmb.productId AND rmb.remainingQuantity > 0
      WHERE p.type = 'RAW_MATERIAL' AND p.status = 'active'
    `;

    const finishedProductStats = await prisma.$queryRaw`
      SELECT 
        'FINISHED_PRODUCT' as category_id,
        '成品' as category_name,
        COUNT(DISTINCT p.id) as products_count,
        COALESCE(SUM(fpb.remainingQuantity), 0) as total_quantity,
        COALESCE(SUM(fpb.remainingQuantity * fpb.actualUnitCost), 0) as total_value
      FROM products p
      LEFT JOIN finished_product_batches fpb ON p.id = fpb.productId AND fpb.remainingQuantity > 0
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

    // 查询库存明细数据
    const offset = (page - 1) * limit;
    
    // 构建产品筛选条件
    const productWhere: any = {
      status: "active",
    };

    if (search) {
      productWhere.OR = [
        { sku: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (productType && productType !== 'all') {
      if (productType === 'raw_material') {
        productWhere.type = 'RAW_MATERIAL';
      } else if (productType === 'finished_product') {
        productWhere.type = 'FINISHED_PRODUCT';
      }
    }

    // 查询产品及其库存信息
    const products = await prisma.product.findMany({
      where: productWhere,
      include: {
        rawMaterialBatches: {
          where: {
            remainingQuantity: { gt: 0 }
          },
          select: {
            remainingQuantity: true,
            actualUnitPrice: true,
            inboundDate: true
          }
        },
        finishedProductBatches: {
          where: {
            remainingQuantity: { gt: 0 }
          },
          select: {
            remainingQuantity: true,
            actualUnitCost: true,
            inboundDate: true
          }
        }
      },
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    // 计算总数（用于分页）
    const totalProductsForPagination = await prisma.product.count({
      where: productWhere
    });

    // 转换为库存明细格式
    const inventoryData = products.map(product => {
      let totalQuantity = 0;
      let totalValue = 0;
      let batchCount = 0;
      let oldestBatchDate = new Date();
      let avgUnitCost = 0;

      if (product.type === 'RAW_MATERIAL') {
        const batches = product.rawMaterialBatches;
        totalQuantity = batches.reduce((sum, batch) => sum + Number(batch.remainingQuantity), 0);
        totalValue = batches.reduce((sum, batch) => sum + Number(batch.remainingQuantity) * Number(batch.actualUnitPrice), 0);
        batchCount = batches.length;
        if (batches.length > 0) {
          oldestBatchDate = new Date(Math.min(...batches.map(b => new Date(b.inboundDate).getTime())));
          avgUnitCost = totalQuantity > 0 ? totalValue / totalQuantity : 0;
        }
      } else if (product.type === 'FINISHED_PRODUCT') {
        const batches = product.finishedProductBatches;
        totalQuantity = batches.reduce((sum, batch) => sum + Number(batch.remainingQuantity), 0);
        totalValue = batches.reduce((sum, batch) => sum + Number(batch.remainingQuantity) * Number(batch.actualUnitCost), 0);
        batchCount = batches.length;
        if (batches.length > 0) {
          oldestBatchDate = new Date(Math.min(...batches.map(b => new Date(b.inboundDate).getTime())));
          avgUnitCost = totalQuantity > 0 ? totalValue / totalQuantity : 0;
        }
      }

      return {
        product_id: product.id,
        product_sku: product.sku,
        product_name: product.name,
        product_type: product.type.toLowerCase(),
        total_quantity: totalQuantity,
        total_value: totalValue,
        batch_count: batchCount,
        avg_unit_cost: avgUnitCost,
        oldest_batch_date: oldestBatchDate.toISOString(),
        low_stock_alert: false // TODO: 实现库存阈值功能
      };
    });

    console.log(`查询到 ${inventoryData.length} 条库存记录，总计 ${totalProductsForPagination} 条`);

    // 返回响应
    return NextResponse.json({
      success: true,
      data: {
        // 统计数据
        total_products: totalProducts,
        total_batches: totalBatches,
        total_value: totalValue,
        low_stock_alerts: lowStockAlerts,
        categories,
        // 库存明细数据
        data: inventoryData,
        total: totalProductsForPagination,
        page,
        limit
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
