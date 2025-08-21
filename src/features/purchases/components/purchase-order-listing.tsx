import { PurchaseOrderTableItem } from '@/types/purchase';
import { fakePurchaseOrdersApi } from '@/lib/mock-purchases';
import { searchParamsCache } from '@/lib/searchparams';
import { PurchaseOrderTable } from './purchase-order-tables';

type PurchaseOrderListingPageProps = {};

export default async function PurchaseOrderListingPage({}: PurchaseOrderListingPageProps) {
  // 从搜索参数缓存获取过滤条件
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');
  const status = searchParamsCache.get('status');
  const paymentStatus = searchParamsCache.get('paymentStatus');
  const deliveryStatus = searchParamsCache.get('deliveryStatus');

  const filters = {
    page,
    limit: pageLimit,
    ...(search && typeof search === 'string' && { search }),
    ...(status && typeof status === 'string' && { status }),
    ...(paymentStatus && typeof paymentStatus === 'string' && { paymentStatus }),
    ...(deliveryStatus && typeof deliveryStatus === 'string' && { deliveryStatus })
  };

  const data = await fakePurchaseOrdersApi.getPurchaseOrders(filters);
  const totalOrders = data.total_orders;
  const orders: PurchaseOrderTableItem[] = data.orders.map(order => ({
    id: order.id,
    orderNumber: order.orderNumber,
    supplierCode: order.supplierCode,
    supplierName: order.supplierName,
    status: order.status,
    paymentStatus: order.paymentStatus,
    deliveryStatus: order.deliveryStatus,
    totalAmount: order.totalAmount,
    itemCount: order.items.length,
    orderDate: order.orderDate.toISOString(),
    expectedDeliveryDate: order.expectedDeliveryDate?.toISOString()
  }));

  return (
    <PurchaseOrderTable data={orders} totalData={totalOrders} />
  );
}
