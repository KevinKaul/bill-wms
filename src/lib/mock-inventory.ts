import { 
  RawMaterialBatch,
  FinishedProductBatch,
  InventoryMovement,
  InventorySummary,
  InventoryFilters,
  BatchFilters,
  InventoryResponse,
  BatchResponse,
  MovementResponse,
  InventoryAdjustmentFormData
} from '@/types/inventory';

// 模拟原材料库存批次数据
const mockRawMaterialBatches: RawMaterialBatch[] = [
  {
    id: '1',
    batchNumber: 'B20240115001',
    productId: '1',
    productSku: 'RAW001',
    productName: '原材料A',
    quantity: 80,
    originalQuantity: 100,
    unitCost: 15.75,
    totalCost: 1575.00,
    inboundDate: new Date('2024-01-15'),
    sourceType: 'purchase',
    sourceId: '1',
    purchaseOrderId: '1',
    supplierId: '1',
    supplierCode: 'SUP001',
    location: 'A区-01-01',
    remark: '采购入库',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: '2',
    batchNumber: 'B20240120001',
    productId: '2',
    productSku: 'RAW002',
    productName: '原材料B',
    quantity: 45,
    originalQuantity: 50,
    unitCost: 26.50,
    totalCost: 1325.00,
    inboundDate: new Date('2024-01-20'),
    sourceType: 'purchase',
    sourceId: '1',
    purchaseOrderId: '1',
    supplierId: '1',
    supplierCode: 'SUP001',
    location: 'A区-01-02',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-25')
  },
  {
    id: '3',
    batchNumber: 'B20240128001',
    productId: '3',
    productSku: 'RAW003',
    productName: '原材料C',
    quantity: 80,
    originalQuantity: 80,
    unitCost: 24.50,
    totalCost: 1960.00,
    inboundDate: new Date('2024-01-28'),
    sourceType: 'purchase',
    sourceId: '2',
    purchaseOrderId: '2',
    supplierId: '2',
    supplierCode: 'SUP002',
    location: 'A区-02-01',
    createdAt: new Date('2024-01-28'),
    updatedAt: new Date('2024-01-28')
  },
  {
    id: '4',
    batchNumber: 'B20240201001',
    productId: '1',
    productSku: 'RAW001',
    productName: '原材料A',
    quantity: 150,
    originalQuantity: 200,
    unitCost: 15.25,
    totalCost: 3050.00,
    inboundDate: new Date('2024-02-01'),
    sourceType: 'purchase',
    sourceId: '3',
    purchaseOrderId: '3',
    supplierId: '3',
    supplierCode: 'SUP003',
    location: 'A区-01-03',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-05')
  }
];

// 模拟成品库存批次数据
const mockFinishedProductBatches: FinishedProductBatch[] = [
  {
    id: '5',
    batchNumber: 'F20240125001',
    productId: '5',
    productSku: 'FIN001',
    productName: '花环A',
    quantity: 48,
    originalQuantity: 50,
    unitCost: 45.80,
    totalCost: 2290.00,
    productionCost: 2290.00,
    inboundDate: new Date('2024-01-25'),
    sourceType: 'production',
    sourceId: 'P001',
    productionOrderId: 'P001',
    location: 'B区-01-01',
    remark: '生产入库',
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-30')
  },
  {
    id: '6',
    batchNumber: 'F20240205001',
    productId: '6',
    productSku: 'FIN002',
    productName: '花环B',
    quantity: 30,
    originalQuantity: 30,
    unitCost: 52.30,
    totalCost: 1569.00,
    productionCost: 1569.00,
    inboundDate: new Date('2024-02-05'),
    sourceType: 'production',
    sourceId: 'P002',
    productionOrderId: 'P002',
    location: 'B区-01-02',
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-02-05')
  }
];

// 模拟库存移动记录
const mockInventoryMovements: InventoryMovement[] = [
  {
    id: '1',
    batchId: '1',
    movementType: 'inbound',
    quantity: 100,
    unitCost: 15.75,
    totalCost: 1575.00,
    remainingQuantity: 100,
    sourceType: 'purchase',
    sourceId: '1',
    remark: '采购入库',
    operatorName: '系统',
    createdAt: new Date('2024-01-15')
  },
  {
    id: '2',
    batchId: '1',
    movementType: 'outbound',
    quantity: -20,
    unitCost: 15.75,
    totalCost: -315.00,
    remainingQuantity: 80,
    sourceType: 'consumption',
    sourceId: 'P001',
    remark: '生产消耗',
    operatorName: '系统',
    createdAt: new Date('2024-01-20')
  },
  {
    id: '3',
    batchId: '2',
    movementType: 'inbound',
    quantity: 50,
    unitCost: 26.50,
    totalCost: 1325.00,
    remainingQuantity: 50,
    sourceType: 'purchase',
    sourceId: '1',
    remark: '采购入库',
    operatorName: '系统',
    createdAt: new Date('2024-01-20')
  },
  {
    id: '4',
    batchId: '2',
    movementType: 'outbound',
    quantity: -5,
    unitCost: 26.50,
    totalCost: -132.50,
    remainingQuantity: 45,
    sourceType: 'consumption',
    sourceId: 'P001',
    remark: '生产消耗',
    operatorName: '系统',
    createdAt: new Date('2024-01-25')
  },
  {
    id: '5',
    batchId: '5',
    movementType: 'inbound',
    quantity: 50,
    unitCost: 45.80,
    totalCost: 2290.00,
    remainingQuantity: 50,
    sourceType: 'production',
    sourceId: 'P001',
    remark: '生产入库',
    operatorName: '系统',
    createdAt: new Date('2024-01-25')
  },
  {
    id: '6',
    batchId: '5',
    movementType: 'outbound',
    quantity: -2,
    unitCost: 45.80,
    totalCost: -91.60,
    remainingQuantity: 48,
    sourceType: 'adjustment',
    remark: '质量问题调整',
    operatorName: '张三',
    createdAt: new Date('2024-01-30')
  }
];

// 模拟API延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 计算库存汇总数据
const calculateInventorySummary = (): InventorySummary[] => {
  const allBatches = [...mockRawMaterialBatches, ...mockFinishedProductBatches];
  const summaryMap = new Map<string, InventorySummary>();

  allBatches.forEach(batch => {
    const key = batch.productId;
    if (!summaryMap.has(key)) {
      summaryMap.set(key, {
        productId: batch.productId,
        productSku: batch.productSku,
        productName: batch.productName,
        productType: batch.productSku.startsWith('RAW') ? 'raw_material' : 'finished_product',
        totalQuantity: 0,
        totalValue: 0,
        batchCount: 0,
        avgUnitCost: 0,
        oldestBatchDate: batch.inboundDate,
        newestBatchDate: batch.inboundDate,
        lowStockAlert: false,
        minStockLevel: 10
      });
    }

    const summary = summaryMap.get(key)!;
    summary.totalQuantity += batch.quantity;
    summary.totalValue += batch.quantity * batch.unitCost;
    summary.batchCount += 1;
    
    if (batch.inboundDate < summary.oldestBatchDate) {
      summary.oldestBatchDate = batch.inboundDate;
    }
    if (batch.inboundDate > summary.newestBatchDate) {
      summary.newestBatchDate = batch.inboundDate;
    }
  });

  // 计算平均成本和低库存预警
  summaryMap.forEach(summary => {
    summary.avgUnitCost = summary.totalQuantity > 0 ? summary.totalValue / summary.totalQuantity : 0;
    summary.lowStockAlert = summary.totalQuantity <= (summary.minStockLevel || 10);
  });

  return Array.from(summaryMap.values());
};

// 模拟库存API
export const fakeInventoryApi = {
  // 获取库存汇总列表
  async getInventorySummary(filters: InventoryFilters = {}): Promise<InventoryResponse> {
    await delay(300);
    
    const { page = 1, limit = 10, search, productType, lowStock, hasStock } = filters;
    
    let inventories = calculateInventorySummary();
    
    // 搜索过滤
    if (search) {
      const searchLower = search.toLowerCase();
      inventories = inventories.filter(inv =>
        inv.productSku.toLowerCase().includes(searchLower) ||
        inv.productName.toLowerCase().includes(searchLower)
      );
    }
    
    // 产品类型过滤
    if (productType && productType !== 'all') {
      inventories = inventories.filter(inv => inv.productType === productType);
    }
    
    // 低库存过滤
    if (lowStock) {
      inventories = inventories.filter(inv => inv.lowStockAlert);
    }
    
    // 有库存过滤
    if (hasStock) {
      inventories = inventories.filter(inv => inv.totalQuantity > 0);
    }
    
    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedInventories = inventories.slice(startIndex, endIndex);
    
    return {
      inventories: paginatedInventories,
      total_inventories: inventories.length,
      page,
      limit
    };
  },

  // 获取批次列表
  async getBatches(filters: BatchFilters = {}): Promise<BatchResponse> {
    await delay(300);
    
    const { page = 1, limit = 10, search, productId, sourceType } = filters;
    
    let batches = [...mockRawMaterialBatches, ...mockFinishedProductBatches];
    
    // 搜索过滤
    if (search) {
      const searchLower = search.toLowerCase();
      batches = batches.filter(batch =>
        batch.batchNumber.toLowerCase().includes(searchLower) ||
        batch.productSku.toLowerCase().includes(searchLower) ||
        batch.productName.toLowerCase().includes(searchLower)
      );
    }
    
    // 产品过滤
    if (productId) {
      batches = batches.filter(batch => batch.productId === productId);
    }
    
    // 来源类型过滤
    if (sourceType && sourceType !== 'all') {
      batches = batches.filter(batch => batch.sourceType === sourceType);
    }
    
    // 按入库日期倒序排列
    batches.sort((a, b) => b.inboundDate.getTime() - a.inboundDate.getTime());
    
    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedBatches = batches.slice(startIndex, endIndex);
    
    return {
      batches: paginatedBatches,
      total_batches: batches.length,
      page,
      limit
    };
  },

  // 获取库存移动记录
  async getMovements(filters: any = {}): Promise<MovementResponse> {
    await delay(300);
    
    const { page = 1, limit = 10, batchId, movementType, sourceType } = filters;
    
    let movements = [...mockInventoryMovements];
    
    // 批次过滤
    if (batchId) {
      movements = movements.filter(movement => movement.batchId === batchId);
    }
    
    // 移动类型过滤
    if (movementType && movementType !== 'all') {
      movements = movements.filter(movement => movement.movementType === movementType);
    }
    
    // 来源类型过滤
    if (sourceType && sourceType !== 'all') {
      movements = movements.filter(movement => movement.sourceType === sourceType);
    }
    
    // 按时间倒序排列
    movements.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedMovements = movements.slice(startIndex, endIndex);
    
    return {
      movements: paginatedMovements,
      total_movements: movements.length,
      page,
      limit
    };
  },

  // 库存调整
  async adjustInventory(data: InventoryAdjustmentFormData): Promise<void> {
    await delay(500);
    
    // 简化处理，实际应该创建新的批次或移动记录
    console.log('库存调整:', data);
    
    // 模拟调整成功
    return;
  },

  // 根据产品ID获取批次列表（用于FIFO消耗）
  async getBatchesByProductId(productId: string): Promise<RawMaterialBatch[]> {
    await delay(200);
    
    const batches = mockRawMaterialBatches
      .filter(batch => batch.productId === productId && batch.quantity > 0)
      .sort((a, b) => a.inboundDate.getTime() - b.inboundDate.getTime()); // FIFO排序
    
    return batches;
  }
};

// 导出批次查询函数
export async function getBatches(params: {
  page?: number;
  per_page?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  filters?: any;
}) {
  const { page = 1, per_page = 10, sort = 'inboundDate', order = 'desc', filters = {} } = params;
  
  await delay(300);
  
  let batches = [...mockRawMaterialBatches];
  
  // 搜索过滤
  if (filters.batchNumber) {
    batches = batches.filter(batch => 
      batch.batchNumber.toLowerCase().includes(filters.batchNumber.toLowerCase())
    );
  }
  
  if (filters.productSku) {
    batches = batches.filter(batch => 
      batch.productSku.toLowerCase().includes(filters.productSku.toLowerCase())
    );
  }
  
  if (filters.sourceType) {
    batches = batches.filter(batch => batch.sourceType === filters.sourceType);
  }
  
  if (filters.productId) {
    batches = batches.filter(batch => batch.productId === filters.productId);
  }
  
  // 排序
  batches.sort((a, b) => {
    const aValue = sort === 'inboundDate' ? a.inboundDate.getTime() : a[sort as keyof typeof a];
    const bValue = sort === 'inboundDate' ? b.inboundDate.getTime() : b[sort as keyof typeof b];
    
    // 处理可能的 undefined 值
    if (aValue === undefined && bValue === undefined) return 0;
    if (aValue === undefined) return order === 'asc' ? -1 : 1;
    if (bValue === undefined) return order === 'asc' ? 1 : -1;
    
    if (order === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
  
  // 分页
  const startIndex = (page - 1) * per_page;
  const endIndex = startIndex + per_page;
  const paginatedBatches = batches.slice(startIndex, endIndex);
  
  // 转换为表格项格式
  const batchTableItems = paginatedBatches.map(batch => ({
    id: batch.id,
    batchNumber: batch.batchNumber,
    productSku: batch.productSku,
    productName: batch.productName,
    quantity: batch.quantity,
    originalQuantity: batch.originalQuantity,
    unitCost: batch.unitCost,
    totalCost: batch.totalCost,
    inboundDate: batch.inboundDate.toISOString(),
    sourceType: batch.sourceType,
    sourceId: batch.sourceId,
    supplierCode: batch.supplierCode,
    location: batch.location
  }));
  
  return {
    batches: batchTableItems,
    total: batches.length
  };
}

// 导出移动记录查询函数
export async function getMovements(params: {
  page?: number;
  per_page?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  filters?: any;
}) {
  const { page = 1, per_page = 10, sort = 'createdAt', order = 'desc', filters = {} } = params;
  
  await delay(300);
  
  let movements = [...mockInventoryMovements];
  
  // 搜索过滤
  if (filters.movementNumber) {
    movements = movements.filter(movement => 
      movement.id.toLowerCase().includes(filters.movementNumber.toLowerCase())
    );
  }
  
  if (filters.batchNumber) {
    // 需要通过批次ID找到批次号
    const matchingBatches = mockRawMaterialBatches.filter(batch =>
      batch.batchNumber.toLowerCase().includes(filters.batchNumber.toLowerCase())
    );
    const batchIds = matchingBatches.map(batch => batch.id);
    movements = movements.filter(movement => batchIds.includes(movement.batchId));
  }
  
  if (filters.productSku) {
    const matchingBatches = mockRawMaterialBatches.filter(batch =>
      batch.productSku.toLowerCase().includes(filters.productSku.toLowerCase())
    );
    const batchIds = matchingBatches.map(batch => batch.id);
    movements = movements.filter(movement => batchIds.includes(movement.batchId));
  }
  
  if (filters.type) {
    movements = movements.filter(movement => movement.movementType === filters.type);
  }
  
  if (filters.sourceType) {
    movements = movements.filter(movement => movement.sourceType === filters.sourceType);
  }
  
  if (filters.batchId) {
    movements = movements.filter(movement => movement.batchId === filters.batchId);
  }
  
  if (filters.productId) {
    const matchingBatches = mockRawMaterialBatches.filter(batch => batch.productId === filters.productId);
    const batchIds = matchingBatches.map(batch => batch.id);
    movements = movements.filter(movement => batchIds.includes(movement.batchId));
  }
  
  // 排序
  movements.sort((a, b) => {
    type Comparable = number | string | null;
    const getComparable = (m: typeof a): Comparable => {
      const raw = sort === 'createdAt' ? m.createdAt : (m as any)?.[sort];
      if (raw == null) return null;
      if (raw instanceof Date) return raw.getTime();
      if (typeof raw === 'number') return raw;
      if (typeof raw === 'string') return raw.toLowerCase();
      return null;
    };

    const av = getComparable(a);
    const bv = getComparable(b);

    // 处理空值：将 null 视为最小值
    if (av === null && bv === null) return 0;
    if (av === null) return order === 'asc' ? -1 : 1;
    if (bv === null) return order === 'asc' ? 1 : -1;

    if (typeof av === 'string' && typeof bv === 'string') {
      const cmp = av.localeCompare(bv);
      return order === 'asc' ? cmp : -cmp;
    }

    // 数值比较（包括日期被转换为时间戳）
    const diff = (av as number) - (bv as number);
    if (diff === 0) return 0;
    return order === 'asc' ? (diff > 0 ? 1 : -1) : (diff > 0 ? -1 : 1);
  });
  
  // 分页
  const startIndex = (page - 1) * per_page;
  const endIndex = startIndex + per_page;
  const paginatedMovements = movements.slice(startIndex, endIndex);
  
  // 转换为表格项格式
  const movementTableItems = paginatedMovements.map(movement => {
    const batch = mockRawMaterialBatches.find(b => b.id === movement.batchId);
    return {
      id: movement.id,
      movementNumber: `MOV${movement.id.padStart(8, '0')}`,
      batchNumber: batch?.batchNumber || '',
      productSku: batch?.productSku || '',
      productName: batch?.productName || '',
      type: movement.movementType as any,
      quantity: movement.quantity,
      unitCost: movement.unitCost,
      totalCost: movement.totalCost,
      remainingQuantity: movement.remainingQuantity,
      sourceType: movement.sourceType,
      sourceReference: movement.sourceId,
      fromLocation: undefined,
      toLocation: batch?.location,
      operatorName: movement.operatorName,
      movementDate: movement.createdAt.toISOString()
    };
  });
  
  return {
    movements: movementTableItems,
    total: movements.length
  };
}
