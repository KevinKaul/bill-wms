'use client';

import { BatchTable } from './batch-tables';
import { getBatches } from '@/lib/mock-inventory';
import { getRawMaterialBatches } from '@/lib/purchase-inbound';
import { BatchFilters } from '@/types/inventory';
import { Button } from '@/components/ui/button';
import { Plus, Download } from 'lucide-react';

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

  const filters: BatchFilters = {
    batchNumber,
    productSku,
    sourceType: sourceType as any,
    productId
  };

  const { batches, total } = await getBatches({
    page: pageAsNumber,
    per_page: perPageAsNumber,
    sort: sortBy,
    order: sortOrder,
    filters
  });

  return (
    <BatchTable
      data={batches}
      totalData={total}
    />
  );
}
