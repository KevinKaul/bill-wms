import { BatchAllocation, MaterialRequirement } from '@/types/production';

// 批次库存接口
export interface BatchInventory {
  batchId: string;
  batchNumber: string;
  materialId: string;
  materialSku: string;
  availableQuantity: number;
  unitCost: number;
  inboundDate: string;
}

// FIFO分配结果
export interface FIFOAllocationResult {
  materialId: string;
  materialSku: string;
  requiredQuantity: number;
  allocatedQuantity: number;
  allocations: BatchAllocation[];
  isFullyAllocated: boolean;
  shortfall: number;
  totalCost: number;
}

// 模拟批次库存数据
const mockBatchInventory: BatchInventory[] = [
  // 原材料A的批次
  {
    batchId: 'BATCH001',
    batchNumber: 'B20241201001',
    materialId: '1',
    materialSku: 'RAW001',
    availableQuantity: 80,
    unitCost: 15.50,
    inboundDate: '2024-12-01T10:00:00Z'
  },
  {
    batchId: 'BATCH002',
    batchNumber: 'B20241205001',
    materialId: '1',
    materialSku: 'RAW001',
    availableQuantity: 70,
    unitCost: 16.00,
    inboundDate: '2024-12-05T14:30:00Z'
  },
  // 原材料B的批次
  {
    batchId: 'BATCH003',
    batchNumber: 'B20241202001',
    materialId: '2',
    materialSku: 'RAW002',
    availableQuantity: 25,
    unitCost: 26.00,
    inboundDate: '2024-12-02T09:15:00Z'
  },
  {
    batchId: 'BATCH004',
    batchNumber: 'B20241206001',
    materialId: '2',
    materialSku: 'RAW002',
    availableQuantity: 20,
    unitCost: 27.00,
    inboundDate: '2024-12-06T16:45:00Z'
  }
];

/**
 * 按FIFO原则为物料需求分配批次库存
 * @param materialRequirements 物料需求列表
 * @returns FIFO分配结果
 */
export function allocateMaterialsByFIFO(materialRequirements: MaterialRequirement[]): FIFOAllocationResult[] {
  const results: FIFOAllocationResult[] = [];

  for (const requirement of materialRequirements) {
    const result = allocateSingleMaterialByFIFO(requirement);
    results.push(result);
  }

  return results;
}

/**
 * 为单个物料按FIFO原则分配批次库存
 * @param requirement 物料需求
 * @returns 分配结果
 */
export function allocateSingleMaterialByFIFO(requirement: MaterialRequirement): FIFOAllocationResult {
  // 获取该物料的所有可用批次，按入库时间排序（FIFO）
  const availableBatches = mockBatchInventory
    .filter(batch => 
      batch.materialId === requirement.materialId && 
      batch.availableQuantity > 0
    )
    .sort((a, b) => new Date(a.inboundDate).getTime() - new Date(b.inboundDate).getTime());

  const allocations: BatchAllocation[] = [];
  let remainingQuantity = requirement.requiredQuantity;
  let totalCost = 0;

  // 按FIFO顺序分配批次
  for (const batch of availableBatches) {
    if (remainingQuantity <= 0) break;

    // 计算从当前批次分配的数量
    const allocatedFromBatch = Math.min(remainingQuantity, batch.availableQuantity);
    
    if (allocatedFromBatch > 0) {
      const batchAllocation: BatchAllocation = {
        batchId: batch.batchId,
        batchNumber: batch.batchNumber,
        allocatedQuantity: allocatedFromBatch,
        unitCost: batch.unitCost,
        totalCost: allocatedFromBatch * batch.unitCost
      };

      allocations.push(batchAllocation);
      totalCost += batchAllocation.totalCost;
      remainingQuantity -= allocatedFromBatch;

      // 更新批次可用数量（模拟扣减）
      batch.availableQuantity -= allocatedFromBatch;
    }
  }

  const allocatedQuantity = requirement.requiredQuantity - remainingQuantity;
  const isFullyAllocated = remainingQuantity === 0;
  const shortfall = remainingQuantity;

  return {
    materialId: requirement.materialId,
    materialSku: requirement.materialSku,
    requiredQuantity: requirement.requiredQuantity,
    allocatedQuantity,
    allocations,
    isFullyAllocated,
    shortfall,
    totalCost: Math.round(totalCost * 100) / 100
  };
}

/**
 * 计算物料分配的总成本
 * @param allocationResults FIFO分配结果列表
 * @returns 总物料成本
 */
export function calculateTotalMaterialCost(allocationResults: FIFOAllocationResult[]): number {
  const totalCost = allocationResults.reduce((sum, result) => sum + result.totalCost, 0);
  return Math.round(totalCost * 100) / 100;
}

/**
 * 检查是否所有物料都能完全分配
 * @param allocationResults FIFO分配结果列表
 * @returns 是否可以完全分配
 */
export function canFullyAllocateAllMaterials(allocationResults: FIFOAllocationResult[]): boolean {
  return allocationResults.every(result => result.isFullyAllocated);
}

/**
 * 获取分配摘要信息
 * @param allocationResults FIFO分配结果列表
 * @returns 分配摘要
 */
export function getAllocationSummary(allocationResults: FIFOAllocationResult[]) {
  const totalMaterials = allocationResults.length;
  const fullyAllocatedMaterials = allocationResults.filter(r => r.isFullyAllocated).length;
  const partiallyAllocatedMaterials = allocationResults.filter(r => !r.isFullyAllocated && r.allocatedQuantity > 0).length;
  const unallocatedMaterials = allocationResults.filter(r => r.allocatedQuantity === 0).length;
  const totalCost = calculateTotalMaterialCost(allocationResults);

  return {
    totalMaterials,
    fullyAllocatedMaterials,
    partiallyAllocatedMaterials,
    unallocatedMaterials,
    totalCost,
    canProduce: fullyAllocatedMaterials === totalMaterials
  };
}

/**
 * 恢复批次库存（用于取消分配）
 * @param allocationResults 要取消的分配结果
 */
export function restoreBatchInventory(allocationResults: FIFOAllocationResult[]): void {
  for (const result of allocationResults) {
    for (const allocation of result.allocations) {
      const batch = mockBatchInventory.find(b => b.batchId === allocation.batchId);
      if (batch) {
        batch.availableQuantity += allocation.allocatedQuantity;
      }
    }
  }
}

/**
 * 获取物料的批次库存列表
 * @param materialId 物料ID
 * @returns 批次库存列表
 */
export function getMaterialBatchInventory(materialId: string): BatchInventory[] {
  return mockBatchInventory
    .filter(batch => batch.materialId === materialId)
    .sort((a, b) => new Date(a.inboundDate).getTime() - new Date(b.inboundDate).getTime());
}
