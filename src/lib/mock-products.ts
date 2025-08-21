import { ProductTableItem, ProductFilterOptions, ProductType } from '@/types/product';

// 模拟产品数据
const mockProducts: ProductTableItem[] = [
  {
    id: '1',
    sku: 'RM001',
    name: '优质棉花',
    image: '/assets/cotton.jpg',
    type: ProductType.RAW_MATERIAL,
    typeLabel: '原材料',
    referencePurchasePrice: 15.50,
    bomItemsCount: 0,
    createdAt: new Date('2024-01-15T10:30:00Z')
  },
  {
    id: '2',
    sku: 'RM002',
    name: '丝绸面料',
    image: '/assets/silk.jpg',
    type: ProductType.RAW_MATERIAL,
    typeLabel: '原材料',
    referencePurchasePrice: 85.00,
    bomItemsCount: 0,
    createdAt: new Date('2024-01-16T14:20:00Z')
  },
  {
    id: '3',
    sku: 'FP001',
    name: '精美花环',
    image: '/assets/wreath.jpg',
    type: ProductType.FINISHED_PRODUCT,
    typeLabel: '组合产品',
    guidancePrice: 128.00,
    calculatedCost: 45.50,
    bomItemsCount: 5,
    createdAt: new Date('2024-01-18T09:15:00Z')
  },
  {
    id: '4',
    sku: 'RM003',
    name: '金属丝',
    image: '/assets/wire.jpg',
    type: ProductType.RAW_MATERIAL,
    typeLabel: '原材料',
    referencePurchasePrice: 12.80,
    bomItemsCount: 0,
    createdAt: new Date('2024-01-20T11:45:00Z')
  },
  {
    id: '5',
    sku: 'FP002',
    name: '装饰花束',
    image: '/assets/bouquet.jpg',
    type: ProductType.FINISHED_PRODUCT,
    typeLabel: '组合产品',
    guidancePrice: 89.90,
    calculatedCost: 32.40,
    bomItemsCount: 3,
    createdAt: new Date('2024-01-22T16:30:00Z')
  },
  {
    id: '6',
    sku: 'RM004',
    name: '彩色珠子',
    image: '/assets/beads.jpg',
    type: ProductType.RAW_MATERIAL,
    typeLabel: '原材料',
    referencePurchasePrice: 8.90,
    bomItemsCount: 0,
    createdAt: new Date('2024-01-25T13:10:00Z')
  },
  {
    id: '7',
    sku: 'RM005',
    name: '缎带',
    image: '/assets/ribbon.jpg',
    type: ProductType.RAW_MATERIAL,
    typeLabel: '原材料',
    referencePurchasePrice: 6.50,
    bomItemsCount: 0,
    createdAt: new Date('2024-01-28T08:25:00Z')
  },
  {
    id: '8',
    sku: 'FP003',
    name: '婚礼花环',
    image: '/assets/wedding-wreath.jpg',
    type: ProductType.FINISHED_PRODUCT,
    typeLabel: '组合产品',
    guidancePrice: 299.00,
    calculatedCost: 98.70,
    bomItemsCount: 8,
    createdAt: new Date('2024-02-01T12:40:00Z')
  }
];

// 模拟API响应
export interface ProductsResponse {
  products: ProductTableItem[];
  total_products: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// 模拟获取产品列表的API
export const fakeProductsApi = {
  async getProducts(filters: ProductFilterOptions = {}): Promise<ProductsResponse> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let filteredProducts = [...mockProducts];
    
    // 搜索过滤
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredProducts = filteredProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.sku.toLowerCase().includes(searchTerm)
      );
    }
    
    // 类型过滤
    if (filters.type) {
      filteredProducts = filteredProducts.filter(product => product.type === filters.type);
    }
    
    // 排序
    if (filters.sortBy) {
      filteredProducts.sort((a, b) => {
        const aValue = a[filters.sortBy!];
        const bValue = b[filters.sortBy!];
        
        if (filters.sortOrder === 'desc') {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      });
    }
    
    // 分页
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    
    return {
      products: paginatedProducts,
      total_products: filteredProducts.length,
      page,
      per_page: limit,
      total_pages: Math.ceil(filteredProducts.length / limit)
    };
  },

  async getProductById(id: string): Promise<ProductTableItem | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockProducts.find(product => product.id === id) || null;
  },

  async createProduct(data: Partial<ProductTableItem>): Promise<ProductTableItem> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newProduct: ProductTableItem = {
      id: Math.random().toString(36).substr(2, 9),
      sku: data.sku || '',
      name: data.name || '',
      image: data.image,
      type: data.type || ProductType.RAW_MATERIAL,
      typeLabel: data.type === ProductType.RAW_MATERIAL ? '原材料' : '组合产品',
      referencePurchasePrice: data.referencePurchasePrice,
      guidancePrice: data.guidancePrice,
      bomItemsCount: data.bomItemsCount || 0,
      createdAt: new Date()
    };
    mockProducts.push(newProduct);
    return newProduct;
  },

  async updateProduct(id: string, data: Partial<ProductTableItem>): Promise<ProductTableItem | null> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const index = mockProducts.findIndex(product => product.id === id);
    if (index === -1) return null;
    
    mockProducts[index] = { ...mockProducts[index], ...data };
    return mockProducts[index];
  },

  async deleteProduct(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockProducts.findIndex(product => product.id === id);
    if (index === -1) return false;
    
    mockProducts.splice(index, 1);
    return true;
  }
};
