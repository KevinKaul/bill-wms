import { Breadcrumbs } from '@/components/breadcrumbs';
import PageContainer from '@/components/layout/page-container';
import { SupplierForm } from '@/features/suppliers/components/supplier-form';

export const metadata = {
  title: '新增供应商'
};

export default function Page() {
  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-4'>
        <Breadcrumbs />
        <SupplierForm />
      </div>
    </PageContainer>
  );
}
