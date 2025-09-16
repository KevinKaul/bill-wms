import { BatchTable } from './batch-tables';
import { inventoryApi } from '@/lib/api-client';
import { BatchTableItem } from '@/types/inventory';

interface BatchListingPageProps {
  searchParams: {
    page?: string;
    per_page?: string;
    sort?: string;
    batchNumber?: string;
    productSku?: string;
    sourceType?: string;
    productId?: string;
  };
}

export async function BatchListingPage({ searchParams }: BatchListingPageProps) {
  const {
    page,
    per_page,
    sort,
    batchNumber,
    productSku,
    sourceType,
    productId
  } = searchParams;

  const pageAsNumber = Number(page) || 1;
  const perPageAsNumber = Number(per_page) || 10;
  const [sortBy, sortOrder] = (sort?.split('.') as [string, 'asc' | 'desc']) || ['inboundDate', 'desc'];

  // 调用封装的API获取批次数据
  const apiParams = {
    page: pageAsNumber,
    per_page: perPageAsNumber,
    sort: `${sortBy}.${sortOrder}`,
    ...(batchNumber && { batchNumber }),
    ...(productSku && { productSku }),
    ...(sourceType && { sourceType }),
    ...(productId && { productId })
  };

  const response = await inventoryApi.getBatches(apiParams);

  if (!response.success) {
    throw new Error(response.error?.message || '获取批次数据失败');
  }

  const data = response.data as any || {};
  const apiData = data.data || [];
  const total = data.total || 0;
  
  // 将API返回的数据格式映射到表格组件期望的格式
  const batches: BatchTableItem[] = apiData.map((batch: any) => ({
    id: batch.id,
    batchNumber: batch.batch_number,
    productSku: batch.product_sku,
    productName: batch.product_name,
    quantity: batch.remaining_quantity,
    originalQuantity: batch.inbound_quantity,
    unitCost: batch.unit_cost,
    totalCost: batch.total_cost,
    inboundDate: batch.inbound_date,
    sourceType: batch.source_type?.toLowerCase() || 'purchase',
    sourceId: batch.source_reference,
    supplierCode: batch.supplier_name,
    location: batch.location || '-'
  }));

  return (
    <BatchTable
      data={batches}
      totalData={total}
    />
  );
}
