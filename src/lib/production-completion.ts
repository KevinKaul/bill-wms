
// 成品批次接口
export interface FinishedProductBatch {
  batchId: string;
  batchNumber: string;
  productId: string;
  productSku: string;
  productName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  sourceType: 'production';
  sourceReference: string; // 加工单号
  inboundDate: string;
  location?: string;
}

// 加工完成结果
export interface ProductionCompletionResult {
  productionOrderId: string;
  finishedProductBatch: FinishedProductBatch;
  materialConsumption: MaterialConsumptionRecord[];
  totalMaterialCost: number;
  processingFee: number;
  totalCost: number;
  unitCost: number;
}

// 物料消耗记录
export interface MaterialConsumptionRecord {
  materialId: string;
  materialSku: string;
  materialName: string;
  consumedQuantity: number;
  batchConsumptions: BatchConsumption[];
  totalCost: number;
}

// 批次消耗记录
export interface BatchConsumption {
  batchId: string;
  batchNumber: string;
  consumedQuantity: number;
  unitCost: number;
  totalCost: number;
}

// 模拟成品批次存储
const mockFinishedProductBatches: FinishedProductBatch[] = [];



/**
 * 获取成品批次列表
 */
export function getFinishedProductBatches(productId?: string): FinishedProductBatch[] {
  if (productId) {
    return mockFinishedProductBatches.filter(batch => batch.productId === productId);
  }
  return [...mockFinishedProductBatches];
}

/**
 * 获取成品库存汇总
 */
export function getFinishedProductInventorySummary(productId: string) {
  const batches = getFinishedProductBatches(productId);
  
  const totalQuantity = batches.reduce((sum, batch) => sum + batch.quantity, 0);
  const totalValue = batches.reduce((sum, batch) => sum + batch.totalCost, 0);
  const avgUnitCost = totalQuantity > 0 ? totalValue / totalQuantity : 0;
  const batchCount = batches.length;
  
  return {
    productId,
    totalQuantity,
    totalValue: Math.round(totalValue * 100) / 100,
    avgUnitCost: Math.round(avgUnitCost * 100) / 100,
    batchCount
  };
}

/**
 * 撤销加工完成（用于测试或错误处理）
 */
export function reverseProductionCompletion(completionResult: ProductionCompletionResult): void {
  // 移除成品批次
  const batchIndex = mockFinishedProductBatches.findIndex(
    batch => batch.batchId === completionResult.finishedProductBatch.batchId
  );
  if (batchIndex >= 0) {
    mockFinishedProductBatches.splice(batchIndex, 1);
  }
  
  // 这里还应该恢复原材料批次库存，但由于是模拟数据，暂时省略
  console.log('已撤销加工完成，成品批次已移除');
}
