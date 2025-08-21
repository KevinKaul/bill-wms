import { ProductType } from '@/types/product';

export const PRODUCT_TYPE_OPTIONS = [
  {
    label: '原材料',
    value: ProductType.RAW_MATERIAL
  },
  {
    label: '组合产品',
    value: ProductType.FINISHED_PRODUCT
  }
];

export const CATEGORY_OPTIONS = [
  {
    label: 'Beauty Products',
    value: 'beauty'
  },
  {
    label: 'Electronics',
    value: 'electronics'
  },
  {
    label: 'Clothing',
    value: 'clothing'
  },
  {
    label: 'Home & Garden',
    value: 'home'
  },
  {
    label: 'Sports & Outdoors',
    value: 'sports'
  }
];
