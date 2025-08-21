import { ProductTableItem, ProductType } from '@/types/product';
import { fakeProductsApi } from '@/lib/mock-products';
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
    limit: pageLimit,
    ...(search && typeof search === 'string' && { search }),
    ...(productType && { type: productType as ProductType })
  };

  const data = await fakeProductsApi.getProducts(filters);
  const totalProducts = data.total_products;
  const products: ProductTableItem[] = data.products;

  return (
    <ProductTable
      data={products}
      totalItems={totalProducts}
      columns={columns}
    />
  );
}
