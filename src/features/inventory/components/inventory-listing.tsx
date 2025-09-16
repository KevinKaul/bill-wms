import { InventoryTableItem, type InventoryFilters } from '@/types/inventory';
import { searchParamsCache } from '@/lib/searchparams';
import { InventoryTable } from './inventory-tables';
import { inventoryApi } from '@/lib/api-client';

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

  // 调用封装的API获取库存数据
  const apiParams = {
    page: page || 1,
    limit: pageLimit || 10,
    ...(search && { search }),
    ...(normalizedProductType && { productType: normalizedProductType }),
    ...(lowStock && { lowStock: lowStock === 'true' }),
    ...(hasStock && { hasStock: hasStock === 'true' })
  };

  const response = await inventoryApi.getInventoryOverview(apiParams);

  if (!response.success) {
    throw new Error(response.error?.message || '获取库存数据失败');
  }

  const data = response.data as any || {};
  const totalInventories = data.total || 0;
  const inventories: InventoryTableItem[] = (data.data || []).map((inventory: any) => ({
    productId: inventory.productId || inventory.product_id,
    productSku: inventory.productSku || inventory.product_sku,
    productName: inventory.productName || inventory.product_name,
    productType: inventory.productType || inventory.product_type,
    totalQuantity: inventory.totalQuantity || inventory.total_quantity || 0,
    totalValue: inventory.totalValue || inventory.total_value || 0,
    batchCount: inventory.batchCount || inventory.batch_count || 0,
    avgUnitCost: inventory.avgUnitCost || inventory.avg_unit_cost || 0,
    oldestBatchDate: inventory.oldestBatchDate || inventory.oldest_batch_date || new Date().toISOString(),
    lowStockAlert: inventory.lowStockAlert || inventory.low_stock_alert || false
  }));

  return (
    <InventoryTable data={inventories} totalData={totalInventories} />
  );
}
