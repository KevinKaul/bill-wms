import Link from 'next/link';
import { Package, History, TrendingDown } from 'lucide-react';
import { Suspense } from 'react';

import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import PageContainer from '@/components/layout/page-container';
import { searchParamsCache } from '@/lib/searchparams';
import InventoryListingPage from '@/features/inventory/components/inventory-listing';

type pageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export const metadata = {
  title: '库存管理'
};

export default async function Page(props: pageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title='库存管理'
            description='管理库存汇总信息，查看产品库存状态和价值'
          />
          <div className='flex gap-2'>
            <Button asChild variant='outline'>
              <Link href='/dashboard/inventory/batch'>
                <Package className='mr-2 h-4 w-4' /> 批次管理
              </Link>
            </Button>
            <Button asChild variant='outline'>
              <Link href='/dashboard/inventory/movement'>
                <History className='mr-2 h-4 w-4' /> 移动记录
              </Link>
            </Button>
            <Button asChild>
              <Link href='/dashboard/inventory/adjust'>
                <TrendingDown className='mr-2 h-4 w-4' /> 库存调整
              </Link>
            </Button>
          </div>
        </div>
        <Separator />
        <Suspense
          fallback={
            <DataTableSkeleton columnCount={7} rowCount={10} filterCount={3} />
          }
        >
          <InventoryListingPage />
        </Suspense>
      </div>
    </PageContainer>
  );
}
