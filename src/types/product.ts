// 产品类型枚举
export enum ProductType {
  RAW_MATERIAL = "RAW_MATERIAL",
  FINISHED_PRODUCT = "FINISHED_PRODUCT",
}

// 基础产品类型
export interface Product {
  id: string;
  sku: string;
  name: string;
  image?: string;
  type: ProductType;
  referencePurchasePrice?: number;
  guidancePrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

// 产品与BOM关系
export interface BOMItem {
  id: string;
  productId: string;
  componentId: string;
  quantity: number;
  product: Product;
  component: Product;
  createdAt: Date;
  updatedAt: Date;
}

// 扩展的产品类型（包含BOM信息）
export interface ProductWithBOM extends Product {
  bomItems: BOMItem[]; // 作为成品的BOM构成
  bomComponents: BOMItem[]; // 作为原材料的BOM组件
  calculatedCost?: number; // 计算出的成本
}

// 产品表格显示类型
export interface ProductTableItem {
  id: string;
  sku: string;
  name: string;
  image?: string;
  type: ProductType;
  typeLabel: string;
  referencePurchasePrice?: number;
  guidancePrice?: number;
  calculatedCost?: number;
  bomItemsCount: number;
  createdAt: Date;
}

// 产品筛选选项
export interface ProductFilterOptions {
  page?: number;
  limit?: number;
  search?: string;
  type?: ProductType;
  sortBy?: "name" | "sku" | "createdAt" | "type";
  sortOrder?: "asc" | "desc";
}

// 产品表单数据类型现在从 @/lib/product-validation 导出

// 产品统计数据
export interface ProductStats {
  totalProducts: number;
  rawMaterials: number;
  finishedProducts: number;
  averagePrice: number;
}
