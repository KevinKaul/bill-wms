'use client';

import { MovementTable } from './movement-tables';
import { getMovements } from '@/lib/mock-inventory';
import { MovementFilters } from '@/types/inventory';

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

export async function MovementListingPage({ searchParams }: MovementListingPageProps) {
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
  const [sortBy, sortOrder] = (sort?.split('.') as [string, 'asc' | 'desc']) || ['movementDate', 'desc'];

  const filters: MovementFilters = {
    movementNumber,
    batchNumber,
    productSku,
    type: type as any,
    sourceType: sourceType as any,
    batchId,
    productId
  };

  const { movements, total } = await getMovements({
    page: pageAsNumber,
    per_page: perPageAsNumber,
    sort: sortBy,
    order: sortOrder,
    filters
  });

  return (
    <MovementTable
      data={movements}
      totalData={total}
    />
  );
}
