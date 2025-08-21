import { ProductType } from '@/types/product';

// 产品类型选项
export const PRODUCT_TYPE_OPTIONS = [
  {
    label: '原材料',
    value: ProductType.RAW_MATERIAL,
    description: '用于生产的基础材料'
  },
  {
    label: '组合产品',
    value: ProductType.FINISHED_PRODUCT,
    description: '由多种原材料组合而成的成品'
  }
] as const;

// 产品类型标签映射
export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  [ProductType.RAW_MATERIAL]: '原材料',
  [ProductType.FINISHED_PRODUCT]: '组合产品'
};

// 产品类型颜色映射（用于Badge显示）
export const PRODUCT_TYPE_COLORS: Record<ProductType, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  [ProductType.RAW_MATERIAL]: 'secondary',
  [ProductType.FINISHED_PRODUCT]: 'default'
};

// 表格排序选项
export const PRODUCT_SORT_OPTIONS = [
  { label: '按名称', value: 'name' },
  { label: '按SKU', value: 'sku' },
  { label: '按类型', value: 'type' },
  { label: '按创建时间', value: 'createdAt' }
] as const;

// 默认产品图片
export const DEFAULT_PRODUCT_IMAGE = '/assets/default-product.png';

// 表单验证常量
export const PRODUCT_VALIDATION = {
  SKU_MIN_LENGTH: 2,
  SKU_MAX_LENGTH: 50,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  PRICE_MIN: 0,
  PRICE_MAX: 999999.99,
  BOM_QUANTITY_MIN: 0.001,
  BOM_QUANTITY_MAX: 999999.999
} as const;
