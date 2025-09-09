import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createSupplierSchema, querySupplierSchema } from "./validation";
import { validateRequest } from "@/lib/validation";
import prisma from "@/lib/prisma";

// 创建供应商
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    await requireAuth(request);

    // 解析请求体
    const requestData = await request.json();

    // 验证请求数据
    const validatedData = validateRequest(createSupplierSchema, requestData);

    // 检查供应商代号是否重复
    const existingCode = await prisma.supplier.findUnique({
      where: { code: validatedData.code },
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

    // 创建供应商
    const supplier = await prisma.supplier.create({
      data: {
        code: validatedData.code,
        fullName: validatedData.name,
        account: validatedData.account,
        type: validatedData.type,
        contact_person: validatedData.contact_person,
        phone: validatedData.phone,
        email: validatedData.email,
        address: validatedData.address,
      },
    });

    // 返回响应
    return NextResponse.json({
      success: true,
      data: {
        id: supplier.id,
        code: supplier.code,
        name: supplier.fullName,
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
    console.error("Create supplier error:", error);
    const message = error instanceof Error ? error.message : "创建供应商失败";

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

// 获取供应商列表
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    await requireAuth(request);

    // 解析查询参数
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const per_page = parseInt(url.searchParams.get("per_page") || "10");
    const search = url.searchParams.get("search") || undefined;
    const type = url.searchParams.get("type") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const sort = url.searchParams.get("sort") || "createdAt";
    const order = url.searchParams.get("order") || "desc";

    // 验证查询参数
    const validatedParams = validateRequest(querySupplierSchema, {
      page,
      per_page,
      search,
      type,
      status,
      sort,
      order,
    });

    // 构建查询条件
    const where: any = {};

    if (validatedParams.search) {
      where.OR = [
        { code: { contains: validatedParams.search, mode: "insensitive" } },
        { fullName: { contains: validatedParams.search, mode: "insensitive" } },
      ];
    }

    if (validatedParams.type) {
      where.type = validatedParams.type;
    }

    if (validatedParams.status) {
      where.status = validatedParams.status;
    }

    // 查询总数
    const total = await prisma.supplier.count({ where });

    // 查询供应商列表
    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: {
        [validatedParams.sort || "createdAt"]: validatedParams.order || "desc",
      },
      skip:
        ((validatedParams.page || 1) - 1) * (validatedParams.per_page || 10),
      take: validatedParams.per_page || 10,
    });

    // 转换为响应格式
    const supplierList = suppliers.map((supplier: any) => ({
      id: supplier.id,
      code: supplier.code,
      name: supplier.fullName,
      type: supplier.type,
      contact_person: supplier.contact_person,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      status: supplier.status,
      created_at: supplier.createdAt.toISOString(),
      updated_at: supplier.updatedAt.toISOString(),
    }));

    // 返回响应
    return NextResponse.json({
      success: true,
      data: {
        suppliers: supplierList,
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
    console.error("Get suppliers error:", error);
    const message =
      error instanceof Error ? error.message : "获取供应商列表失败";

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
