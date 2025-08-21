import { Suspense } from 'react';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { MovementListingPage } from '@/features/inventory/components/movement-listing';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';

interface MovementPageProps {
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

export default function MovementPage({ searchParams }: MovementPageProps) {
  return (
    <>
      <div className='flex items-start justify-between'>
        <Heading
          title='库存移动记录'
          description='查看所有库存移动记录，包括入库、出库、调拨和调整'
        />
        <div className='flex gap-2'>
          <Button variant='outline'>
            <TrendingUp className='mr-2 h-4 w-4' /> 手动入库
          </Button>
          <Button variant='outline'>
            <TrendingDown className='mr-2 h-4 w-4' /> 手动出库
          </Button>
        </div>
      </div>
      <Separator />
      <Suspense
        fallback={
          <DataTableSkeleton
            columnCount={9}
            cellWidths={['10rem', '8rem', '12rem', '8rem', '8rem', '10rem', '8rem', '8rem', '3rem']}
            shrinkZero
          />
        }
      >
        <MovementListingPage searchParams={searchParams} />
      </Suspense>
    </>
  );
}
