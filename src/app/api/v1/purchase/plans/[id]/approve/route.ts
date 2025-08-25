import { NextRequest, NextResponse } from "next/server";
import { requireAuth ,getCurrentUser} from "@/lib/auth";
import { approvePurchasePlanSchema, idParamSchema } from "../../validation";
import { validateRequest } from "@/lib/validation";
import prisma from "@/lib/prisma";

// 批准采购计划
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证用户身份
    const user = await getCurrentUser();

    // 验证路径参数
    const { id } = validateRequest(idParamSchema, params);

    // 解析请求体
    const requestData = await request.json().catch(() => ({}));

    // 验证请求数据
    const validatedData = validateRequest(
      approvePurchasePlanSchema,
      requestData
    );

    // 检查采购计划是否存在且可批准
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

    if (existingPlan.status !== "draft") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_REQUEST",
            message: "只有草稿状态的采购计划才能批准",
          },
        },
        { status: 400 }
      );
    }

    // 更新采购计划状态为已批准
    const plan = await prisma.purchasePlan.update({
      where: { id },
      data: {
        status: "approved",
        approvedById: user?.id,
        approvedByName: user?.fullName || "System",
        remark: validatedData.remark || existingPlan.remark,
        updatedAt: new Date(),
      },
    });

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
      },
    });
  } catch (error) {
    console.error("Approve purchase plan error:", error);
    const message = error instanceof Error ? error.message : "批准采购计划失败";

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
