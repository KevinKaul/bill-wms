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
import SupplierListingPage from '@/features/suppliers/components/supplier-listing';

type pageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export const metadata = {
  title: '供应商管理'
};

export default async function Page(props: pageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title='供应商管理'
            description='管理供应商基础信息，包括代号、名称、联系方式等'
          />
          <Link
            href='/dashboard/supplier/new'
            className={cn(buttonVariants(), 'text-xs md:text-sm')}
          >
            <IconPlus className='mr-2 h-4 w-4' /> 新增供应商
          </Link>
        </div>
        <Separator />
        <Suspense
          fallback={
            <DataTableSkeleton columnCount={7} rowCount={10} filterCount={2} />
          }
        >
          <SupplierListingPage />
        </Suspense>
      </div>
    </PageContainer>
  );
}
