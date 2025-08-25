import { z } from "zod";
import { ProductType } from "@/types/product";
import { PRODUCT_VALIDATION } from "@/constants/product";

// 基础验证规则
const baseProductFields = {
  sku: z
    .string()
    .min(PRODUCT_VALIDATION.SKU_MIN_LENGTH, {
      message: `SKU长度至少${PRODUCT_VALIDATION.SKU_MIN_LENGTH}个字符`,
    })
    .max(PRODUCT_VALIDATION.SKU_MAX_LENGTH, {
      message: `SKU长度不能超过${PRODUCT_VALIDATION.SKU_MAX_LENGTH}个字符`,
    }),
  name: z
    .string()
    .min(PRODUCT_VALIDATION.NAME_MIN_LENGTH, {
      message: `产品名称至少${PRODUCT_VALIDATION.NAME_MIN_LENGTH}个字符`,
    })
    .max(PRODUCT_VALIDATION.NAME_MAX_LENGTH, {
      message: `产品名称长度不能超过${PRODUCT_VALIDATION.NAME_MAX_LENGTH}个字符`,
    }),
  image: z.any().optional(), // 前端使用File[]，服务端使用string|null
};

// BOM项验证
const bomItemSchema = z.object({
  componentId: z.string().min(1, "请选择原材料"),
  quantity: z.number().min(0.001, "数量必须大于0"),
});

// 前端表单验证Schema（完整的表单数据）
export const productFormSchema = z.object({
  ...baseProductFields,
  type: z.nativeEnum(ProductType, {
    required_error: "请选择产品类型",
    invalid_type_error: "产品类型无效",
  }),
  referencePurchasePrice: z.number().optional().nullable(),
  guidancePrice: z.number().optional().nullable(),
  bomItems: z.array(bomItemSchema).optional().default([]),
  id: z.string().optional(), // 用于编辑模式
});

// 服务端专用的基础字段（image类型不同）
const serverBaseProductFields = {
  sku: z
    .string()
    .min(PRODUCT_VALIDATION.SKU_MIN_LENGTH, {
      message: `SKU长度至少${PRODUCT_VALIDATION.SKU_MIN_LENGTH}个字符`,
    })
    .max(PRODUCT_VALIDATION.SKU_MAX_LENGTH, {
      message: `SKU长度不能超过${PRODUCT_VALIDATION.SKU_MAX_LENGTH}个字符`,
    }),
  name: z
    .string()
    .min(PRODUCT_VALIDATION.NAME_MIN_LENGTH, {
      message: `产品名称至少${PRODUCT_VALIDATION.NAME_MIN_LENGTH}个字符`,
    })
    .max(PRODUCT_VALIDATION.NAME_MAX_LENGTH, {
      message: `产品名称长度不能超过${PRODUCT_VALIDATION.NAME_MAX_LENGTH}个字符`,
    }),
  image: z
    .union([z.string().url({ message: "图片URL格式不正确" }), z.null()])
    .optional(),
};

// 服务端创建产品验证Schema
export const createProductSchema = z.discriminatedUnion("type", [
  // 原材料验证
  z.object({
    ...serverBaseProductFields,
    type: z.literal(ProductType.RAW_MATERIAL),
    referencePurchasePrice: z
      .number()
      .positive("参考采购单价必须大于0")
      .optional()
      .nullable(),
  }),

  // 组合产品验证
  z.object({
    ...serverBaseProductFields,
    type: z.literal(ProductType.FINISHED_PRODUCT),
    guidancePrice: z
      .number()
      .min(0, "指导单价不能为负数")
      .optional()
      .nullable(),
    bomItems: z.array(bomItemSchema).optional(),
  }),
]);

// 服务端更新产品验证Schema（允许部分更新）
export const updateProductSchema = z.object({
  id: z.string().min(1, "产品ID不能为空"),
  sku: z
    .string()
    .min(PRODUCT_VALIDATION.SKU_MIN_LENGTH, {
      message: `SKU长度至少${PRODUCT_VALIDATION.SKU_MIN_LENGTH}个字符`,
    })
    .max(PRODUCT_VALIDATION.SKU_MAX_LENGTH, {
      message: `SKU长度不能超过${PRODUCT_VALIDATION.SKU_MAX_LENGTH}个字符`,
    })
    .optional(),
  name: z
    .string()
    .min(PRODUCT_VALIDATION.NAME_MIN_LENGTH, {
      message: `产品名称至少${PRODUCT_VALIDATION.NAME_MIN_LENGTH}个字符`,
    })
    .max(PRODUCT_VALIDATION.NAME_MAX_LENGTH, {
      message: `产品名称长度不能超过${PRODUCT_VALIDATION.NAME_MAX_LENGTH}个字符`,
    })
    .optional(),
  type: z.nativeEnum(ProductType).optional(),
  image: z
    .union([z.string().url({ message: "图片URL格式不正确" }), z.null()])
    .optional(),
  referencePurchasePrice: z
    .number()
    .positive("参考采购单价必须大于0")
    .optional()
    .nullable(),
  guidancePrice: z.number().positive("指导单价必须大于0").optional().nullable(),
  bomItems: z.array(bomItemSchema).optional(),
});

// 查询参数验证Schema
export const queryProductsSchema = z.object({
  page: z.coerce.number().min(1, "页码必须大于0").default(1),
  pageSize: z.coerce
    .number()
    .min(1, "每页数量必须大于0")
    .max(100, "每页数量不能超过100")
    .default(10),
  search: z.string().optional(),
  type: z.nativeEnum(ProductType).optional().nullable(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// 批量操作验证Schema
export const batchOperationSchema = z.object({
  action: z.enum(["delete"], { required_error: "请指定操作类型" }),
  productIds: z
    .array(z.string().min(1, "产品ID不能为空"))
    .min(1, "至少选择一个产品")
    .max(50, "一次最多操作50个产品"),
});

// ID参数验证
export const idParamSchema = z.object({
  id: z.string().min(1, "产品ID不能为空"),
});

// 导出类型定义
export type ProductFormData = z.infer<typeof productFormSchema>;
export type CreateProductData = z.infer<typeof createProductSchema>;
export type UpdateProductData = z.infer<typeof updateProductSchema>;
