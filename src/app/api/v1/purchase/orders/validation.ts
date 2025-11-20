import { z } from "zod";

// 采购单创建验证Schema
export const createPurchaseOrderSchema = z.object({
  supplier_id: z.string().min(1, "请选择供应商"),
  items: z
    .array(
      z.object({
        product_id: z.string().min(1, "产品ID不能为空"),
        quantity: z
          .number()
          .positive("采购数量必须大于0")
          .max(999999, "数量不能超过999999"),
        unit_price: z
          .number()
          .positive("采购单价必须大于0")
          .max(999999.99, "单价不能超过999999.99"),
      })
    )
    .min(1, "至少需要添加一个采购项目"),
  additional_cost: z
    .number()
    .min(0, "附加费用不能小于0")
    .max(999999.99, "附加费用不能超过999999.99")
    .default(0),
  expected_delivery_date: z.string().optional(),
  remark: z.string().optional(),
});

// 采购单更新验证Schema
export const updatePurchaseOrderSchema = z.object({
  supplier_id: z.string().min(1, "请选择供应商").optional(),
  items: z
    .array(
      z.object({
        product_id: z.string().min(1, "产品ID不能为空"),
        quantity: z
          .number()
          .positive("采购数量必须大于0")
          .max(999999, "数量不能超过999999"),
        unit_price: z
          .number()
          .positive("采购单价必须大于0")
          .max(999999.99, "单价不能超过999999.99"),
      })
    )
    .min(1, "至少需要添加一个采购项目")
    .optional(),
  additional_cost: z
    .number()
    .min(0, "附加费用不能小于0")
    .max(999999.99, "附加费用不能超过999999.99")
    .optional(),
  expected_delivery_date: z.string().optional(),
  remark: z.string().optional(),
});

// 查询参数验证Schema
export const queryPurchaseOrdersSchema = z.object({
  page: z.coerce.number().min(1, "页码必须大于0").default(1),
  per_page: z.coerce
    .number()
    .min(1, "每页数量必须大于0")
    .max(1000, "每页数量不能超过1000")
    .default(10),
  search: z.string().optional(),
  supplier_id: z.string().optional(),
  status: z.enum(["draft", "confirmed", "completed", "cancelled"]).optional(),
  payment_status: z.enum(["unpaid", "paid"]).optional(),
  delivery_status: z.enum(["not_delivered", "delivered"]).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  sort: z.string().default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

// 确认采购单验证Schema
export const confirmPurchaseOrderSchema = z.object({
  remark: z.string().optional(),
});

// 标记付款验证Schema
export const markPaidSchema = z.object({
  payment_date: z.string().optional(),
  remark: z.string().optional(),
});

// 标记到货验证Schema
export const markArrivedSchema = z.object({
  actual_delivery_date: z.string().optional(),
  received_items: z
    .array(
      z.object({
        item_id: z.string().min(1, "项目ID不能为空"),
        received_quantity: z
          .number()
          .positive("到货数量必须大于0")
          .max(999999, "数量不能超过999999"),
      })
    )
    .optional(),
  remark: z.string().optional(),
});

// ID参数验证
export const idParamSchema = z.object({
  id: z.string().min(1, "采购单ID不能为空"),
});
