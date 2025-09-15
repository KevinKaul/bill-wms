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
import ProductionListingPage from '@/features/production/components/production-listing';

type pageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export const metadata = {
  title: '加工单管理'
};

export default async function Page(props: pageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title='加工单管理'
            description='管理产品加工订单，跟踪生产进度和成本'
          />
          <Link
            href='/dashboard/production/order/new'
            className={cn(buttonVariants(), 'text-xs md:text-sm')}
          >
            <IconPlus className='mr-2 h-4 w-4' /> 新增加工单
          </Link>
        </div>
        <Separator />
        <Suspense
          fallback={
            <DataTableSkeleton
              columnCount={10}
              cellWidths={['10rem', '15rem', '12rem', '8rem', '8rem', '10rem', '8rem', '8rem', '10rem', '12rem']}
              shrinkZero
            />
          }
        >
          <ProductionListingPage />
        </Suspense>
      </div>
    </PageContainer>
  );
}
