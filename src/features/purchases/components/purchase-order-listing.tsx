'use client';

import { PurchaseOrderTableItem } from '@/types/purchase';
import { PurchaseOrderTable } from './purchase-order-tables';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type PurchaseOrderListingPageProps = {};

export default function PurchaseOrderListingPage({}: PurchaseOrderListingPageProps) {
  const { getToken } = useAuth();
  const searchParams = useSearchParams();
  const [data, setData] = useState<PurchaseOrderTableItem[]>([]);
  const [totalData, setTotalData] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const page = parseInt(searchParams.get('page') || '1');
        const search = searchParams.get('name') || undefined;
        const pageLimit = parseInt(searchParams.get('perPage') || '10');
        const status = searchParams.get('status') || undefined;

        const filters = {
          page,
          per_page: pageLimit,
          ...(search && { search }),
          ...(status && { status })
        };

        const token = await getToken();
        const response = await fetch(`/api/v1/purchase/orders?${new URLSearchParams(
          Object.entries(filters).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
        ).toString()}`, {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` })
          }
        });
        
        if (!response.ok) {
          throw new Error('获取采购单列表失败');
        }

        const result = await response.json();
        const responseData = result.data;
        const totalOrders = responseData.total;
        const orders: PurchaseOrderTableItem[] = responseData.orders.map((order: any) => ({
          id: order.id,
          orderNumber: order.order_number,
          supplierName: order.supplier_name,
          supplierCode: order.supplier_code,
          status: order.status,
          paymentStatus: order.payment_status,
          deliveryStatus: order.delivery_status,
          totalAmount: order.total_amount,
          itemCount: order.items_count,
          orderDate: order.order_date,
          expectedDeliveryDate: order.expected_delivery_date
        }));

        setData(orders);
        setTotalData(totalOrders);
      } catch (error) {
        console.error('获取采购单列表失败:', error);
        setData([]);
        setTotalData(0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchParams, getToken]);

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <PurchaseOrderTable data={data} totalData={totalData} />
  );
}
