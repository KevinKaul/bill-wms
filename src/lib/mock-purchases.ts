import { 
  PurchaseOrder, 
  PurchaseOrderTableItem, 
  PurchaseOrderFilters,
  PurchaseOrdersResponse,
  PurchaseOrderFormData
} from '@/types/purchase';
import { PURCHASE_ORDER_PREFIX } from '@/constants/purchase';
import { processPurchaseInbound } from './purchase-inbound';

// 模拟采购单数据
const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: '1',
    orderNumber: 'PO20240101001',
    supplierId: '1',
    supplierCode: 'SUP001',
    supplierName: '上海华美材料有限公司',
    status: 'confirmed',
    paymentStatus: 'unpaid',
    deliveryStatus: 'pending',
    additionalCost: 150.00,
    subtotal: 2850.00,
    totalAmount: 3000.00,
    orderDate: new Date('2024-01-15'),
    expectedDeliveryDate: new Date('2024-01-25'),
    remark: '紧急采购，请尽快安排发货',
    items: [
      {
        id: '1',
        purchaseOrderId: '1',
        productId: '1',
        productSku: 'RAW001',
        productName: '原材料A',
        quantity: 100,
        unitPrice: 15.50,
        totalPrice: 1550.00,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      },
      {
        id: '2',
        purchaseOrderId: '1',
        productId: '2',
        productSku: 'RAW002',
        productName: '原材料B',
        quantity: 50,
        unitPrice: 26.00,
        totalPrice: 1300.00,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      }
    ],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    orderNumber: 'PO20240102001',
    supplierId: '2',
    supplierCode: 'SUP002',
    supplierName: '深圳市鑫源贸易公司',
    status: 'completed',
    paymentStatus: 'paid',
    deliveryStatus: 'delivered',
    additionalCost: 80.00,
    subtotal: 1920.00,
    totalAmount: 2000.00,
    orderDate: new Date('2024-01-20'),
    expectedDeliveryDate: new Date('2024-01-30'),
    actualDeliveryDate: new Date('2024-01-28'),
    remark: '常规采购',
    items: [
      {
        id: '3',
        purchaseOrderId: '2',
        productId: '3',
        productSku: 'RAW003',
        productName: '原材料C',
        quantity: 80,
        unitPrice: 24.00,
        totalPrice: 1920.00,
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20')
      }
    ],
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-28')
  },
  {
    id: '3',
    orderNumber: 'PO20240103001',
    supplierId: '3',
    supplierCode: 'SUP003',
    supplierName: '北京天成化工材料厂',
    status: 'draft',
    paymentStatus: 'unpaid',
    deliveryStatus: 'pending',
    additionalCost: 200.00,
    subtotal: 4300.00,
    totalAmount: 4500.00,
    orderDate: new Date('2024-02-01'),
    expectedDeliveryDate: new Date('2024-02-15'),
    items: [
      {
        id: '4',
        purchaseOrderId: '3',
        productId: '1',
        productSku: 'RAW001',
        productName: '原材料A',
        quantity: 200,
        unitPrice: 15.00,
        totalPrice: 3000.00,
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01')
      },
      {
        id: '5',
        purchaseOrderId: '3',
        productId: '4',
        productSku: 'RAW004',
        productName: '原材料D',
        quantity: 50,
        unitPrice: 26.00,
        totalPrice: 1300.00,
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01')
      }
    ],
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01')
  }
];

// 模拟采购计划数据
const mockPurchasePlans: PurchasePlan[] = [
  {
    id: '1',
    planNumber: 'PP20240101',
    title: '2024年第一季度原材料采购计划',
    description: '根据生产计划制定的第一季度原材料采购需求',
    status: 'approved',
    planDate: new Date('2024-01-01'),
    expectedExecutionDate: new Date('2024-01-15'),
    items: [
      {
        id: '1',
        purchasePlanId: '1',
        productId: '1',
        productSku: 'RAW001',
        productName: '原材料A',
        plannedQuantity: 500,
        estimatedUnitPrice: 15.00,
        estimatedTotalPrice: 7500.00,
        priority: 'high',
        remark: '生产急需',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: '2',
        purchasePlanId: '1',
        productId: '2',
        productSku: 'RAW002',
        productName: '原材料B',
        plannedQuantity: 300,
        estimatedUnitPrice: 25.00,
        estimatedTotalPrice: 7500.00,
        priority: 'medium',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-05')
  },
  {
    id: '2',
    planNumber: 'PP20240201',
    title: '春节后补充采购计划',
    description: '春节期间库存消耗的补充采购',
    status: 'draft',
    planDate: new Date('2024-02-01'),
    expectedExecutionDate: new Date('2024-02-10'),
    items: [
      {
        id: '3',
        purchasePlanId: '2',
        productId: '3',
        productSku: 'RAW003',
        productName: '原材料C',
        plannedQuantity: 200,
        estimatedUnitPrice: 24.00,
        estimatedTotalPrice: 4800.00,
        priority: 'medium',
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01')
      }
    ],
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01')
  }
];

// 模拟API延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 模拟采购单API
export const fakePurchaseOrdersApi = {
  // 获取采购单列表
  async getPurchaseOrders(filters: PurchaseOrderFilters = {}): Promise<PurchaseOrderResponse> {
    await delay(300);
    
    const { page = 1, limit = 10, search, status, paymentStatus, deliveryStatus, supplierId } = filters;
    
    let filteredOrders = [...mockPurchaseOrders];
    
    // 搜索过滤
    if (search) {
      const searchLower = search.toLowerCase();
      filteredOrders = filteredOrders.filter(order =>
        order.orderNumber.toLowerCase().includes(searchLower) ||
        order.supplierName.toLowerCase().includes(searchLower) ||
        order.supplierCode.toLowerCase().includes(searchLower)
      );
    }
    
    // 状态过滤
    if (status && status !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.status === status);
    }
    
    if (paymentStatus && paymentStatus !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.paymentStatus === paymentStatus);
    }
    
    if (deliveryStatus && deliveryStatus !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.deliveryStatus === deliveryStatus);
    }
    
    if (supplierId) {
      filteredOrders = filteredOrders.filter(order => order.supplierId === supplierId);
    }
    
    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
    
    return {
      orders: paginatedOrders,
      total_orders: filteredOrders.length,
      page,
      limit
    };
  },

  // 根据ID获取采购单
  async getPurchaseOrderById(id: string): Promise<PurchaseOrder | null> {
    await delay(200);
    return mockPurchaseOrders.find(order => order.id === id) || null;
  },

  // 创建采购单
  async createPurchaseOrder(data: PurchaseOrderFormData): Promise<PurchaseOrder> {
    await delay(500);
    
    const orderNumber = `PO${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(mockPurchaseOrders.length + 1).padStart(3, '0')}`;
    
    const items = data.items.map((item, index) => ({
      id: (mockPurchaseOrders.length * 10 + index + 1).toString(),
      purchaseOrderId: (mockPurchaseOrders.length + 1).toString(),
      productId: item.productId,
      productSku: `SKU${item.productId}`, // 简化处理
      productName: `产品${item.productId}`, // 简化处理
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.quantity * item.unitPrice,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    
    const newOrder: PurchaseOrder = {
      id: (mockPurchaseOrders.length + 1).toString(),
      orderNumber,
      supplierId: data.supplierId,
      supplierCode: 'SUP001', // 简化处理
      supplierName: '供应商名称', // 简化处理
      status: 'draft',
      paymentStatus: 'unpaid',
      deliveryStatus: 'pending',
      additionalCost: data.additionalCost,
      subtotal,
      totalAmount: subtotal + data.additionalCost,
      orderDate: new Date(),
      expectedDeliveryDate: data.expectedDeliveryDate,
      remark: data.remark,
      items,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockPurchaseOrders.push(newOrder);
    return newOrder;
  },

  // 更新采购单
  async updatePurchaseOrder(id: string, data: Partial<PurchaseOrderFormData>): Promise<PurchaseOrder> {
    await delay(500);
    
    const index = mockPurchaseOrders.findIndex(order => order.id === id);
    if (index === -1) {
      throw new Error('采购单不存在');
    }
    
    // 简化更新逻辑
    mockPurchaseOrders[index] = {
      ...mockPurchaseOrders[index],
      updatedAt: new Date()
    };
    
    return mockPurchaseOrders[index];
  },

  // 更新采购单状态
  async updatePurchaseOrderStatus(id: string, status: PurchaseOrderStatus): Promise<PurchaseOrder> {
    await delay(300);
    
    const index = mockPurchaseOrders.findIndex(order => order.id === id);
    if (index === -1) {
      throw new Error('采购单不存在');
    }
    
    mockPurchaseOrders[index] = {
      ...mockPurchaseOrders[index],
      status,
      updatedAt: new Date()
    };
    
    return mockPurchaseOrders[index];
  },

  // 更新付款状态
  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<PurchaseOrder> {
    await delay(300);
    
    const index = mockPurchaseOrders.findIndex(order => order.id === id);
    if (index === -1) {
      throw new Error('采购单不存在');
    }
    
    mockPurchaseOrders[index] = {
      ...mockPurchaseOrders[index],
      paymentStatus,
      updatedAt: new Date()
    };
    
    return mockPurchaseOrders[index];
  },

  // 更新到货状态
  async updateDeliveryStatus(id: string, deliveryStatus: DeliveryStatus): Promise<PurchaseOrder> {
    await delay(300);
    
    const index = mockPurchaseOrders.findIndex(order => order.id === id);
    if (index === -1) {
      throw new Error('采购单不存在');
    }
    
    mockPurchaseOrders[index] = {
      ...mockPurchaseOrders[index],
      deliveryStatus,
      actualDeliveryDate: deliveryStatus === 'delivered' ? new Date() : undefined,
      updatedAt: new Date()
    };
    
    return mockPurchaseOrders[index];
  }
};

// 模拟采购计划API
export const fakePurchasePlansApi = {
  // 获取采购计划列表
  async getPurchasePlans(filters: PurchasePlanFilters = {}): Promise<PurchasePlanResponse> {
    await delay(300);
    
    const { page = 1, limit = 10, search, status } = filters;
    
    let filteredPlans = [...mockPurchasePlans];
    
    // 搜索过滤
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPlans = filteredPlans.filter(plan =>
        plan.planNumber.toLowerCase().includes(searchLower) ||
        plan.title.toLowerCase().includes(searchLower)
      );
    }
    
    // 状态过滤
    if (status && status !== 'all') {
      filteredPlans = filteredPlans.filter(plan => plan.status === status);
    }
    
    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPlans = filteredPlans.slice(startIndex, endIndex);
    
    return {
      plans: paginatedPlans,
      total_plans: filteredPlans.length,
      page,
      limit
    };
  },

  // 根据ID获取采购计划
  async getPurchasePlanById(id: string): Promise<PurchasePlan | null> {
    await delay(200);
    return mockPurchasePlans.find(plan => plan.id === id) || null;
  },

  // 创建采购计划
  async createPurchasePlan(data: PurchasePlanFormData): Promise<PurchasePlan> {
    await delay(500);
    
    const planNumber = `PP${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(mockPurchasePlans.length + 1).padStart(2, '0')}`;
    
    const items = data.items.map((item, index) => ({
      id: (mockPurchasePlans.length * 10 + index + 1).toString(),
      purchasePlanId: (mockPurchasePlans.length + 1).toString(),
      productId: item.productId,
      productSku: `SKU${item.productId}`, // 简化处理
      productName: `产品${item.productId}`, // 简化处理
      plannedQuantity: item.plannedQuantity,
      estimatedUnitPrice: item.estimatedUnitPrice,
      estimatedTotalPrice: item.plannedQuantity * item.estimatedUnitPrice,
      priority: item.priority,
      remark: item.remark,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    const newPlan: PurchasePlan = {
      id: (mockPurchasePlans.length + 1).toString(),
      planNumber,
      title: data.title,
      description: data.description,
      status: 'draft',
      planDate: data.planDate,
      expectedExecutionDate: data.expectedExecutionDate,
      items,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockPurchasePlans.push(newPlan);
    return newPlan;
  }
};
