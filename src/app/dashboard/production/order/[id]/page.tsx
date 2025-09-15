import PageContainer from '@/components/layout/page-container';
import { ProductionOrderDetail } from '@/features/production/components/production-order-detail';

interface ProductionOrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductionOrderDetailPage({ params }: ProductionOrderDetailPageProps) {
  const { id } = await params;

  return (
    <PageContainer>
      <ProductionOrderDetail orderId={id} />
    </PageContainer>
  );
}
