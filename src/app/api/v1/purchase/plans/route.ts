import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser,requireAuth } from "@/lib/auth";
import {
  createPurchasePlanSchema,
  queryPurchasePlansSchema,
} from "./validation";
import { validateRequest } from "@/lib/validation";
import prisma from "@/lib/prisma";

// 创建采购计划
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const user = await getCurrentUser();

    // 解析请求体
    const requestData = await request.json();

    // 验证请求数据
    const validatedData = validateRequest(
      createPurchasePlanSchema,
      requestData
    );

    // 生成计划编号
    const planNumber = await generatePlanNumber();

    // 计算总预估金额
    const totalEstimatedAmount = validatedData.items.reduce(
      (sum, item) => sum + item.quantity * item.estimatedUnitPrice,
      0
    );

    // 开始事务
    const result = await prisma.$transaction(async (tx: any) => {
      // 创建采购计划
      const plan = await tx.purchasePlan.create({
        data: {
          planNumber,
          title: validatedData.title,
          totalEstimatedAmount,
          remark: validatedData.remark,
          createdById: user?.id,
          createdByName: user?.fullName || "System",
        },
      });

      // 创建计划明细项
      const items = await Promise.all(
        validatedData.items.map(async (item) => {
          // 验证产品是否存在
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw new Error(`产品ID ${item.productId} 不存在`);
          }

          const estimatedTotalPrice = item.quantity * item.estimatedUnitPrice;

          return tx.purchasePlanItem.create({
            data: {
              purchasePlanId: plan.id,
              productId: item.productId,
              quantity: item.quantity,
              estimatedUnitPrice: item.estimatedUnitPrice,
              estimatedTotalPrice,
              remark: item.remark,
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
        })
      );

      return { plan, items };
    });

    // 返回响应
    return NextResponse.json({
      success: true,
      data: {
        id: result.plan.id,
        plan_number: result.plan.planNumber,
        title: result.plan.title,
        status: result.plan.status,
        total_estimated_amount: Number(result.plan.totalEstimatedAmount),
        items_count: result.items.length,
        created_by: result.plan.createdByName,
        approved_by: result.plan.approvedByName,
        executed_at: result.plan.executedAt?.toISOString(),
        created_at: result.plan.createdAt.toISOString(),
        updated_at: result.plan.updatedAt.toISOString(),
        items: result.items.map((item) => ({
          id: item.id,
          product_id: item.productId,
          product_sku: item.product.sku,
          product_name: item.product.name,
          quantity: Number(item.quantity),
          estimated_unit_price: Number(item.estimatedUnitPrice),
          estimated_total_price: Number(item.estimatedTotalPrice),
          remark: item.remark,
        })),
      },
    });
  } catch (error) {
    console.error("Create purchase plan error:", error);
    const message = error instanceof Error ? error.message : "创建采购计划失败";

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

// 获取采购计划列表
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    await requireAuth(request);

    // 解析查询参数
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const per_page = parseInt(url.searchParams.get("per_page") || "10");
    const search = url.searchParams.get("search") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const date_from = url.searchParams.get("date_from") || undefined;
    const date_to = url.searchParams.get("date_to") || undefined;
    const sort = url.searchParams.get("sort") || "createdAt";
    const order = url.searchParams.get("order") || "desc";

    // 验证查询参数
    const validatedParams = validateRequest(queryPurchasePlansSchema, {
      page,
      per_page,
      search,
      status,
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
          planNumber: { contains: validatedParams.search, mode: "insensitive" },
        },
        { title: { contains: validatedParams.search, mode: "insensitive" } },
      ];
    }

    if (validatedParams.status) {
      where.status = validatedParams.status;
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
    const total = await prisma.purchasePlan.count({ where });

    // 查询采购计划列表
    const plans = await prisma.purchasePlan.findMany({
      where,
      orderBy: {
        [validatedParams.sort || "createdAt"]: validatedParams.order || "desc",
      },
      skip:
        ((validatedParams.page || 1) - 1) * (validatedParams.per_page || 10),
      take: validatedParams.per_page || 10,
      include: {
        items: {
          select: {
            id: true,
          },
        },
      },
    });

    // 转换为响应格式
    const planList = plans.map((plan: any) => ({
      id: plan.id,
      plan_number: plan.planNumber,
      title: plan.title,
      status: plan.status,
      total_estimated_amount: Number(plan.totalEstimatedAmount),
      items_count: plan.items.length,
      created_by: plan.createdByName,
      approved_by: plan.approvedByName,
      executed_at: plan.executedAt?.toISOString(),
      created_at: plan.createdAt.toISOString(),
      updated_at: plan.updatedAt.toISOString(),
    }));

    // 返回响应
    return NextResponse.json({
      success: true,
      data: {
        plans: planList,
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
    console.error("Get purchase plans error:", error);
    const message =
      error instanceof Error ? error.message : "获取采购计划列表失败";

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

// 生成采购计划编号
async function generatePlanNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  // 查询当月的计划数量
  const startOfMonth = new Date(year, now.getMonth(), 1);
  const endOfMonth = new Date(year, now.getMonth() + 1, 0, 23, 59, 59, 999);

  const count = await prisma.purchasePlan.count({
    where: {
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });

  const sequence = String(count + 1).padStart(3, "0");
  return `PP${year}${month}${sequence}`;
}
