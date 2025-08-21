import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/breadcrumbs';
import PageContainer from '@/components/layout/page-container';
import { SupplierForm } from '@/features/suppliers/components/supplier-form';
import { fakeSuppliersApi } from '@/lib/mock-suppliers';

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
  const supplier = await fakeSuppliersApi.getSupplierById(supplierId);

  if (!supplier) {
    notFound();
  }

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
