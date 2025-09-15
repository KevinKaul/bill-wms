import { z } from "zod";

// 加工单创建验证Schema
export const createProcessOrderSchema = z.object({
  product_id: z.string().min(1, "请选择要生产的产品"),
  planned_quantity: z
    .number()
    .positive("计划生产数量必须大于0")
    .max(999999, "数量不能超过999999"),
  supplier_id: z.string().optional(), // 加工供应商ID（可选）
  processing_fee: z
    .number()
    .min(0, "加工费用不能小于0")
    .max(999999.99, "加工费用不能超过999999.99")
    .default(0),
  start_date: z.string().optional(),
  remark: z.string().optional(),
});

// 加工单更新验证Schema
export const updateProcessOrderSchema = z.object({
  planned_quantity: z
    .number()
    .positive("计划生产数量必须大于0")
    .max(999999, "数量不能超过999999")
    .optional(),
  actual_quantity: z
    .number()
    .positive("实际产出数量必须大于0")
    .max(999999, "数量不能超过999999")
    .optional(),
  supplier_id: z.string().optional(),
  processing_fee: z
    .number()
    .min(0, "加工费用不能小于0")
    .max(999999.99, "加工费用不能超过999999.99")
    .optional(),
  start_date: z.string().optional(),
  completion_date: z.string().optional(),
  quality_status: z.enum(["passed", "failed"]).optional(),
  remark: z.string().optional(),
});

// 查询参数验证Schema
export const queryProcessOrdersSchema = z.object({
  page: z.coerce.number().min(1, "页码必须大于0").default(1),
  per_page: z.coerce
    .number()
    .min(1, "每页数量必须大于0")
    .max(100, "每页数量不能超过100")
    .default(10),
  search: z.string().optional(),
  product_id: z.string().optional(),
  supplier_id: z.string().optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]).optional(),
  payment_status: z.enum(["UNPAID", "PAID"]).optional(),
  quality_status: z.enum(["passed", "failed"]).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  sort: z.string().default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

// 开始生产验证Schema
export const startProductionSchema = z.object({
  start_date: z.string().optional(),
  remark: z.string().optional(),
});

// 完成生产验证Schema
export const completeProductionSchema = z.object({
  actual_quantity: z
    .number()
    .positive("实际产出数量必须大于0")
    .max(999999, "数量不能超过999999"),
  completion_date: z.string().optional(),
  quality_status: z.enum(["passed", "failed"]).default("passed"),
  remark: z.string().optional(),
});

// 标记付款验证Schema
export const markPaidSchema = z.object({
  payment_date: z.string().optional(),
  remark: z.string().optional(),
});

// ID参数验证
export const idParamSchema = z.object({
  id: z.string().min(1, "加工单ID不能为空"),
});
