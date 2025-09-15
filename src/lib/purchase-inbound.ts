import { PurchaseOrder } from '@/types/purchase';

// 原材料批次接口
export interface RawMaterialBatch {
  batchId: string;
  batchNumber: string;
  materialId: string;
  materialSku: string;
  materialName: string;
  quantity: number;
  unitCost: number; // 实际入库单价（含分摊费用）
  totalCost: number;
  originalUnitPrice: number; // 原始采购单价
  allocatedAdditionalCost: number; // 分摊的附加费用
  sourceType: 'purchase';
  sourceReference: string; // 采购单号
  supplierId: string;
  supplierName: string;
  inboundDate: string;
  location?: string;
}

// 入库结果
export interface InboundResult {
  purchaseOrderId: string;
  batches: RawMaterialBatch[];
  totalCost: number;
  totalQuantity: number;
}

// 模拟原材料批次存储
const mockRawMaterialBatches: RawMaterialBatch[] = [
  // 预设一些测试数据
  {
    batchId: 'BATCH001',
    batchNumber: 'B20241201001',
    materialId: '1',
    materialSku: 'RAW001',
    materialName: '原材料A',
    quantity: 80,
    unitCost: 15.50,
    totalCost: 1240.00,
    originalUnitPrice: 15.00,
    allocatedAdditionalCost: 40.00,
    sourceType: 'purchase',
    sourceReference: 'PO20241201001',
    supplierId: 'SUP001',
    supplierName: '供应商A',
    inboundDate: '2024-12-01T10:00:00Z',
    location: 'A01-01-01'
  },
  {
    batchId: 'BATCH002',
    batchNumber: 'B20241205001',
    materialId: '1',
    materialSku: 'RAW001',
    materialName: '原材料A',
    quantity: 70,
    unitCost: 16.00,
    totalCost: 1120.00,
    originalUnitPrice: 15.80,
    allocatedAdditionalCost: 14.00,
    sourceType: 'purchase',
    sourceReference: 'PO20241205001',
    supplierId: 'SUP001',
    supplierName: '供应商A',
    inboundDate: '2024-12-05T14:30:00Z',
    location: 'A01-01-02'
  }
];

/**
 * 采购单到货入库处理
 * 按照README需求实现成本分摊和批次生成
 */
export async function processPurchaseInbound(purchaseOrder: PurchaseOrder): Promise<InboundResult> {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 500));

  if (purchaseOrder.arrivalStatus !== 'DELIVERED') {
    throw new Error('只能对已到货的采购单执行入库操作');
  }

  // 1. 计算所有SKU总价之和
  const totalSkuValue = purchaseOrder.items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // 2. 为每个SKU计算分摊比例和实际成本
  const batches: RawMaterialBatch[] = [];
  
  for (const item of purchaseOrder.items) {
    // 计算分摊比例
    const allocationRatio = item.totalPrice / totalSkuValue;
    
    // 计算分摊的附加费用
    const allocatedAdditionalCost = purchaseOrder.additionalCost * allocationRatio;
    
    // 计算实际总成本
    const actualTotalCost = item.totalPrice + allocatedAdditionalCost;
    
    // 计算实际入库单价
    const actualUnitCost = actualTotalCost / item.quantity;
    
    // 生成批次号
    const batchNumber = generateBatchNumber(purchaseOrder.orderNumber, item.productSku);
    
    // 创建批次记录
    const batch: RawMaterialBatch = {
      batchId: `BATCH_${Date.now()}_${item.productId}`,
      batchNumber,
      materialId: item.productId,
      materialSku: item.productSku,
      materialName: item.productName,
      quantity: item.quantity,
      unitCost: Math.round(actualUnitCost * 100) / 100,
      totalCost: Math.round(actualTotalCost * 100) / 100,
      originalUnitPrice: item.unitPrice,
      allocatedAdditionalCost: Math.round(allocatedAdditionalCost * 100) / 100,
      sourceType: 'purchase',
      sourceReference: purchaseOrder.orderNumber,
      supplierId: purchaseOrder.supplierId,
      supplierName: purchaseOrder.supplierName,
      inboundDate: new Date().toISOString(),
      location: generateStorageLocation(item.productSku)
    };
    
    batches.push(batch);
    
    // 添加到模拟存储
    mockRawMaterialBatches.push(batch);
  }
  
  const totalCost = batches.reduce((sum, batch) => sum + batch.totalCost, 0);
  const totalQuantity = batches.reduce((sum, batch) => sum + batch.quantity, 0);
  
  return {
    purchaseOrderId: purchaseOrder.id,
    batches,
    totalCost: Math.round(totalCost * 100) / 100,
    totalQuantity
  };
}

/**
 * 生成批次号
 * 格式：B + 日期(YYYYMMDD) + SKU后缀 + 序号
 */
function generateBatchNumber(purchaseOrderNumber: string, productSku: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const skuSuffix = productSku.slice(-3); // 取SKU后3位
  const sequence = String(mockRawMaterialBatches.length + 1).padStart(3, '0');
  return `B${date}${skuSuffix}${sequence}`;
}

/**
 * 生成存储位置
 * 简化实现：根据SKU分配不同的库位
 */
function generateStorageLocation(productSku: string): string {
  const locationMap: Record<string, string> = {
    'RAW001': 'A01-01',
    'RAW002': 'A01-02',
    'RAW003': 'A02-01',
    'RAW004': 'A02-02'
  };
  
  const baseLocation = locationMap[productSku] || 'A03-01';
  const slot = String(Math.floor(Math.random() * 10) + 1).padStart(2, '0');
  return `${baseLocation}-${slot}`;
}

/**
 * 获取原材料批次列表
 */
export function getRawMaterialBatches(filters?: {
  materialId?: string;
  supplierId?: string;
  dateFrom?: string;
  dateTo?: string;
}): RawMaterialBatch[] {
  let batches = [...mockRawMaterialBatches];
  
  if (filters) {
    if (filters.materialId) {
      batches = batches.filter(batch => batch.materialId === filters.materialId);
    }
    
    if (filters.supplierId) {
      batches = batches.filter(batch => batch.supplierId === filters.supplierId);
    }
    
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      batches = batches.filter(batch => new Date(batch.inboundDate) >= fromDate);
    }
    
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      batches = batches.filter(batch => new Date(batch.inboundDate) <= toDate);
    }
  }
  
  return batches.sort((a, b) => new Date(b.inboundDate).getTime() - new Date(a.inboundDate).getTime());
}

/**
 * 获取原材料库存汇总
 */
export function getRawMaterialInventorySummary(materialId: string) {
  const batches = getRawMaterialBatches({ materialId });
  
  const totalQuantity = batches.reduce((sum, batch) => sum + batch.quantity, 0);
  const totalValue = batches.reduce((sum, batch) => sum + batch.totalCost, 0);
  const avgUnitCost = totalQuantity > 0 ? totalValue / totalQuantity : 0;
  const batchCount = batches.length;
  
  return {
    materialId,
    totalQuantity,
    totalValue: Math.round(totalValue * 100) / 100,
    avgUnitCost: Math.round(avgUnitCost * 100) / 100,
    batchCount
  };
}

/**
 * 获取批次详情
 */
export function getBatchDetail(batchId: string): RawMaterialBatch | null {
  return mockRawMaterialBatches.find(batch => batch.batchId === batchId) || null;
}

/**
 * 更新批次库存数量（用于出库）
 */
export function updateBatchQuantity(batchId: string, newQuantity: number): boolean {
  const batch = mockRawMaterialBatches.find(b => b.batchId === batchId);
  if (batch && newQuantity >= 0) {
    batch.quantity = newQuantity;
    return true;
  }
  return false;
}
