import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const { productId, quantity } = await request.json();

    if (!productId || !quantity || quantity <= 0) {
      return NextResponse.json({ error: '产品ID和数量为必填项' }, { status: 400 });
    }

    // 1. 获取产品信息
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        bomItems: {
          include: {
            component: true
          }
        }
      }
    });

    if (!product) {
      return NextResponse.json({ error: '产品不存在' }, { status: 404 });
    }

    if (product.type !== 'FINISHED_PRODUCT') {
      return NextResponse.json({ error: '只有成品才能创建生产订单' }, { status: 400 });
    }

    if (!product.bomItems || product.bomItems.length === 0) {
      return NextResponse.json({ error: '该产品没有配置BOM，无法生产' }, { status: 400 });
    }

    // 2. 计算物料需求并检查库存
    const materialRequirements = [];
    let canProduceAll = true;
    let maxProducibleQuantity = Infinity;

    for (const bomItem of product.bomItems) {
      const requiredQuantity = Number(bomItem.quantity) * quantity;
      
      // 获取该原材料的当前库存（从库存水平表查询）
      const inventoryLevels = await prisma.inventoryLevel.findMany({
        where: { 
          productId: bomItem.componentId,
          quantity: { gt: 0 }
        }
      });

      const availableQuantity = inventoryLevels.reduce((sum, level) => sum + Number(level.quantity), 0);
      const shortfall = Math.max(0, requiredQuantity - availableQuantity);
      
      if (shortfall > 0) {
        canProduceAll = false;
      }

      // 计算基于此原材料能生产的最大数量
      const maxForThisMaterial = Math.floor(availableQuantity / Number(bomItem.quantity));
      maxProducibleQuantity = Math.min(maxProducibleQuantity, maxForThisMaterial);

      materialRequirements.push({
        materialId: bomItem.componentId,
        materialSku: bomItem.component.sku,
        materialName: bomItem.component.name,
        requiredQuantity,
        availableQuantity,
        shortfall,
        bomQuantity: Number(bomItem.quantity)
      });
    }

    // 如果没有任何原材料，最大可生产数量为0
    if (maxProducibleQuantity === Infinity) {
      maxProducibleQuantity = 0;
    }

    return NextResponse.json({
      success: true,
      data: {
        productId,
        productName: product.name,
        productSku: product.sku,
        requestedQuantity: quantity,
        materialRequirements,
        canProduce: canProduceAll,
        maxProducibleQuantity,
        hasBom: true
      }
    });

  } catch (error) {
    console.error('检查物料需求失败:', error);
    return NextResponse.json(
      { error: '检查物料需求失败' },
      { status: 500 }
    );
  }
}
