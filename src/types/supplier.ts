// 供应商基础信息
export interface Supplier {
  id: string;
  code: string; // 简称/代号
  name: string; // 供应商全称
  account: string; // 账号
  contactPerson?: string; // 联系人
  phone?: string; // 联系电话
  email?: string; // 邮箱
  address?: string; // 地址
  remark?: string; // 备注
  createdAt: Date;
  updatedAt: Date;
}

// 供应商表单数据
export interface SupplierFormData {
  code: string;
  name: string;
  account: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  remark?: string;
}

// 供应商表格项
export interface SupplierTableItem {
  id: string;
  code: string;
  name: string;
  account: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  createdAt: string;
}

// 供应商查询参数
export interface SupplierFilters {
  page?: number;
  limit?: number;
  search?: string; // 搜索供应商代号或名称
}

// 供应商API响应
export interface SupplierResponse {
  suppliers: Supplier[];
  total_suppliers: number;
  page: number;
  limit: number;
}
