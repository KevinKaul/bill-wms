// 采购单状态
export type PurchaseOrderStatus = 'draft' | 'confirmed' | 'completed' | 'cancelled';

// 付款状态
export type PaymentStatus = 'unpaid' | 'paid';

// 到货状态
export type DeliveryStatus = 'pending' | 'delivered' | 'arrived';

// 兼容字段别名
export type ArrivalStatus = DeliveryStatus;

// 采购单明细项
export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string; // 关联产品ID
  productSku: string; // 产品SKU
  productName: string; // 产品名称
  quantity: number; // 采购数量
  unitPrice: number; // 采购单价
  totalPrice: number; // SKU总价 (quantity × unitPrice)
  createdAt: Date;
  updatedAt: Date;
}

// 采购单
export interface PurchaseOrder {
  id: string;
  orderNumber: string; // 采购单号
  supplierId: string; // 供应商ID
  supplierCode: string; // 供应商代号
  supplierName: string; // 供应商名称
  status: PurchaseOrderStatus; // 采购单状态
  paymentStatus: PaymentStatus; // 付款状态
  deliveryStatus: DeliveryStatus; // 到货状态
  arrivalStatus: DeliveryStatus; // 到货状态别名，兼容性字段
  additionalCost: number; // 附加价格（如运费）
  subtotal: number; // 所有SKU总价之和
  totalAmount: number; // 采购单总价 (subtotal + additionalCost)
  orderDate: Date; // 下单日期
  expectedDeliveryDate?: Date; // 预计到货日期
  actualDeliveryDate?: Date; // 实际到货日期
  remark?: string; // 备注
  items: PurchaseOrderItem[]; // 采购明细
  createdAt: Date;
  updatedAt: Date;
}

// 采购计划
export interface PurchasePlan {
  id: string;
  planNumber: string; // 计划编号
  title: string; // 计划标题
  description?: string; // 计划描述
  status: 'draft' | 'approved' | 'executed' | 'cancelled';
  planDate: Date; // 计划日期
  expectedExecutionDate?: Date; // 预计执行日期
  items: PurchasePlanItem[]; // 计划明细
  createdAt: Date;
  updatedAt: Date;
}

// 采购计划明细项
export interface PurchasePlanItem {
  id: string;
  purchasePlanId: string;
  productId: string; // 关联产品ID
  productSku: string; // 产品SKU
  productName: string; // 产品名称
  plannedQuantity: number; // 计划采购量
  estimatedUnitPrice: number; // 预估单价
  estimatedTotalPrice: number; // 预估总价
  priority: 'low' | 'medium' | 'high'; // 优先级
  remark?: string; // 备注
  createdAt: Date;
  updatedAt: Date;
}

// 采购单表单数据
export interface PurchaseOrderFormData {
  supplierId: string;
  additionalCost: number;
  expectedDeliveryDate?: Date;
  remark?: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
}

// 采购计划表单数据
export interface PurchasePlanFormData {
  title: string;
  description?: string;
  planDate: Date;
  expectedExecutionDate?: Date;
  items: {
    productId: string;
    plannedQuantity: number;
    estimatedUnitPrice: number;
    priority: 'low' | 'medium' | 'high';
    remark?: string;
  }[];
}

// 采购单表格项
export interface PurchaseOrderTableItem {
  id: string;
  orderNumber: string;
  supplierCode: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus;
  totalAmount: number;
  itemCount: number; // 明细项数量
  orderDate: string;
  expectedDeliveryDate?: string;
}

// 采购计划表格项
export interface PurchasePlanTableItem {
  id: string;
  planNumber: string;
  title: string;
  status: 'draft' | 'approved' | 'executed' | 'cancelled';
  itemCount: number; // 明细项数量
  estimatedTotal: number; // 预估总金额
  planDate: string;
  expectedExecutionDate?: string;
}

// 采购查询参数
export interface PurchaseOrderFilters {
  page?: number;
  limit?: number;
  search?: string; // 搜索采购单号或供应商
  status?: PurchaseOrderStatus;
  paymentStatus?: PaymentStatus;
  deliveryStatus?: DeliveryStatus;
  supplierId?: string;
}

// 采购计划查询参数
export interface PurchasePlanFilters {
  page?: number;
  limit?: number;
  search?: string; // 搜索计划编号或标题
  status?: 'draft' | 'approved' | 'executed' | 'cancelled';
}

// 采购单API响应
export interface PurchaseOrderResponse {
  orders: PurchaseOrder[];
  total_orders: number;
  page: number;
  limit: number;
}

// 采购计划API响应
export interface PurchasePlanResponse {
  plans: PurchasePlan[];
  total_plans: number;
  page: number;
  limit: number;
}
