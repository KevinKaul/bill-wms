import { 
  ProductionOrder, 
  ProductionOrderTableItem, 
  ProductionOrderFilters,
  ProductionOrdersResponse,
  MaterialRequirement,
  MaterialRequirementsResponse,
  BOMItem,
  ProductionOrderFormData
} from '@/types/production';
import { PRODUCTION_ORDER_PREFIX } from '@/constants/production';
import { 
  allocateMaterialsByFIFO, 
  calculateTotalMaterialCost,
  canFullyAllocateAllMaterials,
  getMaterialBatchInventory
} from './fifo-allocation';
import { completeProduction } from './production-completion';

// 模拟BOM数据 - 成品的物料构成
const mockBOMData: BOMItem[] = [
  // 成品A (FIN001) 的BOM
  { id: '1', productId: '3', materialId: '1', materialSku: 'RAW001', materialName: '原材料A', quantity: 10, unit: '个' },
  { id: '2', productId: '3', materialId: '2', materialSku: 'RAW002', materialName: '原材料B', quantity: 5, unit: '个' },
  
  // 成品B (FIN002) 的BOM  
  { id: '3', productId: '4', materialId: '1', materialSku: 'RAW001', materialName: '原材料A', quantity: 8, unit: '个' },
  { id: '4', productId: '4', materialId: '2', materialSku: 'RAW002', materialName: '原材料B', quantity: 3, unit: '个' },
];

// 模拟加工单数据
const mockProductionOrders: ProductionOrder[] = [
  {
    id: '1',
    orderNumber: 'PRO20241201001',
    productId: '3',
    productSku: 'FIN001',
    productName: '成品A',
    plannedQuantity: 50,
    actualQuantity: 50,
    status: 'completed',
    paymentStatus: 'paid',
    supplierId: 'SUP001',
    supplierName: '加工厂A',
    materialCost: 2100.50,
    processingFee: 500,
    totalCost: 2600.50,
    createdAt: '2024-12-01T10:00:00Z',
    completedAt: '2024-12-03T16:30:00Z',
    remark: '紧急订单，优先生产'
  },
  {
    id: '2',
    orderNumber: 'PRO20241202001',
    productId: '4',
    productSku: 'FIN002',
    productName: '成品B',
    plannedQuantity: 30,
    status: 'in_progress',
    paymentStatus: 'unpaid',
    supplierId: 'SUP002',
    supplierName: '加工厂B',
    materialCost: 1580.25,
    processingFee: 300,
    totalCost: 1880.25,
    createdAt: '2024-12-02T09:15:00Z',
    remark: '常规生产订单'
  },
  {
    id: '3',
    orderNumber: 'PRO20241203001',
    productId: '3',
    productSku: 'FIN001',
    productName: '成品A',
    plannedQuantity: 100,
    status: 'confirmed',
    paymentStatus: 'unpaid',
    supplierId: 'SUP001',
    supplierName: '加工厂A',
    materialCost: 4201.00,
    processingFee: 800,
    totalCost: 5001.00,
    createdAt: '2024-12-03T14:20:00Z'
  },
  {
    id: '4',
    orderNumber: 'PRO20241204001',
    productId: '4',
    productSku: 'FIN002',
    productName: '成品B',
    plannedQuantity: 20,
    status: 'draft',
    paymentStatus: 'unpaid',
    materialCost: 1053.50,
    processingFee: 200,
    totalCost: 1253.50,
    createdAt: '2024-12-04T11:45:00Z',
    remark: '测试生产'
  }
];

// 转换为表格数据格式
function transformToTableItem(order: ProductionOrder): ProductionOrderTableItem {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    productInfo: {
      sku: order.productSku,
      name: order.productName
    },
    plannedQuantity: order.plannedQuantity,
    actualQuantity: order.actualQuantity,
    status: order.status,
    paymentStatus: order.paymentStatus,
    supplierName: order.supplierName,
    materialCost: order.materialCost,
    processingFee: order.processingFee,
    totalCost: order.totalCost,
    createdAt: order.createdAt,
    completedAt: order.completedAt
  };
}

// 筛选加工单
function filterProductionOrders(orders: ProductionOrder[], filters: ProductionOrderFilters): ProductionOrder[] {
  return orders.filter(order => {
    // 状态筛选
    if (filters.status && filters.status !== 'all' && order.status !== filters.status) {
      return false;
    }

    // 付款状态筛选
    if (filters.paymentStatus && filters.paymentStatus !== 'all' && order.paymentStatus !== filters.paymentStatus) {
      return false;
    }

    // 供应商筛选
    if (filters.supplierId && order.supplierId !== filters.supplierId) {
      return false;
    }

    // 产品筛选
    if (filters.productId && order.productId !== filters.productId) {
      return false;
    }

    // 搜索筛选
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const searchFields = [
        order.orderNumber,
        order.productSku,
        order.productName,
        order.supplierName || ''
      ];
      
      if (!searchFields.some(field => field.toLowerCase().includes(searchLower))) {
        return false;
      }
    }

    // 日期范围筛选
    if (filters.dateRange) {
      const orderDate = new Date(order.createdAt);
      const fromDate = new Date(filters.dateRange.from);
      const toDate = new Date(filters.dateRange.to);
      
      if (orderDate < fromDate || orderDate > toDate) {
        return false;
      }
    }

    return true;
  });
}

// 排序加工单
function sortProductionOrders(orders: ProductionOrder[], sortBy?: string, sortOrder: 'asc' | 'desc' = 'desc'): ProductionOrder[] {
  if (!sortBy) return orders;

  return [...orders].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortBy) {
      case 'orderNumber':
        aValue = a.orderNumber;
        bValue = b.orderNumber;
        break;
      case 'productName':
        aValue = a.productName;
        bValue = b.productName;
        break;
      case 'plannedQuantity':
        aValue = a.plannedQuantity;
        bValue = b.plannedQuantity;
        break;
      case 'totalCost':
        aValue = a.totalCost;
        bValue = b.totalCost;
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
      default:
        aValue = a.createdAt;
        bValue = b.createdAt;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
}

// 获取加工单列表
export async function getProductionOrders(params: {
  page: number;
  limit: number;
  filters?: ProductionOrderFilters;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<ProductionOrdersResponse> {
  const { page, limit, filters = {}, sortBy, sortOrder } = params;

  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 300));

  // 应用筛选
  let filteredOrders = filterProductionOrders(mockProductionOrders, filters);

  // 应用排序
  filteredOrders = sortProductionOrders(filteredOrders, sortBy, sortOrder);

  // 分页
  const total = filteredOrders.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // 转换为表格格式
  const orders = paginatedOrders.map(transformToTableItem);

  return {
    orders,
    total,
    page,
    limit,
    totalPages
  };
}

// 获取BOM物料需求
export async function getMaterialRequirements(productId: string, quantity: number): Promise<MaterialRequirementsResponse> {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 200));

  // 获取产品BOM
  const bomItems = mockBOMData.filter(item => item.productId === productId);
  
  if (bomItems.length === 0) {
    return {
      requirements: [],
      canProduce: false,
      maxProducibleQuantity: 0
    };
  }

  // 基于BOM计算物料需求
  const requirements: MaterialRequirement[] = bomItems.map(bomItem => {
    const requiredQuantity = bomItem.quantity * quantity;
    
    // 从批次库存获取可用数量
    const batchInventory = getMaterialBatchInventory(bomItem.materialId);
    const availableQuantity = batchInventory.reduce((total, batch) => total + batch.availableQuantity, 0);
    const shortfall = Math.max(0, requiredQuantity - availableQuantity);

    return {
      materialId: bomItem.materialId,
      materialSku: bomItem.materialSku,
      materialName: bomItem.materialName,
      requiredQuantity,
      availableQuantity,
      shortfall
    };
  });

  // 计算是否可以生产和最大可生产数量
  const canProduce = requirements.every(req => req.shortfall === 0);
  const maxProducibleQuantity = Math.min(
    ...bomItems.map(bomItem => {
      const batchInventory = getMaterialBatchInventory(bomItem.materialId);
      const availableQuantity = batchInventory.reduce((total, batch) => total + batch.availableQuantity, 0);
      return Math.floor(availableQuantity / bomItem.quantity);
    })
  );

  return {
    requirements,
    canProduce,
    maxProducibleQuantity
  };
}

// 创建加工单
export async function createProductionOrder(data: ProductionOrderFormData): Promise<ProductionOrder> {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 500));

  // 生成新的加工单号
  const orderNumber = `${PRODUCTION_ORDER_PREFIX}${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(mockProductionOrders.length + 1).padStart(3, '0')}`;

  // 获取物料需求
  const materialRequirements = await getMaterialRequirements(data.productId, data.plannedQuantity);
  
  // 使用FIFO分配计算精确的物料成本
  const allocationResults = allocateMaterialsByFIFO(materialRequirements.requirements);
  const materialCost = calculateTotalMaterialCost(allocationResults);
  const canProduce = canFullyAllocateAllMaterials(allocationResults);

  // 检查是否可以生产
  if (!canProduce) {
    throw new Error('物料库存不足，无法创建加工单');
  }

  const newOrder: ProductionOrder = {
    id: String(mockProductionOrders.length + 1),
    orderNumber,
    productId: data.productId,
    productSku: data.productId === '3' ? 'FIN001' : 'FIN002',
    productName: data.productId === '3' ? '成品A' : '成品B',
    plannedQuantity: data.plannedQuantity,
    status: 'draft',
    paymentStatus: 'unpaid',
    supplierId: data.supplierId,
    supplierName: data.supplierId ? '加工厂A' : undefined,
    materialCost,
    processingFee: data.processingFee,
    totalCost: Math.round((materialCost + data.processingFee) * 100) / 100,
    createdAt: new Date().toISOString(),
    remark: data.remark
  };

  // 添加到模拟数据
  mockProductionOrders.push(newOrder);

  return newOrder;
}

// 更新加工单状态
export async function updateProductionOrderStatus(orderId: string, status: string): Promise<void> {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 300));

  const order = mockProductionOrders.find(o => o.id === orderId);
  if (!order) {
    throw new Error('加工单不存在');
  }

  order.status = status as any;
  
  // 如果状态变更为已完成，执行加工完成入库流程
  if (status === 'completed') {
    try {
      // 执行加工完成入库
      const completionResult = await completeProduction(order);
      
      // 更新加工单信息
      order.completedAt = new Date().toISOString();
      order.actualQuantity = completionResult.finishedProductBatch.quantity;
      
      // 更新实际成本（基于FIFO分配的精确成本）
      order.materialCost = completionResult.totalMaterialCost;
      order.totalCost = completionResult.totalCost;
      
      console.log(`加工单 ${order.orderNumber} 已完成，生成成品批次 ${completionResult.finishedProductBatch.batchNumber}`);
    } catch (error) {
      console.error('加工完成入库失败:', error);
      throw new Error('加工完成入库失败');
    }
  }
}

// 更新付款状态
export async function updatePaymentStatus(orderId: string, paymentStatus: string): Promise<void> {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 300));

  const order = mockProductionOrders.find(o => o.id === orderId);
  if (order) {
    order.paymentStatus = paymentStatus as any;
  }
}

export const fakeProductionApi = {
  getProductionOrders,
  getMaterialRequirements,
  createProductionOrder,
  updateProductionOrderStatus,
  updatePaymentStatus
};
