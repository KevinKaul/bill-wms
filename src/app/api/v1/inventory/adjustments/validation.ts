import { z } from "zod";

// 库存调整创建验证Schema
export const createInventoryAdjustmentSchema = z.object({
  product_id: z.string().min(1, "产品ID不能为空"),
  type: z.enum(["increase", "decrease"], {
    errorMap: () => ({ message: "调整类型必须是increase或decrease" }),
  }),
  quantity: z
    .number()
    .positive("调整数量必须大于0")
    .max(999999, "数量不能超过999999"),
  unit_cost: z
    .number()
    .positive("单位成本必须大于0")
    .max(999999.99, "单位成本不能超过999999.99")
    .optional(),
  reason: z
    .string()
    .min(1, "调整原因不能为空")
    .max(200, "调整原因长度不能超过200字符"),
  remark: z.string().max(500, "备注长度不能超过500字符").optional(),
});

// 查询参数验证Schema
export const queryInventoryAdjustmentsSchema = z.object({
  page: z.coerce.number().min(1, "页码必须大于0").default(1),
  per_page: z.coerce
    .number()
    .min(1, "每页数量必须大于0")
    .max(1000, "每页数量不能超过1000")
    .default(10),
  product_id: z.string().optional(),
  type: z.enum(["increase", "decrease"]).optional(),
  reason: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  sort: z.string().default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});
