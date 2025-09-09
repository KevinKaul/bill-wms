import { Suspense } from 'react';
import { Breadcrumbs } from "@/components/breadcrumbs";
import PageContainer from "@/components/layout/page-container";
import { PurchasePlanForm } from '@/features/purchases/components/purchase-plan-form';

interface PurchasePlanEditPageProps {
  params: {
    id: string;
  };
}

export default function PurchasePlanEditPage({ params }: PurchasePlanEditPageProps) {
  return (
    <PageContainer scrollable={true}>
      <div className="flex flex-1 flex-col space-y-4">
        {/* <Breadcrumbs /> */}
        <Suspense fallback={<div>加载中...</div>}>
          <PurchasePlanForm planId={params.id} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
