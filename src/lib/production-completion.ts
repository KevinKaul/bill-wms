import { ProductionOrder } from '@/types/production';
import { allocateMaterialsByFIFO, calculateTotalMaterialCost } from './fifo-allocation';

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
 * 完成加工单并生成成品入库
 * @param productionOrder 加工单信息
 * @param actualQuantity 实际产出数量（可选，默认使用计划数量）
 * @returns 加工完成结果
 */
export async function completeProduction(
  productionOrder: ProductionOrder, 
  actualQuantity?: number
): Promise<ProductionCompletionResult> {
  
  const outputQuantity = actualQuantity || productionOrder.plannedQuantity;
  
  // 1. 获取BOM物料需求（基于实际产出数量）
  const materialRequirements = await getMaterialRequirementsForProduction(
    productionOrder.productId, 
    outputQuantity
  );
  
  // 2. 执行FIFO自动领料
  const allocationResults = allocateMaterialsByFIFO(materialRequirements);
  const actualMaterialCost = calculateTotalMaterialCost(allocationResults);
  
  // 3. 生成物料消耗记录
  const materialConsumption = allocationResults.map(result => ({
    materialId: result.materialId,
    materialSku: result.materialSku,
    materialName: getMaterialName(result.materialId),
    consumedQuantity: result.allocatedQuantity,
    batchConsumptions: result.allocations.map(allocation => ({
      batchId: allocation.batchId,
      batchNumber: allocation.batchNumber,
      consumedQuantity: allocation.allocatedQuantity,
      unitCost: allocation.unitCost,
      totalCost: allocation.totalCost
    })),
    totalCost: result.totalCost
  }));
  
  // 4. 计算成品单位成本
  const totalCost = actualMaterialCost + productionOrder.processingFee;
  const unitCost = Math.round((totalCost / outputQuantity) * 100) / 100;
  
  // 5. 生成成品批次
  const batchNumber = generateFinishedProductBatchNumber(productionOrder.orderNumber);
  const finishedProductBatch: FinishedProductBatch = {
    batchId: `BATCH_FIN_${Date.now()}`,
    batchNumber,
    productId: productionOrder.productId,
    productSku: productionOrder.productSku,
    productName: productionOrder.productName,
    quantity: outputQuantity,
    unitCost,
    totalCost,
    sourceType: 'production',
    sourceReference: productionOrder.orderNumber,
    inboundDate: new Date().toISOString(),
    location: 'A01-01-01' // 默认成品库位
  };
  
  // 6. 保存成品批次到库存
  mockFinishedProductBatches.push(finishedProductBatch);
  
  // 7. 返回完成结果
  return {
    productionOrderId: productionOrder.id,
    finishedProductBatch,
    materialConsumption,
    totalMaterialCost: actualMaterialCost,
    processingFee: productionOrder.processingFee,
    totalCost,
    unitCost
  };
}

/**
 * 获取生产所需的物料需求
 */
async function getMaterialRequirementsForProduction(productId: string, quantity: number) {
  // 模拟BOM数据
  const bomData = [
    { productId: '3', materialId: '1', materialSku: 'RAW001', materialName: '原材料A', quantity: 10 },
    { productId: '3', materialId: '2', materialSku: 'RAW002', materialName: '原材料B', quantity: 5 },
    { productId: '4', materialId: '1', materialSku: 'RAW001', materialName: '原材料A', quantity: 8 },
    { productId: '4', materialId: '2', materialSku: 'RAW002', materialName: '原材料B', quantity: 3 }
  ];
  
  const bomItems = bomData.filter(item => item.productId === productId);
  
  return bomItems.map(bomItem => ({
    materialId: bomItem.materialId,
    materialSku: bomItem.materialSku,
    materialName: bomItem.materialName,
    requiredQuantity: bomItem.quantity * quantity,
    availableQuantity: 0, // 这里会在FIFO分配时重新计算
    shortfall: 0
  }));
}

/**
 * 获取物料名称
 */
function getMaterialName(materialId: string): string {
  const materialNames: Record<string, string> = {
    '1': '原材料A',
    '2': '原材料B'
  };
  return materialNames[materialId] || '未知物料';
}

/**
 * 生成成品批次号
 */
function generateFinishedProductBatchNumber(productionOrderNumber: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const sequence = String(mockFinishedProductBatches.length + 1).padStart(3, '0');
  return `FB${date}${sequence}`;
}

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
