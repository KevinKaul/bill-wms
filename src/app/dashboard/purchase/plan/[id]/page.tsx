import { Suspense } from 'react';
import PageContainer from "@/components/layout/page-container";
import { PurchasePlanDetail } from '@/features/purchases/components/purchase-plan-detail';

interface PurchasePlanDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PurchasePlanDetailPage({ params }: PurchasePlanDetailPageProps) {
  const resolvedParams = await params;
  return (
    <PageContainer scrollable={true}>
      <div className="flex flex-1 flex-col space-y-4">
        <Suspense fallback={<div>加载中...</div>}>
          <PurchasePlanDetail planId={resolvedParams.id} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
