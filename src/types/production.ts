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
  unitCost: number; // 加权平均单价
  totalCost: number; // 总成本
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
  | 'pending'         // 待处理
  | 'in_progress'     // 进行中
  | 'completed';      // 已完成

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
  orderDate?: string;
  startDate?: string;
  completionDate?: string;
  qualityStatus?: string;
  remark?: string;
  updatedAt?: string;
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
