import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { InventoryAdjustmentForm } from "@/features/inventory/components/inventory-adjustment-form";
import { Suspense } from "react";

interface AdjustPageProps {
  searchParams: Promise<{
    productId?: string;
    batchId?: string;
    type?: string;
  }>;
}

export const metadata = {
  title: "库存调整 - 仓库管理系统",
};

export default async function AdjustPage({ searchParams }: AdjustPageProps) {
  const { productId, batchId, type } = await searchParams;

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <div className="flex items-start justify-between">
          <Heading
            title="库存调整"
            description="手动调整库存数量，支持增加和减少操作"
          />
        </div>
        <Separator />
        <Suspense fallback={<div>加载中...</div>}>
          <InventoryAdjustmentForm 
            productId={productId} 
            batchId={batchId} 
            defaultType={type as 'increase' | 'decrease'}
          />
        </Suspense>
      </div>
    </PageContainer>
  );
}
