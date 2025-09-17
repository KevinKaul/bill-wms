"use client";

import { ProductionOrderTableItem } from '@/types/production';
import { createClientApi } from '@/lib/client-api';
import { ProductionTable } from './production-tables';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type ProductionListingPageProps = {};

export default function ProductionListingPage({}: ProductionListingPageProps) {
  const { getToken, isSignedIn } = useAuth();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<ProductionOrderTableItem[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!isSignedIn) return;

      try {
        setLoading(true);
        setError(null);

        // 从URL搜索参数获取过滤条件
        const page = parseInt(searchParams.get('page') || '1');
        const per_page = parseInt(searchParams.get('per_page') || '10');
        const search = searchParams.get('search') || undefined;
        const productId = searchParams.get('productId') || undefined;
        const supplierId = searchParams.get('supplierId') || undefined;
        const status = searchParams.get('status') || undefined;
        const paymentStatus = searchParams.get('paymentStatus') || undefined;
        const dateFrom = searchParams.get('dateFrom') || undefined;
        const dateTo = searchParams.get('dateTo') || undefined;
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

        const filters = {
          page,
          per_page,
          ...(search && { search }),
          ...(productId && { product_id: productId }),
          ...(supplierId && { supplier_id: supplierId }),
          ...(status && { status }),
          ...(paymentStatus && { payment_status: paymentStatus }),
          ...(dateFrom && { date_from: dateFrom }),
          ...(dateTo && { date_to: dateTo }),
          sort: sortBy,
          order: sortOrder,
        };

        console.log('搜索参数:', filters);

        const clientApi = createClientApi(getToken);
        const response = await clientApi.production.getOrders(filters);

        console.log('API响应:', response);
        console.log('API响应数据:', response.data);

        if (!response.success) {
          throw new Error(response.error?.message || '获取加工单列表失败');
        }

        const data = response.data as any || {};
        const apiData = data.orders || [];
        const total = data.total || 0;

        console.log('解析后的数据:', { apiData, total });

        // 将API返回的数据格式映射到表格组件期望的格式
        const orderList: ProductionOrderTableItem[] = apiData.map((order: any) => {
          console.log('映射单个订单:', order);
          return {
            id: order.id,
            orderNumber: order.order_number,
            productInfo: {
              sku: order.product_sku || '',
              name: order.product_name || '',
            },
            plannedQuantity: order.planned_quantity != null ? Number(order.planned_quantity) : 0,
            actualQuantity: order.actual_quantity != null ? Number(order.actual_quantity) : undefined,
            materialCost: order.material_cost != null ? Number(order.material_cost) : 0,
            processingFee: order.processing_fee != null ? Number(order.processing_fee) : 0,
            totalCost: order.total_cost != null ? Number(order.total_cost) : 0,
            supplierName: order.supplier_name,
            status: order.status,
            paymentStatus: order.payment_status,
            orderDate: order.order_date,
            startDate: order.start_date,
            completionDate: order.completion_date,
            qualityStatus: order.quality_status,
            remark: order.remark,
            createdAt: order.created_at,
            updatedAt: order.updated_at,
          };
        });

        console.log('映射后的订单列表:', orderList);

        setOrders(orderList);
        setTotalOrders(total);
      } catch (err) {
        console.error('获取加工单列表失败:', err);
        setError(err instanceof Error ? err.message : '获取加工单列表失败');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isSignedIn, getToken, searchParams, refreshTrigger]);

  // 刷新数据的函数
  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading) {
    return <div className="p-4">加载中...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">错误: {error}</div>;
  }

  if (!isSignedIn) {
    return <div className="p-4">请先登录</div>;
  }

  // 如果没有数据，显示空状态而不是表格
  if (orders.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-muted-foreground">
          <h3 className="text-lg font-medium">暂无加工单数据</h3>
          <p className="mt-2 text-sm">点击&quot;新增加工单&quot;按钮创建第一个加工单</p>
        </div>
      </div>
    );
  }

  return (
    <ProductionTable
      data={orders}
      totalItems={totalOrders}
      onRefresh={refreshData}
    />
  );
}
