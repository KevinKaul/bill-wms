"use client";

import { AdjustmentTable } from './adjustment-tables';
import { createClientApi } from '@/lib/client-api';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

interface AdjustmentTableItem {
  id: string;
  product_id: string;
  product_sku: string;
  product_name: string;
  type: 'increase' | 'decrease';
  quantity: number;
  unit_cost: number | null;
  total_cost: number | null;
  reason: string;
  remark: string | null;
  created_by: string;
  created_at: string;
}

interface AdjustmentListingPageProps {
  searchParams: {
    page?: string;
    per_page?: string;
    sort?: string;
    product_id?: string;
    type?: string;
    reason?: string;
    date_from?: string;
    date_to?: string;
  };
}

export function AdjustmentListingPage({ searchParams }: AdjustmentListingPageProps) {
  const { getToken, isSignedIn } = useAuth();
  const [loading, setLoading] = useState(true);
  const [adjustments, setAdjustments] = useState<AdjustmentTableItem[]>([]);
  const [totalAdjustments, setTotalAdjustments] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const {
    page,
    per_page,
    sort,
    product_id,
    type,
    reason,
    date_from,
    date_to
  } = searchParams;

  const pageAsNumber = Number(page) || 1;
  const perPageAsNumber = Number(per_page) || 10;
  const [sortBy, sortOrder] = (sort?.split('.') as [string, 'asc' | 'desc']) || ['created_at', 'desc'];

  useEffect(() => {
    async function fetchAdjustments() {
      if (!isSignedIn) return;

      try {
        setLoading(true);
        setError(null);

        const clientApi = createClientApi(getToken);
        
        const apiParams = {
          page: pageAsNumber,
          per_page: perPageAsNumber,
          sort: sortBy,
          order: sortOrder,
          ...(product_id && { product_id }),
          ...(type && { type }),
          ...(reason && { reason }),
          ...(date_from && { date_from }),
          ...(date_to && { date_to })
        };

        const response = await clientApi.inventory.getAdjustments(apiParams);

        if (response.success && response.data) {
          const data = response.data as any;
          setAdjustments(data.adjustments || []);
          setTotalAdjustments(data.total || 0);
        } else {
          setError(response.error?.message || '获取调整记录数据失败');
        }
      } catch (err) {
        console.error('获取调整记录失败:', err);
        setError('获取调整记录数据失败');
      } finally {
        setLoading(false);
      }
    }

    fetchAdjustments();
  }, [isSignedIn, getToken, pageAsNumber, perPageAsNumber, sortBy, sortOrder, product_id, type, reason, date_from, date_to]);

  if (loading) {
    return <div>加载中...</div>;
  }

  if (error) {
    return <div>错误: {error}</div>;
  }

  return (
    <AdjustmentTable
      data={adjustments}
      totalData={totalAdjustments}
    />
  );
}
