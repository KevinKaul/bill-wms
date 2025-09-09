import PageContainer from '@/components/layout/page-container';
import { PurchaseOrderForm } from '@/features/purchases/components/purchase-order-form';

interface PurchaseOrderEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function PurchaseOrderEditPage({ params }: PurchaseOrderEditPageProps) {
  const { id } = await params;

  return (
    <PageContainer>
      <PurchaseOrderForm orderId={id} />
    </PageContainer>
  );
}
