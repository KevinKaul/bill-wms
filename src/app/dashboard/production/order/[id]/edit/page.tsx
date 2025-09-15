import PageContainer from '@/components/layout/page-container';
import { ProductionOrderForm } from '@/features/production/components/production-order-form';

interface ProductionOrderEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductionOrderEditPage({ params }: ProductionOrderEditPageProps) {
  const { id } = await params;

  return (
    <PageContainer>
      <ProductionOrderForm orderId={id} />
    </PageContainer>
  );
}
