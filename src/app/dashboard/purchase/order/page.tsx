import Link from 'next/link';
import { Plus as IconPlus } from 'lucide-react';
import { Suspense } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import PageContainer from '@/components/layout/page-container';
import { searchParamsCache } from '@/lib/searchparams';
import { cn } from '@/lib/utils';
import PurchaseOrderListingPage from '@/features/purchases/components/purchase-order-listing';

type pageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export const metadata = {
  title: '采购单管理'
};

export default async function Page(props: pageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title='采购单管理'
            description='管理采购订单，跟踪付款状态和到货状态'
          />
          <Link
            href='/dashboard/purchase/order/new'
            className={cn(buttonVariants(), 'text-xs md:text-sm')}
          >
            <IconPlus className='mr-2 h-4 w-4' /> 新增采购单
          </Link>
        </div>
        <Separator />
        <Suspense
          fallback={
            <DataTableSkeleton columnCount={9} rowCount={10} filterCount={3} />
          }
        >
          <PurchaseOrderListingPage />
        </Suspense>
      </div>
    </PageContainer>
  );
}
