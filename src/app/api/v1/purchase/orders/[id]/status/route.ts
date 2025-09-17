import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { validateRequest } from "@/lib/validation";
import prisma from "@/lib/prisma";
import * as z from "zod";
import { currentUser } from "@clerk/nextjs/server";

const statusUpdateSchema = z.object({
  payment_status: z.enum(['UNPAID', 'PAID']).optional(),
  delivery_status: z.enum(['NOT_DELIVERED', 'DELIVERED']).optional(),
}).refine(data => data.payment_status || data.delivery_status, {
  message: "至少需要提供一个状态字段"
});

const idParamSchema = z.object({
  id: z.string().min(1, { message: "采购单ID不能为空" }),
});

// 处理入库操作的函数
async function processInboundInventory(tx: any, order: any) {
  console.log(`[入库处理] 开始处理采购单 ${order.orderNumber} 的入库操作`);
  // 计算所有SKU总价之和（用于分摊比例计算）
  const totalSkuAmount = order.items.reduce((sum: number, item: any) => 
    sum + Number(item.totalPrice), 0);
  
  // 为每个SKU创建库存批次
  for (const item of order.items) {
    // 只处理原材料类型的产品
    if (item.product.type !== 'RAW_MATERIAL') {
      continue;
    }
    
    // 计算分摊比例
    const skuTotalPrice = Number(item.totalPrice);
    const allocationRatio = totalSkuAmount > 0 ? skuTotalPrice / totalSkuAmount : 0;
    
    // 计算分摊的附加费用
    const allocatedAdditionalCost = Number(order.additionalPrice) * allocationRatio;
    
    // 计算实际总成本
    const actualTotalCost = skuTotalPrice + allocatedAdditionalCost;
    
    // 计算实际入库单价
    const actualUnitPrice = actualTotalCost / Number(item.quantity);
    
    // 生成批次号（格式：PO单号-SKU-时间戳）
    const batchNumber = `${order.orderNumber}-${item.product.sku}-${Date.now()}`;
    
    // 创建原材料批次记录
    console.log(`[入库处理] 创建批次 ${batchNumber}，产品：${item.product.sku}，数量：${item.quantity}，单价：${actualUnitPrice.toFixed(2)}`);
    await tx.rawMaterialBatch.create({
      data: {
        batchNumber,
        productId: item.productId,
        purchaseOrderId: order.id,
        inboundQuantity: item.quantity,
        remainingQuantity: item.quantity,
        actualUnitPrice: actualUnitPrice,
        inboundDate: new Date(),
      }
    });
    
    // 创建库存移动记录
    console.log(`[入库处理] 创建库存移动记录，产品：${item.product.sku}，类型：inbound，数量：${item.quantity}`);
    await tx.inventoryMovement.create({
      data: {
        productId: item.productId,
        batchId: batchNumber,
        movementType: 'inbound',
        sourceType: 'purchase',
        sourceReference: order.orderNumber,
        quantity: item.quantity,
        unitCost: actualUnitPrice,
        totalCost: actualTotalCost,
      }
    });

    // 更新库存水平表 - 关键修复
    console.log(`[入库处理] 更新库存水平表，产品：${item.product.sku}，数量：${item.quantity}`);
    
    // 获取默认位置ID（如果没有位置系统，使用一个默认位置）
    let defaultLocation = await tx.location.findFirst({
      where: { code: 'DEFAULT' }
    });
    
    if (!defaultLocation) {
      // 创建默认位置
      defaultLocation = await tx.location.create({
        data: {
          code: 'DEFAULT',
          name: '默认仓库',
          type: 'warehouse',
          status: 'active'
        }
      });
      console.log(`[入库处理] 创建默认仓库位置: ${defaultLocation.id}`);
    }

    // 查找是否已存在该产品在该位置的库存记录
    const existingInventoryLevel = await tx.inventoryLevel.findUnique({
      where: {
        productId_locationId_batchId: {
          productId: item.productId,
          locationId: defaultLocation.id,
          batchId: batchNumber
        }
      }
    });

    if (existingInventoryLevel) {
      // 更新现有库存记录
      await tx.inventoryLevel.update({
        where: {
          productId_locationId_batchId: {
            productId: item.productId,
            locationId: defaultLocation.id,
            batchId: batchNumber
          }
        },
        data: {
          quantity: { increment: item.quantity },
          availableQuantity: { increment: item.quantity },
          unitCost: actualUnitPrice,
          totalCost: { increment: actualTotalCost }
        }
      });
    } else {
      // 创建新的库存记录
      await tx.inventoryLevel.create({
        data: {
          productId: item.productId,
          locationId: defaultLocation.id,
          batchId: batchNumber,
          quantity: item.quantity,
          reservedQuantity: 0,
          availableQuantity: item.quantity,
          unitCost: actualUnitPrice,
          totalCost: actualTotalCost
        }
      });
    }
    
    console.log(`[入库处理] 库存水平表更新完成，产品：${item.product.sku}，批次：${batchNumber}`);
  }
}

// 记录操作日志的函数
async function logOperation(tx: any, userId: string, userName: string, orderId: string, orderNumber: string, oldValue: any, newValue: any) {
  console.log(`[操作日志] 用户 ${userName}(${userId}) 更新采购单 ${orderNumber} 的状态`);
  console.log(`[操作日志] 旧状态: ${JSON.stringify(oldValue)}`);
  console.log(`[操作日志] 新状态: ${JSON.stringify(newValue)}`);
  await tx.operationLog.create({
    data: {
      userId,
      userName,
      module: '采购管理',
      operationType: 'UPDATE',
      objectId: orderId,
      objectType: '采购单',
      oldValue,
      newValue,
      description: `更新采购单 ${orderNumber} 的状态`,
    }
  });
}

// 更新采购单状态
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log(`[采购单状态更新] 接收到状态更新请求`);
  try {
    // 验证用户身份
    await requireAuth(request);

    // 获取当前用户信息
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "用户未登录",
          },
        },
        { status: 401 }
      );
    }

    // 获取并验证路径参数
    const resolvedParams = await params;
    const { id } = validateRequest(idParamSchema, resolvedParams);
    console.log(`[采购单状态更新] 处理采购单ID: ${id}`);

    // 解析请求体
    const requestData = await request.json();
    console.log(`[采购单状态更新] 请求数据: ${JSON.stringify(requestData)}`);

    // 验证请求数据
    const validatedData = validateRequest(statusUpdateSchema, requestData);
    console.log(`[采购单状态更新] 验证后数据: ${JSON.stringify(validatedData)}`);

    // 检查采购单是否存在
    const existingOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      console.log(`[采购单状态更新] 错误: 采购单ID ${id} 不存在`);
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

    // 准备更新数据
    const updateData: any = {};
    let hasChanges = false;
    
    // 检查付款状态是否有变化
    if (validatedData.payment_status && validatedData.payment_status !== existingOrder.paymentStatus) {
      updateData.paymentStatus = validatedData.payment_status;
      hasChanges = true;
    }
    
    // 检查到货状态是否有变化
    if (validatedData.delivery_status && validatedData.delivery_status !== existingOrder.deliveryStatus) {
      updateData.deliveryStatus = validatedData.delivery_status;
      hasChanges = true;
    }
    
    // 如果没有状态变化，直接返回当前状态
    if (!hasChanges) {
      console.log(`[采购单状态更新] 状态未发生变化，无需更新`);
      return NextResponse.json({
        success: true,
        data: {
          id: existingOrder.id,
          payment_status: existingOrder.paymentStatus,
          delivery_status: existingOrder.deliveryStatus,
          updated_at: existingOrder.updatedAt.toISOString(),
        },
        message: '状态未发生变化'
      });
    }

    // 检查是否需要触发入库操作
    const shouldTriggerInbound = validatedData.delivery_status === 'DELIVERED' && 
                                existingOrder.deliveryStatus !== 'DELIVERED';
    
    console.log(`[采购单状态更新] 采购单号: ${existingOrder.orderNumber}, 当前付款状态: ${existingOrder.paymentStatus}, 当前到货状态: ${existingOrder.deliveryStatus}`);
    console.log(`[采购单状态更新] 是否需要触发入库操作: ${shouldTriggerInbound ? '是' : '否'}`);

    let updatedOrder;
    
    // 保存原始状态用于日志记录
    const oldStatus = {
      paymentStatus: existingOrder.paymentStatus,
      deliveryStatus: existingOrder.deliveryStatus,
    };

    if (shouldTriggerInbound) {
      console.log(`[采购单状态更新] 开始处理入库事务`);
      // 使用事务处理状态更新和入库操作
      updatedOrder = await prisma.$transaction(async (tx) => {
        // 更新采购单状态
        const order = await tx.purchaseOrder.update({
          where: { id },
          data: {
            ...updateData,
            deliveryStatus: 'DELIVERED',
            actualDeliveryDate: new Date(),
          },
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        });

        // 触发入库操作
        console.log(`[采购单状态更新] 触发入库操作，采购单: ${order.orderNumber}，共 ${order.items.length} 个商品项`);
        await processInboundInventory(tx, order);
        
        // 记录操作日志
        await logOperation(
          tx,
          user.id,
          user.firstName + ' ' + user.lastName || user.emailAddresses[0]?.emailAddress || 'Unknown',
          order.id,
          order.orderNumber,
          oldStatus,
          {
            paymentStatus: order.paymentStatus,
            deliveryStatus: order.deliveryStatus,
            actualDeliveryDate: order.actualDeliveryDate,
          }
        );
        
        return order;
      });
    } else {
      console.log(`[采购单状态更新] 执行普通状态更新，无需入库操作`);
      // 使用事务处理普通状态更新和日志记录
      updatedOrder = await prisma.$transaction(async (tx) => {
        const order = await tx.purchaseOrder.update({
          where: { id },
          data: updateData,
        });

        // 记录操作日志
        await logOperation(
          tx,
          user.id,
          user.firstName + ' ' + user.lastName || user.emailAddresses[0]?.emailAddress || 'Unknown',
          order.id,
          existingOrder.orderNumber,
          oldStatus,
          {
            paymentStatus: order.paymentStatus,
            deliveryStatus: order.deliveryStatus,
          }
        );

        return order;
      });
    }

    // 返回响应
    console.log(`[采购单状态更新] 成功更新采购单 ${updatedOrder.id} 的状态`);
    console.log(`[采购单状态更新] 新付款状态: ${updatedOrder.paymentStatus}, 新到货状态: ${updatedOrder.deliveryStatus}`);
    return NextResponse.json({
      success: true,
      data: {
        id: updatedOrder.id,
        payment_status: updatedOrder.paymentStatus,
        delivery_status: updatedOrder.deliveryStatus,
        updated_at: updatedOrder.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[采购单状态更新] 错误:", error);
    console.error("Update purchase order status error:", error);
    const message = error instanceof Error ? error.message : "更新采购单状态失败";

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
