import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { idParamSchema, updateProductSchema } from '../validation';
import { validateRequest } from '@/lib/validation';
import prisma from '@/lib/prisma';

// 获取产品详情
export async function GET(request: NextRequest) {
  // 从 URL 中提取 ID 参数
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];
  
  // 创建一个参数对象供验证使用
  const params = { id };
  try {
    // 验证用户身份
    await requireAuth(request);

    // 验证ID参数
    const { id } = validateRequest(idParamSchema, params);

    // 查询产品详情
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        bomItems: {
          include: {
            component: true
          }
        }
      }
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '产品不存在'
          }
        },
        { status: 404 }
      );
    }

    // 计算成本（如果是组合产品）
    let calculatedCost = null;
    if (product.type === 'FINISHED_PRODUCT' && product.bomItems.length > 0) {
      calculatedCost = product.bomItems.reduce((total: number, item: any) => {
        const componentPrice = item.component.referencePurchasePrice || 0;
        return total + componentPrice.toNumber() * item.quantity.toNumber();
      }, 0);
    }

    // 转换BOM组件为响应格式
    const bomComponents = product.bomItems.map((item: any) => ({
      id: item.id,
      material_id: item.componentId,
      material_sku: item.component.sku,
      material_name: item.component.name,
      quantity: item.quantity.toNumber(),
      unit: '', // 暂不实现单位
      cost_per_unit: item.component.referencePurchasePrice?.toNumber() || 0,
      total_cost: (item.component.referencePurchasePrice?.toNumber() || 0) * item.quantity.toNumber()
    }));

    // 构建响应数据
    const responseData = {
      product: {
        id: product.id,
        sku: product.sku,
        name: product.name,
        type: product.type,
        category_id: null, // 暂不实现分类功能
        category_name: null,
        description: null,
        image_url: product.image || null,
        reference_purchase_price: product.referencePurchasePrice?.toNumber() || null,
        guide_unit_price: product.guidancePrice?.toNumber() || null,
        calculated_cost: calculatedCost,
        bom_components_count: product.bomItems.length,
        status: 'active',
        created_at: product.createdAt.toISOString(),
        updated_at: product.updatedAt.toISOString()
      },
      bom_components: product.type === 'FINISHED_PRODUCT' ? bomComponents : [],
      inventory_summary: {
        total_quantity: 0, // 暂不实现库存功能
        total_value: 0,
        batch_count: 0
      }
    };

    // 返回响应
    return NextResponse.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    // 记录错误
    console.error('Get product detail error:', error);
    const message = error instanceof Error ? error.message : '获取产品详情失败';
    
    if (message.startsWith('VALIDATION_ERROR:')) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_REQUEST',
            message: message.replace('VALIDATION_ERROR: ', '') 
          } 
        }, 
        { status: 400 }
      );
    }
    
    if (message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'UNAUTHORIZED',
            message: '未授权访问' 
          } 
        }, 
        { status: 401 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR',
          message: '服务器内部错误' 
        } 
      }, 
      { status: 500 }
    );
  }
}

// 更新产品
export async function PUT(
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
    const validatedData = validateRequest(updateProductSchema, { id, ...requestData });

    // 检查产品是否存在
    const existingProduct = await prisma.product.findUnique({
      where: { sku: id }
    });

    if (!existingProduct) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '产品不存在'
          }
        },
        { status: 404 }
      );
    }

    // 检查SKU是否重复（如果更新了SKU）
    if (validatedData.sku && validatedData.sku !== existingProduct.sku) {
      const duplicateSku = await prisma.product.findUnique({
        where: { sku: validatedData.sku }
      });

      if (duplicateSku) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DUPLICATE_SKU',
              message: 'SKU已存在'
            }
          },
          { status: 400 }
        );
      }
    }

    // 准备更新数据
    const updateData: any = {
      sku: validatedData.sku,
      name: validatedData.name,
      image: validatedData.image
    };

    // 根据产品类型设置不同字段
    if (existingProduct.type === 'RAW_MATERIAL') {
      updateData.referencePurchasePrice = validatedData.referencePurchasePrice;
    } else if (existingProduct.type === 'FINISHED_PRODUCT') {
      updateData.guidancePrice = validatedData.guidancePrice;
    }

    // 开始事务
    const updatedProduct = await prisma.$transaction(async (tx: any) => {
      // 更新产品基本信息
      const product = await tx.product.update({
        where: { id },
        data: updateData
      });

      // 如果是组合产品且提供了BOM项，更新BOM
      if (existingProduct.type === 'FINISHED_PRODUCT' && validatedData.bomItems) {
        // 删除现有BOM项
        await tx.bOMItem.deleteMany({
          where: { productId: id }
        });

        // 创建新的BOM项
        if (validatedData.bomItems.length > 0) {
          await tx.bOMItem.createMany({
            data: validatedData.bomItems.map(item => ({
              productId: id,
              componentId: item.componentId,
              quantity: item.quantity
            }))
          });
        }
      }

      return product;
    });

    // 返回响应
    return NextResponse.json({
      success: true,
      data: {
        id: updatedProduct.id,
        sku: updatedProduct.sku,
        name: updatedProduct.name,
        type: updatedProduct.type,
        image_url: updatedProduct.image || null,
        reference_purchase_price: updatedProduct.referencePurchasePrice?.toNumber() || null,
        guide_unit_price: updatedProduct.guidancePrice?.toNumber() || null,
        updated_at: updatedProduct.updatedAt.toISOString()
      }
    });
  } catch (error) {
    // 记录错误
    console.error('Update product error:', error);
    const message = error instanceof Error ? error.message : '更新产品失败';
    
    if (message.startsWith('VALIDATION_ERROR:')) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_REQUEST',
            message: message.replace('VALIDATION_ERROR: ', '') 
          } 
        }, 
        { status: 400 }
      );
    }
    
    if (message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'UNAUTHORIZED',
            message: '未授权访问' 
          } 
        }, 
        { status: 401 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR',
          message: '服务器内部错误' 
        } 
      }, 
      { status: 500 }
    );
  }
}

// 删除产品
export async function DELETE(request: NextRequest) {
  // 从 URL 中提取 ID 参数
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];
  
  // 创建一个参数对象供验证使用
  const params = { id };
  try {
    // 验证用户身份
    await requireAuth(request);

    // 验证ID参数
    const { id } = validateRequest(idParamSchema, params);

    // 检查产品是否存在
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        bomComponents: true // 检查是否被其他产品引用
      }
    });

    if (!existingProduct) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '产品不存在'
          }
        },
        { status: 404 }
      );
    }

    // 检查产品是否被其他产品引用
    if (existingProduct.bomComponents.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PRODUCT_IN_USE',
            message: '该产品已被其他产品引用，无法删除'
          }
        },
        { status: 400 }
      );
    }

    // 删除产品
    await prisma.product.delete({
      where: { id }
    });

    // 返回响应
    return NextResponse.json({
      success: true,
      data: null
    });
  } catch (error) {
    // 记录错误
    console.error('Delete product error:', error);
    const message = error instanceof Error ? error.message : '删除产品失败';
    
    if (message.startsWith('VALIDATION_ERROR:')) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_REQUEST',
            message: message.replace('VALIDATION_ERROR: ', '') 
          } 
        }, 
        { status: 400 }
      );
    }
    
    if (message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'UNAUTHORIZED',
            message: '未授权访问' 
          } 
        }, 
        { status: 401 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR',
          message: '服务器内部错误' 
        } 
      }, 
      { status: 500 }
    );
  }
}
