import { z } from "zod";

// 查询库存移动记录验证Schema
export const queryInventoryMovementsSchema = z.object({
  page: z.coerce.number().min(1, "页码必须大于0").default(1),
  per_page: z.coerce
    .number()
    .min(1, "每页数量必须大于0")
    .max(100, "每页数量不能超过100")
    .default(10),
  product_id: z.string().optional(),
  batch_id: z.string().optional(),
  movement_type: z.enum(["inbound", "outbound", "transfer"]).optional(),
  source_type: z
    .enum(["purchase", "production", "adjustment", "transfer"])
    .optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  sort: z.string().default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});
