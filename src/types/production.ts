export interface ProductionOrder {
  id: string;
  orderNumber: string;
  productId: string;
  productSku: string;
  productName: string;
  plannedQuantity: number;
  actualQuantity?: number;
  status: ProductionStatus;
  paymentStatus: PaymentStatus;
  supplierId?: string;
  supplierName?: string;
  materialCost: number;
  processingFee: number;
  totalCost: number;
  createdAt: string;
  completedAt?: string;
  remark?: string;
}

export interface ProductionOrderItem {
  id: string;
  productionOrderId: string;
  materialId: string;
  materialSku: string;
  materialName: string;
  requiredQuantity: number;
  allocatedQuantity: number;
  unitCost: number;
  totalCost: number;
  batchAllocations: BatchAllocation[];
}

export interface BatchAllocation {
  batchId: string;
  batchNumber: string;
  allocatedQuantity: number;
  unitCost: number;
  totalCost: number;
}

export interface MaterialRequirement {
  materialId: string;
  materialSku: string;
  materialName: string;
  requiredQuantity: number;
  availableQuantity: number;
  shortfall: number;
  bomQuantity?: number; // BOM中配置的单位用量
}

export interface BOMItem {
  id: string;
  productId: string;
  materialId: string;
  materialSku: string;
  materialName: string;
  quantity: number;
  unit: string;
}

export type ProductionStatus = 
  | 'draft'           // 草稿
  | 'confirmed'       // 已确认
  | 'in_progress'     // 生产中
  | 'completed'       // 已完成
  | 'cancelled';      // 已取消

export type PaymentStatus = 
  | 'unpaid'          // 未付款
  | 'paid';           // 已付款

// 表格相关类型
export interface ProductionOrderTableItem {
  id: string;
  orderNumber: string;
  productInfo: {
    sku: string;
    name: string;
  };
  plannedQuantity: number;
  actualQuantity?: number;
  status: ProductionStatus;
  paymentStatus: PaymentStatus;
  supplierName?: string;
  materialCost: number;
  processingFee: number;
  totalCost: number;
  createdAt: string;
  completedAt?: string;
}

// 筛选器类型
export interface ProductionOrderFilters {
  status?: ProductionStatus | 'all';
  paymentStatus?: PaymentStatus | 'all';
  supplierId?: string;
  productId?: string;
  dateRange?: {
    from: string;
    to: string;
  };
  search?: string;
}

// 表单数据类型
export interface ProductionOrderFormData {
  productId: string;
  plannedQuantity: number;
  supplierId?: string;
  processingFee: number;
  remark?: string;
}

// API 响应类型
export interface ProductionOrdersResponse {
  orders: ProductionOrderTableItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MaterialRequirementsResponse {
  requirements: MaterialRequirement[];
  canProduce: boolean;
  maxProducibleQuantity: number;
}
