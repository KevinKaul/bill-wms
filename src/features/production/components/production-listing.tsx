'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductionOrderTableItem, ProductionOrderFilters } from '@/types/production';
import { ProductionTable } from './production-tables';

export default function ProductionListingPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<ProductionOrderTableItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);


  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const page = parseInt(searchParams.get('page') || '1');
      const per_page = parseInt(searchParams.get('limit') || '10');
      const search = searchParams.get('search') || undefined;
      const product_id = searchParams.get('productId') || undefined;
      const supplier_id = searchParams.get('supplierId') || undefined;
      const status = searchParams.get('status') || undefined;
      const payment_status = searchParams.get('paymentStatus') || undefined;
      const date_from = searchParams.get('dateFrom') || undefined;
      const date_to = searchParams.get('dateTo') || undefined;
      const sort = searchParams.get('sortBy') || 'createdAt';
      const order = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

      // 构建查询参数
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('per_page', per_page.toString());
      if (search) queryParams.append('search', search);
      if (product_id) queryParams.append('product_id', product_id);
      if (supplier_id) queryParams.append('supplier_id', supplier_id);
      if (status) queryParams.append('status', status.toUpperCase());
      if (payment_status) queryParams.append('payment_status', payment_status.toUpperCase());
      if (date_from) queryParams.append('date_from', date_from);
      if (date_to) queryParams.append('date_to', date_to);
      queryParams.append('sort', sort);
      queryParams.append('order', order);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/production/orders?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || '获取加工单列表失败');
      }

      // 转换数据格式以匹配前端类型
      const orders: ProductionOrderTableItem[] = result.data.orders.map((order: any) => ({
        id: order.id,
        orderNumber: order.order_number,
        productInfo: {
          sku: order.product_sku,
          name: order.product_name,
        },
        plannedQuantity: order.planned_quantity,
        actualQuantity: order.actual_quantity,
        materialCost: order.material_cost,
        processingFee: order.processing_fee,
        totalCost: order.total_cost,
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
      }));

      setData(orders);
      setTotalItems(result.data.total);
    } catch (error) {
      console.error('获取加工单列表失败:', error);
      setData([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchData();
  }, [searchParams, fetchData]);

  const handleFiltersChange = (filters: ProductionOrderFilters) => {
    // 这里可以处理筛选器变化，更新URL参数
    console.log('筛选器变化:', filters);
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-32'>
        <div className='text-sm text-muted-foreground'>加载中...</div>
      </div>
    );
  }

  return (
    <ProductionTable
      data={data}
      totalItems={totalItems}
      onFiltersChange={handleFiltersChange}
    />
  );
}
