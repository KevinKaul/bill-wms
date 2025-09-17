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
          console.log('API返回的数据:', data); // 添加调试日志
          
          // API返回的数据结构是 { movements: [...], total: number }
          const movementList = data.movements || [];
          console.log('解析的移动记录:', movementList); // 添加调试日志
          
          // 数据映射：将API返回的snake_case字段映射为前端期望的camelCase
          const mappedMovements = movementList.map((movement: any) => ({
            id: movement.id,
            movementNumber: movement.id, // 使用ID作为移动编号
            batchNumber: movement.batch_number || 'N/A',
            productSku: movement.product_sku,
            productName: movement.product_name,
            type: movement.movement_type,
            quantity: Number(movement.quantity || 0),
            unitCost: Number(movement.unit_cost || 0),
            totalCost: Number(movement.total_cost || 0),
            remainingQuantity: Number(movement.quantity || 0), // 暂时使用quantity
            sourceType: movement.source_type,
            sourceReference: movement.source_reference,
            fromLocation: movement.from_location,
            toLocation: movement.to_location,
            operatorName: 'System', // 暂时硬编码
            movementDate: movement.created_at
          }));
          
          console.log('映射后的数据:', mappedMovements); // 添加调试日志
          setMovements(mappedMovements);
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
