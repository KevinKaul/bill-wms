import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/breadcrumbs';
import PageContainer from '@/components/layout/page-container';
import { SupplierForm } from '@/features/suppliers/components/supplier-form';
import { suppliersApi } from '@/lib/api-client';

export const metadata = {
  title: '编辑供应商'
};

interface PageProps {
  params: Promise<{
    supplierId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { supplierId } = await params;
  const response = await suppliersApi.getSupplier(supplierId);

  if (!response.success || !response.data) {
    notFound();
  }

  const supplier = response.data as any;

  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-4'>
        <Breadcrumbs />
        <SupplierForm 
          initialData={{
            id: supplier.id,
            code: supplier.code,
            name: supplier.name,
            account: supplier.account,
            contactPerson: supplier.contactPerson,
            phone: supplier.phone,
            email: supplier.email,
            address: supplier.address,
            remark: supplier.remark
          }} 
        />
      </div>
    </PageContainer>
  );
}
