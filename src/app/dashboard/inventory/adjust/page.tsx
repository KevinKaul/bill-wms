import { Suspense } from "react";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { InventoryAdjustmentForm } from "@/features/inventory/components/inventory-adjustment-form";

interface AdjustPageProps {
  searchParams: Promise<{
    productId?: string;
    batchId?: string;
  }>;
}

export default async function AdjustPage({ searchParams }: AdjustPageProps) {
  const { productId, batchId } = await searchParams;

  return (
    <>
      <Separator />
      <Suspense fallback={<div>加载中...</div>}>
        <InventoryAdjustmentForm productId={productId} batchId={batchId} />
      </Suspense>
    </>
  );
}
