import { z } from 'zod';
import { ProductType } from '@/types/product';

// 产品创建验证Schema
export const createProductSchema = z.discriminatedUnion('type', [
  // 原材料验证
  z.object({
    sku: z.string().min(1, 'SKU不能为空').max(50, 'SKU长度不能超过50字符'),
    name: z
      .string()
      .min(1, '产品名称不能为空')
      .max(200, '产品名称长度不能超过200字符'),
    type: z.literal(ProductType.RAW_MATERIAL),
    image: z.string().url('图片URL格式不正确').optional(),
    referencePurchasePrice: z
      .number()
      .positive('参考采购单价必须大于0')
      .optional()
  }),
  // 组合产品验证
  z.object({
    sku: z.string().min(1, 'SKU不能为空').max(50, 'SKU长度不能超过50字符'),
    name: z
      .string()
      .min(1, '产品名称不能为空')
      .max(200, '产品名称长度不能超过200字符'),
    type: z.literal(ProductType.FINISHED_PRODUCT),
    image: z.string().url('图片URL格式不正确').optional(),
    guidancePrice: z.number().positive('指导单价必须大于0').optional(),
    bomItems: z
      .array(
        z.object({
          componentId: z.string().min(1, '请选择原材料'),
          quantity: z.number().positive('数量必须大于0')
        })
      )
      .optional()
  })
]);

// 产品更新验证Schema（允许部分更新）
export const updateProductSchema = z.object({
  id: z.string().min(1, '产品ID不能为空'),
  sku: z
    .string()
    .min(1, 'SKU不能为空')
    .max(50, 'SKU长度不能超过50字符')
    .optional(),
  name: z
    .string()
    .min(1, '产品名称不能为空')
    .max(200, '产品名称长度不能超过200字符')
    .optional(),
  type: z.nativeEnum(ProductType).optional(),
  image: z.string().url('图片URL格式不正确').optional(),
  referencePurchasePrice: z
    .number()
    .positive('参考采购单价必须大于0')
    .optional(),
  guidancePrice: z.number().positive('指导单价必须大于0').optional(),
  bomItems: z
    .array(
      z.object({
        componentId: z.string().min(1, '请选择原材料'),
        quantity: z.number().positive('数量必须大于0')
      })
    )
    .optional()
});

// 查询参数验证Schema
export const queryProductsSchema = z.object({
  page: z.coerce.number().min(1, '页码必须大于0').default(1),
  pageSize: z.coerce
    .number()
    .min(1, '每页数量必须大于0')
    .max(100, '每页数量不能超过100')
    .default(10),
  search: z.string().optional(),
  type: z.nativeEnum(ProductType).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// 批量操作验证Schema
export const batchOperationSchema = z.object({
  action: z.enum(['delete'], { required_error: '请指定操作类型' }),
  productIds: z
    .array(z.string().min(1, '产品ID不能为空'))
    .min(1, '至少选择一个产品')
    .max(50, '一次最多操作50个产品')
});

// ID参数验证
export const idParamSchema = z.object({
  id: z.string().min(1, '产品ID不能为空')
});

/**
 * 验证请求数据
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join('; ');
      throw new Error(`VALIDATION_ERROR: ${message}`);
    }
    throw error;
  }
}
