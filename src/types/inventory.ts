// 库存批次基础接口
export interface InventoryBatch {
  id: string;
  batchNumber: string; // 批次号
  productId: string; // 产品ID
  productSku: string; // 产品SKU
  productName: string; // 产品名称
  quantity: number; // 当前库存数量
  originalQuantity: number; // 原始入库数量
  unitCost: number; // 实际入库单价
  totalCost: number; // 批次总成本
  inboundDate: Date; // 入库日期
  sourceType: 'purchase' | 'production' | 'adjustment'; // 来源类型
  sourceId?: string; // 来源单据ID（采购单ID或加工单ID）
  expiryDate?: Date; // 过期日期
  location?: string; // 存储位置
  remark?: string; // 备注
  createdAt: Date;
  updatedAt: Date;
}

// 原材料库存批次
export interface RawMaterialBatch extends InventoryBatch {
  sourceType: 'purchase' | 'adjustment';
  purchaseOrderId?: string; // 采购单ID
  supplierId?: string; // 供应商ID
  supplierCode?: string; // 供应商代号
}

// 成品库存批次
export interface FinishedProductBatch extends InventoryBatch {
  sourceType: 'production' | 'adjustment';
  productionOrderId?: string; // 加工单ID
  productionCost: number; // 生产成本
}

// 库存移动记录
export interface InventoryMovement {
  id: string;
  batchId: string; // 批次ID
  movementType: 'inbound' | 'outbound' | 'adjustment'; // 移动类型
  quantity: number; // 移动数量（正数为入库，负数为出库）
  unitCost: number; // 单位成本
  totalCost: number; // 总成本
  remainingQuantity: number; // 移动后剩余数量
  sourceType: 'purchase' | 'production' | 'consumption' | 'adjustment'; // 来源类型
  sourceId?: string; // 来源单据ID
  remark?: string; // 备注
  operatorId?: string; // 操作人ID
  operatorName?: string; // 操作人姓名
  createdAt: Date;
}

// 库存汇总视图
export interface InventorySummary {
  productId: string;
  productSku: string;
  productName: string;
  productType: 'raw_material' | 'finished_product';
  totalQuantity: number; // 总库存数量
  totalValue: number; // 总库存价值
  batchCount: number; // 批次数量
  avgUnitCost: number; // 平均单位成本
  oldestBatchDate: Date; // 最早批次日期
  newestBatchDate: Date; // 最新批次日期
  lowStockAlert?: boolean; // 低库存预警
  minStockLevel?: number; // 最低库存水平
}

// 库存查询参数
export interface InventoryFilters {
  page?: number;
  limit?: number;
  search?: string; // 搜索产品SKU或名称
  productType?: 'raw_material' | 'finished_product' | 'all';
  productId?: string;
  supplierId?: string;
  lowStock?: boolean; // 只显示低库存
  hasStock?: boolean; // 只显示有库存的
}

// 批次查询参数
export interface BatchFilters {
  page?: number;
  limit?: number;
  search?: string;
  batchNumber?: string;
  productSku?: string;
  productId?: string;
  sourceType?: 'purchase' | 'production' | 'adjustment' | 'all';
  dateFrom?: Date;
  dateTo?: Date;
}

// 移动记录查询参数
export interface MovementFilters {
  page?: number;
  limit?: number;
  search?: string;
  movementNumber?: string;
  batchNumber?: string;
  productSku?: string;
  productId?: string;
  batchId?: string;
  type?: 'inbound' | 'outbound' | 'transfer_in' | 'transfer_out' | 'adjustment_in' | 'adjustment_out' | 'all';
  sourceType?: 'purchase' | 'production' | 'consumption' | 'adjustment' | 'transfer' | 'all';
  dateFrom?: Date;
  dateTo?: Date;
}

// 库存调整表单数据
export interface InventoryAdjustmentFormData {
  productId: string;
  adjustmentType: 'increase' | 'decrease';
  quantity: number;
  unitCost: number; // 增加库存时必须大于0
  reason: string;
  remark?: string;
}

// 库存表格项
export interface InventoryTableItem {
  productId: string;
  productSku: string;
  productName: string;
  productType: 'raw_material' | 'finished_product' | 'all';
  totalQuantity: number;
  totalValue: number;
  batchCount: number;
  avgUnitCost: number;
  oldestBatchDate: string;
  lowStockAlert: boolean;
}

// 批次表格项
export interface BatchTableItem {
  id: string;
  batchNumber: string;
  productSku: string;
  productName: string;
  quantity: number;
  originalQuantity: number;
  unitCost: number;
  totalCost: number;
  inboundDate: string;
  sourceType: 'purchase' | 'production' | 'adjustment' | 'all';
  sourceId?: string;
  supplierCode?: string;
  location?: string;
}

// 库存移动表格项
export interface MovementTableItem {
  id: string;
  movementNumber: string;
  batchNumber: string;
  productSku: string;
  productName: string;
  type: 'inbound' | 'outbound' | 'transfer_in' | 'transfer_out' | 'adjustment_in' | 'adjustment_out' | 'all';
  quantity: number;
  unitCost: number;
  totalCost: number;
  remainingQuantity: number;
  sourceType: 'purchase' | 'production' | 'consumption' | 'adjustment' | 'transfer' | 'all';
  sourceReference?: string;
  fromLocation?: string;
  toLocation?: string;
  operatorName?: string;
  movementDate: string;
}

// API响应类型
export interface InventoryResponse {
  inventories: InventorySummary[];
  total_inventories: number;
  page: number;
  limit: number;
}

export interface BatchResponse {
  batches: (RawMaterialBatch | FinishedProductBatch)[];
  total_batches: number;
  page: number;
  limit: number;
}

export interface MovementResponse {
  movements: InventoryMovement[];
  total_movements: number;
  page: number;
  limit: number;
}
