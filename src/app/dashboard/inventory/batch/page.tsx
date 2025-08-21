import { Suspense } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { BatchListingPage } from '@/features/inventory/components/batch-listing';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';

interface BatchPageProps {
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

export default function BatchPage({ searchParams }: BatchPageProps) {
  return (
    <>
      <div className='flex items-start justify-between'>
        <Heading
          title='批次管理'
          description='管理库存批次信息，跟踪批次来源、数量和成本'
        />
        <Button>
          <Plus className='mr-2 h-4 w-4' /> 手动入库
        </Button>
      </div>
      <Separator />
      <Suspense
        fallback={
          <DataTableSkeleton
            columnCount={8}
            cellWidths={['10rem', '12rem', '8rem', '8rem', '10rem', '8rem', '8rem', '3rem']}
            shrinkZero
          />
        }
      >
        <BatchListingPage searchParams={searchParams} />
      </Suspense>
    </>
  );
}
