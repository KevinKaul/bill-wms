import { ProductTableItem, ProductType } from '@/types/product';
import { productsApi } from '@/lib/api-client';
import { searchParamsCache } from '@/lib/searchparams';
import { ProductTable } from './product-tables';
import { columns } from './product-tables/columns';

type ProductListingPage = {};

export default async function ProductListingPage({}: ProductListingPage) {
  // 从搜索参数缓存获取过滤条件
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');
  const productType = searchParamsCache.get('category'); // 使用现有的category参数

  const filters = {
    page,
    pageSize: pageLimit,
    ...(search && typeof search === 'string' && { search }),
    ...(productType && { type: productType as ProductType }),
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  };

  const response = await productsApi.getProducts(filters);
  
  if (!response.success) {
    throw new Error(response.error?.message || '获取产品列表失败');
  }

  const totalProducts = (response.data as any)?.total || 0;
  const products: ProductTableItem[] = (response.data as any)?.products?.map((product: any) => ({
    id: product.id,
    sku: product.sku,
    name: product.name,
    type: product.type,
    image_url: product.image_url,
    reference_purchase_price: product.reference_purchase_price,
    guide_unit_price: product.guide_unit_price,
    calculated_cost: product.calculated_cost,
    bom_components_count: product.bom_components_count,
    status: product.status,
    created_at: product.created_at,
    updated_at: product.updated_at
  })) || [];

  return (
    <ProductTable
      data={products}
      totalItems={totalProducts}
      columns={columns}
    />
  );
}
