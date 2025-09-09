import PageContainer from '@/components/layout/page-container';
import { PurchaseOrderDetail } from '@/features/purchases/components/purchase-order-detail';

interface PurchaseOrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PurchaseOrderDetailPage({ params }: PurchaseOrderDetailPageProps) {
  const { id } = await params;

  return (
    <PageContainer>
      <PurchaseOrderDetail orderId={id} />
    </PageContainer>
  );
}
