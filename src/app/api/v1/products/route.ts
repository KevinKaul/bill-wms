import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  queryProductsSchema,
  createProductSchema,
} from "@/lib/product-validation";
import { validateRequest } from "@/lib/validation";
import { ProductType } from "@/types/product";
import prisma from "@/lib/prisma";

// 创建产品
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    await requireAuth();

    // 解析请求体
    const requestData = await request.json();

    // 验证请求数据
    const validatedData = validateRequest(createProductSchema, requestData);

    // 检查SKU是否重复
    const existingSku = await prisma.product.findUnique({
      where: { sku: validatedData.sku },
    });

    if (existingSku) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DUPLICATE_SKU",
            message: "SKU已存在",
          },
        },
        { status: 400 }
      );
    }

    // 准备创建数据
    const createData: any = {
      sku: validatedData.sku,
      name: validatedData.name,
      type: validatedData.type,
      image: validatedData.image,
    };

    // 根据产品类型设置不同字段
    if (validatedData.type === ProductType.RAW_MATERIAL) {
      createData.referencePurchasePrice = validatedData.referencePurchasePrice;
    } else if (validatedData.type === ProductType.FINISHED_PRODUCT) {
      createData.guidancePrice = validatedData.guidancePrice;
    }

    // 开始事务
    const result = await prisma.$transaction(async (tx: any) => {
      // 创建产品
      const product = await tx.product.create({
        data: createData,
      });

      // 如果是组合产品且提供了BOM项，创建BOM
      if (
        validatedData.type === ProductType.FINISHED_PRODUCT &&
        validatedData.bomItems &&
        validatedData.bomItems.length > 0
      ) {
        await tx.bOMItem.createMany({
          data: validatedData.bomItems.map((item) => ({
            productId: product.id,
            componentId: item.componentId,
            quantity: item.quantity,
          })),
        });
      }

      return product;
    });

    // 返回响应
    return NextResponse.json({
      success: true,
      data: {
        id: result.id,
        sku: result.sku,
        name: result.name,
        type: result.type,
        image_url: result.image || null,
        reference_purchase_price:
          result.referencePurchasePrice?.toNumber() || null,
        guide_unit_price: result.guidancePrice?.toNumber() || null,
        created_at: result.createdAt.toISOString(),
        updated_at: result.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Create product error:", error);
    const message = error instanceof Error ? error.message : "创建产品失败";

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

// 获取产品列表
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const user = await requireAuth();
    console.log("user", user);

    // 解析查询参数
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10");
    const search = url.searchParams.get("search") || undefined;
    const typeParam = url.searchParams.get("type");
    const type = typeParam ? (typeParam as ProductType) : undefined;
    const sortBy = url.searchParams.get("sortBy") || "createdAt";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";

    // 验证查询参数
    const validatedParams = validateRequest(queryProductsSchema, {
      page,
      pageSize,
      search,
      type,
      sortBy,
      sortOrder,
    });

    // 构建查询条件
    const where: any = {};
    if (validatedParams.search) {
      where.OR = [
        { sku: { contains: validatedParams.search, mode: "insensitive" } },
        { name: { contains: validatedParams.search, mode: "insensitive" } },
      ];
    }
    if (validatedParams.type) {
      where.type = validatedParams.type;
    }

    // 查询总数
    const total = await prisma.product.count({ where });

    // 查询产品列表
    const products = await prisma.product.findMany({
      where,
      orderBy: {
        [validatedParams.sortBy || "createdAt"]:
          validatedParams.sortOrder || "desc",
      },
      skip:
        ((validatedParams.page || 1) - 1) * (validatedParams.pageSize || 10),
      take: validatedParams.pageSize || 10,
      include: {
        bomItems: {
          select: {
            id: true,
          },
        },
      },
    });

    // 转换为响应格式
    const productList = products.map((product: any) => ({
      id: product.id,
      sku: product.sku,
      name: product.name,
      type: product.type,
      category_id: null, // 暂不实现分类功能
      category_name: null,
      description: null,
      image: product.image || null,
      reference_purchase_price:
        product.referencePurchasePrice?.toNumber() || null,
      guide_unit_price: product.guidancePrice?.toNumber() || null,
      calculated_cost: null, // 需要计算
      bom_components_count: product.bomItems.length,
      status: "active",
      created_at: product.createdAt.toISOString(),
      updated_at: product.updatedAt.toISOString(),
    }));

    // 返回响应
    return NextResponse.json({
      success: true,
      data: {
        products: productList,
        total,
        page: validatedParams.page || 1,
        per_page: validatedParams.pageSize || 10,
      },
    });
  } catch (error) {
    console.error("Get products error:", error);
    const message = error instanceof Error ? error.message : "获取产品列表失败";

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
