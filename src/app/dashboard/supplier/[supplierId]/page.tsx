import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import PageContainer from '@/components/layout/page-container';
import { SupplierViewPage } from '@/features/suppliers/components/supplier-view-page';
import { fakeSuppliersApi } from '@/lib/mock-suppliers';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: '供应商详情'
};

interface PageProps {
  params: Promise<{
    supplierId: string;
  }>;
}

async function SupplierDetails({ supplierId }: { supplierId: string }) {
  const supplier = await fakeSuppliersApi.getSupplierById(supplierId);

  if (!supplier) {
    notFound();
  }

  return <SupplierViewPage supplier={supplier} />;
}

function SupplierDetailsSkeleton() {
  return (
    <div className='flex flex-col space-y-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-3'>
          <Skeleton className='h-8 w-8' />
          <div>
            <Skeleton className='h-8 w-48' />
            <Skeleton className='h-4 w-20 mt-2' />
          </div>
        </div>
        <Skeleton className='h-10 w-24' />
      </div>
      
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        <Skeleton className='h-64 lg:col-span-2' />
        <Skeleton className='h-64' />
      </div>
      
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        <Skeleton className='h-48' />
        <Skeleton className='h-48' />
      </div>
    </div>
  );
}

export default async function Page({ params }: PageProps) {
  const { supplierId } = await params;

  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-4'>
        <Breadcrumbs />
        <Suspense fallback={<SupplierDetailsSkeleton />}>
          <SupplierDetails supplierId={supplierId} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
