import { InventoryTableItem, type InventoryFilters } from '@/types/inventory';
import { fakeInventoryApi } from '@/lib/mock-inventory';
import { searchParamsCache } from '@/lib/searchparams';
import { InventoryTable } from './inventory-tables';

type InventoryListingPageProps = {};

export default async function InventoryListingPage({}: InventoryListingPageProps) {
  // 从搜索参数缓存获取过滤条件
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');
  const productType = searchParamsCache.get('productType');
  const lowStock = searchParamsCache.get('lowStock');
  const hasStock = searchParamsCache.get('hasStock');

  // 将 productType 收窄到允许的联合类型
  const allowedProductTypes = ['raw_material', 'finished_product', 'all'] as const;
  const normalizedProductType: InventoryFilters['productType'] =
    allowedProductTypes.includes(productType as any)
      ? (productType as (typeof allowedProductTypes)[number])
      : undefined;

  const filters = {
    page,
    limit: pageLimit ?? undefined,
    ...(search && typeof search === 'string' && { search }),
    ...(normalizedProductType && { productType: normalizedProductType }),
    ...(lowStock && { lowStock: lowStock === 'true' }),
    ...(hasStock && { hasStock: hasStock === 'true' })
  };

  const data = await fakeInventoryApi.getInventorySummary(filters);
  const totalInventories = data.total_inventories;
  const inventories: InventoryTableItem[] = data.inventories.map(inventory => ({
    productId: inventory.productId,
    productSku: inventory.productSku,
    productName: inventory.productName,
    productType: inventory.productType,
    totalQuantity: inventory.totalQuantity,
    totalValue: inventory.totalValue,
    batchCount: inventory.batchCount,
    avgUnitCost: inventory.avgUnitCost,
    oldestBatchDate: inventory.oldestBatchDate.toISOString(),
    lowStockAlert: inventory.lowStockAlert || false
  }));

  return (
    <InventoryTable data={inventories} totalData={totalInventories} />
  );
}
