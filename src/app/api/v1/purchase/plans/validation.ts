import { z } from "zod";

// 采购计划创建验证Schema
export const createPurchasePlanSchema = z.object({
  title: z
    .string()
    .min(1, "计划标题不能为空")
    .max(200, "计划标题长度不能超过200字符"),
  remark: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "产品ID不能为空"),
        quantity: z
          .number()
          .positive("计划采购数量必须大于0")
          .max(999999, "数量不能超过999999"),
        estimatedUnitPrice: z
          .number()
          .positive("预估单价必须大于0")
          .max(999999.99, "单价不能超过999999.99"),
        remark: z.string().optional(),
      })
    )
    .min(1, "至少需要添加一个采购项目"),
});

// 采购计划更新验证Schema
export const updatePurchasePlanSchema = z.object({
  title: z
    .string()
    .min(1, "计划标题不能为空")
    .max(200, "计划标题长度不能超过200字符")
    .optional(),
  remark: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "产品ID不能为空"),
        quantity: z
          .number()
          .positive("计划采购数量必须大于0")
          .max(999999, "数量不能超过999999"),
        estimatedUnitPrice: z
          .number()
          .positive("预估单价必须大于0")
          .max(999999.99, "单价不能超过999999.99"),
        remark: z.string().optional(),
      })
    )
    .min(1, "至少需要添加一个采购项目")
    .optional(),
});

// 查询参数验证Schema
export const queryPurchasePlansSchema = z.object({
  page: z.coerce.number().min(1, "页码必须大于0").default(1),
  per_page: z.coerce
    .number()
    .min(1, "每页数量必须大于0")
    .max(1000, "每页数量不能超过1000")
    .default(10),
  search: z.string().optional(),
  status: z.enum(["draft", "approved", "executed", "cancelled"]).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  sort: z.string().default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

// 批准采购计划验证Schema
export const approvePurchasePlanSchema = z.object({
  remark: z.string().optional(),
});

// 执行采购计划验证Schema
export const executePurchasePlanSchema = z.object({
  supplier_groups: z
    .array(
      z.object({
        supplier_id: z.string().min(1, "请选择供应商"),
        item_ids: z.array(z.string()).min(1, "至少选择一个计划项目"),
        additional_cost: z.number().min(0, "附加费用不能小于0").default(0),
        expected_delivery_date: z.string().optional(),
        remark: z.string().optional(),
      })
    )
    .min(1, "至少需要分配一个供应商"),
});

// ID参数验证
export const idParamSchema = z.object({
  id: z.string().min(1, "采购计划ID不能为空"),
});
