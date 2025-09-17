import { z } from "zod";

// 供应商创建验证Schema
export const createSupplierSchema = z.object({
  code: z
    .string()
    .min(1, "供应商代号不能为空")
    .max(20, "供应商代号长度不能超过20字符")
    .regex(/^[A-Za-z0-9_-]+$/, "供应商代号只能包含字母、数字、下划线和短横线"),
  name: z
    .string()
    .min(1, "供应商全称不能为空")
    .max(200, "供应商全称长度不能超过200字符"),
  account: z.string().max(100, "银行账户长度不能超过100字符").optional(),
  type: z
    .enum(["material", "processing", "both"], {
      errorMap: () => ({
        message: "供应商类型必须是material、processing或both",
      }),
    })
    .default("material"),
  contact_person: z.string().max(50, "联系人姓名长度不能超过50字符").optional(),
  phone: z.string().max(20, "电话号码长度不能超过20字符").optional(),
  email: z
    .string()
    .optional(),
  address: z.string().max(500, "地址长度不能超过500字符").optional(),
});

// 供应商更新验证Schema
export const updateSupplierSchema = z.object({
  code: z
    .string()
    .min(1, "供应商代号不能为空")
    .max(20, "供应商代号长度不能超过20字符")
    .regex(/^[A-Za-z0-9_-]+$/, "供应商代号只能包含字母、数字、下划线和短横线")
    .optional(),
  name: z
    .string()
    .min(1, "供应商全称不能为空")
    .max(200, "供应商全称长度不能超过200字符")
    .optional(),
  account: z.string().max(100, "银行账户长度不能超过100字符").optional(),
  type: z
    .enum(["material", "processing", "both"], {
      errorMap: () => ({
        message: "供应商类型必须是material、processing或both",
      }),
    })
    .optional(),
  contact_person: z.string().max(50, "联系人姓名长度不能超过50字符").optional(),
  phone: z.string().max(20, "电话号码长度不能超过20字符").optional(),
  email: z
    .string()
    // .email("邮箱格式不正确")
    // .max(100, "邮箱长度不能超过100字符")
    .optional(),
  address: z.string().max(500, "地址长度不能超过500字符").optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

// 查询参数验证Schema
export const querySupplierSchema = z.object({
  page: z.coerce.number().min(1, "页码必须大于0").default(1),
  per_page: z.coerce
    .number()
    .min(1, "每页数量必须大于0")
    .max(100, "每页数量不能超过100")
    .default(10),
  search: z.string().optional(),
  type: z.enum(["material", "processing", "both"]).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  sort: z.string().default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

// ID参数验证
export const idParamSchema = z.object({
  id: z.string().min(1, "供应商ID不能为空"),
});
