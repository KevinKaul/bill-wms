"use client";

import { MovementTable } from './movement-tables';
import { createClientApi } from '@/lib/client-api';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { MovementTableItem } from '@/types/inventory';

interface MovementListingPageProps {
  searchParams: {
    page?: string;
    per_page?: string;
    sort?: string;
    movementNumber?: string;
    batchNumber?: string;
    productSku?: string;
    type?: string;
    sourceType?: string;
    batchId?: string;
    productId?: string;
  };
}

export function MovementListingPage({ searchParams }: MovementListingPageProps) {
  const { getToken, isSignedIn } = useAuth();
  const [loading, setLoading] = useState(true);
  const [movements, setMovements] = useState<MovementTableItem[]>([]);
  const [totalMovements, setTotalMovements] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const {
    page,
    per_page,
    sort,
    movementNumber,
    batchNumber,
    productSku,
    type,
    sourceType,
    batchId,
    productId
  } = searchParams;

  const pageAsNumber = Number(page) || 1;
  const perPageAsNumber = Number(per_page) || 10;
  const [sortBy, sortOrder] = (sort?.split('.') as [string, 'asc' | 'desc']) || ['createdAt', 'desc'];

  useEffect(() => {
    async function fetchMovements() {
      if (!isSignedIn) return;

      try {
        setLoading(true);
        setError(null);

        const clientApi = createClientApi(getToken);
        
        const apiParams = {
          page: pageAsNumber,
          per_page: perPageAsNumber,
          sort: `${sortBy}.${sortOrder}`,
          ...(movementNumber && { movementNumber }),
          ...(batchNumber && { batchNumber }),
          ...(productSku && { productSku }),
          ...(type && { type }),
          ...(sourceType && { sourceType }),
          ...(batchId && { batchId }),
          ...(productId && { productId })
        };

        const response = await clientApi.inventory.getMovements(apiParams);

        if (response.success && response.data) {
          const data = response.data as any;
          setMovements(data.data || []);
          setTotalMovements(data.total || 0);
        } else {
          setError(response.error?.message || '获取移动记录数据失败');
        }
      } catch (err) {
        console.error('获取移动记录失败:', err);
        setError('获取移动记录数据失败');
      } finally {
        setLoading(false);
      }
    }

    fetchMovements();
  }, [isSignedIn, getToken, pageAsNumber, perPageAsNumber, sortBy, sortOrder, movementNumber, batchNumber, productSku, type, sourceType, batchId, productId]);

  if (loading) {
    return <div>加载中...</div>;
  }

  if (error) {
    return <div>错误: {error}</div>;
  }

  return (
    <MovementTable
      data={movements}
      totalData={totalMovements}
    />
  );
}
