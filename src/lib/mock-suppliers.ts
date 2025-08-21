import { Supplier, SupplierFilters, SupplierResponse, SupplierFormData } from '@/types/supplier';

// 模拟供应商数据
const mockSuppliers: Supplier[] = [
  {
    id: '1',
    code: 'SUP001',
    name: '上海华美材料有限公司',
    account: '6228480402564890018',
    contactPerson: '张经理',
    phone: '13812345678',
    email: 'zhang@huamei.com',
    address: '上海市浦东新区张江高科技园区',
    remark: '主要供应原材料A和B',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    code: 'SUP002',
    name: '深圳市鑫源贸易公司',
    account: '6228480402564890019',
    contactPerson: '李总',
    phone: '13987654321',
    email: 'li@xinyuan.com',
    address: '深圳市南山区科技园',
    remark: '价格优惠，交货及时',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: '3',
    code: 'SUP003',
    name: '北京天成化工材料厂',
    account: '6228480402564890020',
    contactPerson: '王主任',
    phone: '13611223344',
    email: 'wang@tiancheng.com',
    address: '北京市朝阳区工业园区',
    remark: '专业化工材料供应商',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01')
  },
  {
    id: '4',
    code: 'SUP004',
    name: '广州市佳和包装材料公司',
    account: '6228480402564890021',
    contactPerson: '陈经理',
    phone: '13755667788',
    email: 'chen@jiahe.com',
    address: '广州市白云区工业大道',
    remark: '包装材料专业供应',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10')
  },
  {
    id: '5',
    code: 'SUP005',
    name: '杭州绿源环保材料有限公司',
    account: '6228480402564890022',
    contactPerson: '刘总监',
    phone: '13899001122',
    email: 'liu@lvyuan.com',
    address: '杭州市西湖区环保科技园',
    remark: '环保材料供应商，质量可靠',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15')
  }
];

// 模拟API延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 模拟供应商API
export const fakeSuppliersApi = {
  // 获取供应商列表
  async getSuppliers(filters: SupplierFilters = {}): Promise<SupplierResponse> {
    await delay(300);
    
    const { page = 1, limit = 10, search } = filters;
    
    let filteredSuppliers = [...mockSuppliers];
    
    // 搜索过滤
    if (search) {
      const searchLower = search.toLowerCase();
      filteredSuppliers = filteredSuppliers.filter(supplier =>
        supplier.code.toLowerCase().includes(searchLower) ||
        supplier.name.toLowerCase().includes(searchLower) ||
        supplier.contactPerson?.toLowerCase().includes(searchLower)
      );
    }
    
    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedSuppliers = filteredSuppliers.slice(startIndex, endIndex);
    
    return {
      suppliers: paginatedSuppliers,
      total_suppliers: filteredSuppliers.length,
      page,
      limit
    };
  },

  // 根据ID获取供应商
  async getSupplierById(id: string): Promise<Supplier | null> {
    await delay(200);
    return mockSuppliers.find(supplier => supplier.id === id) || null;
  },

  // 创建供应商
  async createSupplier(data: SupplierFormData): Promise<Supplier> {
    await delay(500);
    
    const newSupplier: Supplier = {
      id: (mockSuppliers.length + 1).toString(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockSuppliers.push(newSupplier);
    return newSupplier;
  },

  // 更新供应商
  async updateSupplier(id: string, data: SupplierFormData): Promise<Supplier> {
    await delay(500);
    
    const index = mockSuppliers.findIndex(supplier => supplier.id === id);
    if (index === -1) {
      throw new Error('供应商不存在');
    }
    
    mockSuppliers[index] = {
      ...mockSuppliers[index],
      ...data,
      updatedAt: new Date()
    };
    
    return mockSuppliers[index];
  },

  // 删除供应商
  async deleteSupplier(id: string): Promise<void> {
    await delay(300);
    
    const index = mockSuppliers.findIndex(supplier => supplier.id === id);
    if (index === -1) {
      throw new Error('供应商不存在');
    }
    
    mockSuppliers.splice(index, 1);
  },

  // 检查供应商代号是否已存在
  async checkCodeExists(code: string, excludeId?: string): Promise<boolean> {
    await delay(200);
    
    return mockSuppliers.some(supplier => 
      supplier.code === code && supplier.id !== excludeId
    );
  }
};
