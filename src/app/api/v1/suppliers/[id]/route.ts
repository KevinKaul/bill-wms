import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { updateSupplierSchema, idParamSchema } from "../validation";
import { validateRequest } from "@/lib/validation";
import prisma from "@/lib/prisma";

// 获取供应商详情
export async function GET(
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
    const resolvedParams = await params;
    const { id } = validateRequest(idParamSchema, resolvedParams);

    // 查询供应商详情
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        // 可以添加关联的采购单和加工单统计
        purchaseOrders: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
          },
        },
        processOrders: {
          select: {
            id: true,
            totalCost: true,
            status: true,
          },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "供应商不存在",
          },
        },
        { status: 404 }
      );
    }

    // 计算统计信息
    const totalPurchaseAmount = supplier.purchaseOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0
    );
    const totalProcessingAmount = supplier.processOrders.reduce(
      (sum, order) => sum + Number(order.totalCost),
      0
    );

    // 返回响应
    return NextResponse.json({
      success: true,
      data: {
        id: supplier.id,
        code: supplier.code,
        name: supplier.fullName,
        account: supplier.account,
        type: supplier.type,
        contact_person: supplier.contact_person,
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
        status: supplier.status,
        created_at: supplier.createdAt.toISOString(),
        updated_at: supplier.updatedAt.toISOString(),
        statistics: {
          total_purchase_orders: supplier.purchaseOrders.length,
          total_purchase_amount: totalPurchaseAmount,
          total_process_orders: supplier.processOrders.length,
          total_processing_amount: totalProcessingAmount,
        },
      },
    });
  } catch (error) {
    console.error("Get supplier detail error:", error);
    const message =
      error instanceof Error ? error.message : "获取供应商详情失败";

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

// 更新供应商
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证用户身份
    await requireAuth(request);

    // 验证路径参数
    const resolvedParams = await params;
    const { id } = validateRequest(idParamSchema, resolvedParams);

    // 解析请求体
    const requestData = await request.json();

    // 验证请求数据
    const validatedData = validateRequest(updateSupplierSchema, requestData);

    // 检查供应商是否存在
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!existingSupplier) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "供应商不存在",
          },
        },
        { status: 404 }
      );
    }

    // 检查供应商代号是否重复（如果有更新）
    if (validatedData.code && validatedData.code !== existingSupplier.code) {
      const existingCode = await prisma.supplier.findUnique({
        where: {
          code: validatedData.code,
          NOT: { id },
        },
      });

      if (existingCode) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "DUPLICATE_CODE",
              message: "供应商代号已存在",
            },
          },
          { status: 400 }
        );
      }
    }

    // 更新供应商
    const updateData: any = {
      updatedAt: new Date(),
    };

    // 只更新提供的字段
    if (validatedData.code !== undefined) updateData.code = validatedData.code;
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.account !== undefined)
      updateData.account = validatedData.account;
    if (validatedData.type !== undefined) updateData.type = validatedData.type;
    if (validatedData.contact_person !== undefined)
      updateData.contact_person = validatedData.contact_person;
    if (validatedData.phone !== undefined)
      updateData.phone = validatedData.phone;
    if (validatedData.email !== undefined)
      updateData.email = validatedData.email;
    if (validatedData.address !== undefined)
      updateData.address = validatedData.address;
    if (validatedData.status !== undefined)
      updateData.status = validatedData.status;

    const supplier = await prisma.supplier.update({
      where: { id },
      data: updateData,
    });

    // 返回响应
    return NextResponse.json({
      success: true,
      data: {
        id: supplier.id,
        code: supplier.code,
        name: supplier.fullName,
        account: supplier.account,
        type: supplier.type,
        contact_person: supplier.contact_person,
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
        status: supplier.status,
        created_at: supplier.createdAt.toISOString(),
        updated_at: supplier.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Update supplier error:", error);
    const message = error instanceof Error ? error.message : "更新供应商失败";

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

// 删除供应商
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证用户身份
    await requireAuth(request);

    // 验证路径参数
    const resolvedParams = await params;
    const { id } = validateRequest(idParamSchema, resolvedParams);

    // 检查供应商是否存在
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        purchaseOrders: {
          select: { id: true },
        },
        processOrders: {
          select: { id: true },
        },
      },
    });

    if (!existingSupplier) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "供应商不存在",
          },
        },
        { status: 404 }
      );
    }

    // 检查是否有关联的采购单或加工单
    if (
      existingSupplier.purchaseOrders.length > 0 ||
      existingSupplier.processOrders.length > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_REQUEST",
            message: "供应商有关联的采购单或加工单，无法删除",
          },
        },
        { status: 400 }
      );
    }

    // 软删除供应商
    await prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // 返回响应
    return NextResponse.json({
      success: true,
      data: {
        message: "供应商删除成功",
      },
    });
  } catch (error) {
    console.error("Delete supplier error:", error);
    const message = error instanceof Error ? error.message : "删除供应商失败";

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
