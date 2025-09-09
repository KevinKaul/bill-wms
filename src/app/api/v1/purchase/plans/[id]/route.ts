import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { updatePurchasePlanSchema, idParamSchema } from "../validation";
import { validateRequest } from "@/lib/validation";
import prisma from "@/lib/prisma";

// 获取采购计划详情
export async function GET(
  request: NextRequest,
) {
  console.log(request.url);
   // 从 URL 中提取 ID 参数
   const url = new URL(request.url);
   const pathParts = url.pathname.split("/");
   const id = pathParts[pathParts.length - 1];
 
   // 创建一个参数对象供验证使用
   const params = { id };
  try {
    // 验证用户身份
    await requireAuth(request);

    // 验证路径参数
    const { id } = validateRequest(idParamSchema, params);
    console.log(id);
    // 查询采购计划详情
    const plan = await prisma.purchasePlan.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                sku: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "采购计划不存在",
          },
        },
        { status: 404 }
      );
    }

    // 返回响应
    return NextResponse.json({
      success: true,
      data: {
        id: plan.id,
        plan_number: plan.planNumber,
        title: plan.title,
        status: plan.status,
        total_estimated_amount: Number(plan.totalEstimatedAmount),
        remark: plan.remark,
        created_by: plan.createdByName,
        approved_by: plan.approvedByName,
        executed_at: plan.executedAt?.toISOString(),
        created_at: plan.createdAt.toISOString(),
        updated_at: plan.updatedAt.toISOString(),
        items: plan.items.map((item) => ({
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
    console.error("Get purchase plan detail error:", error);
    const message =
      error instanceof Error ? error.message : "获取采购计划详情失败";

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

// 更新采购计划
export async function PUT(
  request: NextRequest,
) {
   // 从 URL 中提取 ID 参数
   const url = new URL(request.url);
   const pathParts = url.pathname.split("/");
   const id = pathParts[pathParts.length - 1];
 
   // 创建一个参数对象供验证使用
   const params = { id };
  try {
    // 验证用户身份
    await requireAuth(request);

    // 验证路径参数
    const { id } = validateRequest(idParamSchema, params);

    // 解析请求体
    const requestData = await request.json();

    // 验证请求数据
    const validatedData = validateRequest(
      updatePurchasePlanSchema,
      requestData
    );

    // 检查采购计划是否存在且可编辑
    const existingPlan = await prisma.purchasePlan.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!existingPlan) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "采购计划不存在",
          },
        },
        { status: 404 }
      );
    }

    if (existingPlan.status !== "draft") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_REQUEST",
            message: "只有草稿状态的采购计划才能编辑",
          },
        },
        { status: 400 }
      );
    }

    // 计算新的总预估金额
    let totalEstimatedAmount = Number(existingPlan.totalEstimatedAmount);
    if (validatedData.items) {
      totalEstimatedAmount = validatedData.items.reduce(
        (sum, item) => sum + item.quantity * item.estimatedUnitPrice,
        0
      );
    }

    // 开始事务
    const result = await prisma.$transaction(async (tx: any) => {
      // 更新采购计划基础信息
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (validatedData.title) {
        updateData.title = validatedData.title;
      }
      if (validatedData.remark !== undefined) {
        updateData.remark = validatedData.remark;
      }
      if (validatedData.items) {
        updateData.totalEstimatedAmount = totalEstimatedAmount;
      }

      const plan = await tx.purchasePlan.update({
        where: { id },
        data: updateData,
      });

      // 如果有新的items，则替换所有items
      if (validatedData.items) {
        // 删除原有的items
        await tx.purchasePlanItem.deleteMany({
          where: { purchasePlanId: id },
        });

        // 创建新的items
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
      }

      // 如果没有更新items，查询现有items
      const items = await tx.purchasePlanItem.findMany({
        where: { purchasePlanId: id },
        include: {
          product: {
            select: {
              sku: true,
              name: true,
            },
          },
        },
      });

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
        remark: result.plan.remark,
        created_by: result.plan.createdByName,
        approved_by: result.plan.approvedByName,
        executed_at: result.plan.executedAt?.toISOString(),
        created_at: result.plan.createdAt.toISOString(),
        updated_at: result.plan.updatedAt.toISOString(),
        items: result.items.map((item: any) => ({
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
    console.error("Update purchase plan error:", error);
    const message = error instanceof Error ? error.message : "更新采购计划失败";

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

// 删除采购计划
export async function DELETE(
  request: NextRequest,
) {
   // 从 URL 中提取 ID 参数
   const url = new URL(request.url);
   const pathParts = url.pathname.split("/");
   const id = pathParts[pathParts.length - 1];
 
   // 创建一个参数对象供验证使用
   const params = { id };
  try {
    // 验证用户身份
    await requireAuth(request);

    // 验证路径参数
    const { id } = validateRequest(idParamSchema, params);

    // 检查采购计划是否存在且可删除
    const existingPlan = await prisma.purchasePlan.findUnique({
      where: { id },
    });

    if (!existingPlan) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "采购计划不存在",
          },
        },
        { status: 404 }
      );
    }

    if (
      existingPlan.status !== "draft" &&
      existingPlan.status !== "cancelled"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_REQUEST",
            message: "只有草稿或已取消状态的采购计划才能删除",
          },
        },
        { status: 400 }
      );
    }

    // 删除采购计划（级联删除items）
    await prisma.purchasePlan.delete({
      where: { id },
    });

    // 返回响应
    return NextResponse.json({
      success: true,
      data: {
        message: "采购计划删除成功",
      },
    });
  } catch (error) {
    console.error("Delete purchase plan error:", error);
    const message = error instanceof Error ? error.message : "删除采购计划失败";

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
