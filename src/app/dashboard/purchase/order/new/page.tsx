import { Breadcrumbs } from '@/components/breadcrumbs';
import PageContainer from '@/components/layout/page-container';
import { PurchaseOrderForm } from '@/features/purchases/components/purchase-order-form';

export const metadata = {
  title: '新增采购单'
};

export default function Page() {
  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-4'>
        <Breadcrumbs />
        <PurchaseOrderForm />
      </div>
    </PageContainer>
  );
}
