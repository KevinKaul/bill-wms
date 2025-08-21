'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductionOrderTableItem, ProductionOrderFilters } from '@/types/production';
import { fakeProductionApi } from '@/lib/mock-production';
import { ProductionTable } from './production-tables';

export default function ProductionListingPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<ProductionOrderTableItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);

  // 从URL参数构建筛选器
  const buildFiltersFromParams = (): ProductionOrderFilters => {
    const filters: ProductionOrderFilters = {};
    
    const status = searchParams.get('status');
    if (status && status !== 'all') {
      filters.status = status as any;
    }

    const paymentStatus = searchParams.get('paymentStatus');
    if (paymentStatus && paymentStatus !== 'all') {
      filters.paymentStatus = paymentStatus as any;
    }

    const supplierId = searchParams.get('supplierId');
    if (supplierId) {
      filters.supplierId = supplierId;
    }

    const productId = searchParams.get('productId');
    if (productId) {
      filters.productId = productId;
    }

    const search = searchParams.get('search');
    if (search) {
      filters.search = search;
    }

    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    if (dateFrom && dateTo) {
      filters.dateRange = {
        from: dateFrom,
        to: dateTo
      };
    }

    return filters;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const sortBy = searchParams.get('sortBy') || undefined;
      const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';
      
      const filters = buildFiltersFromParams();

      const response = await fakeProductionApi.getProductionOrders({
        page,
        limit,
        filters,
        sortBy,
        sortOrder
      });

      setData(response.orders);
      setTotalItems(response.total);
    } catch (error) {
      console.error('获取加工单列表失败:', error);
      setData([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchParams]);

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
