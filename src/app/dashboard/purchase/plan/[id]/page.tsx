import { Suspense } from 'react';
import PageContainer from "@/components/layout/page-container";
import { PurchasePlanDetail } from '@/features/purchases/components/purchase-plan-detail';

interface PurchasePlanDetailPageProps {
  params: {
    id: string;
  };
}

export default function PurchasePlanDetailPage({ params }: PurchasePlanDetailPageProps) {
  return (
    <PageContainer scrollable={true}>
      <div className="flex flex-1 flex-col space-y-4">
        <Suspense fallback={<div>加载中...</div>}>
          <PurchasePlanDetail planId={params.id} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
