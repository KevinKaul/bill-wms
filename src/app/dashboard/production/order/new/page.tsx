import { Suspense } from 'react';

import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import PageContainer from '@/components/layout/page-container';
import { ProductionOrderForm } from '@/features/production/components/production-order-form';

export const metadata = {
  title: '新增加工单'
};

export default function NewProductionOrderPage() {
  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title='新增加工单'
            description='创建新的产品加工订单'
          />
        </div>
        <Separator />
        <Suspense fallback={<div>加载中...</div>}>
          <ProductionOrderForm />
        </Suspense>
      </div>
    </PageContainer>
  );
}
