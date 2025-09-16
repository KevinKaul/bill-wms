import PageContainer from "@/components/layout/page-container";
import { buttonVariants } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { BatchListingPage } from "@/features/inventory/components/batch-listing";
import { cn } from "@/lib/utils";
import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import { Suspense } from "react";

interface BatchPageProps {
  searchParams: Promise<{
    page?: string;
    per_page?: string;
    sort?: string;
    batchNumber?: string;
    productSku?: string;
    sourceType?: string;
    productId?: string;
  }>;
}

export const metadata = {
  title: "批次管理 - 仓库管理系统",
};

export default async function BatchPage({ searchParams }: BatchPageProps) {
  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <div className="flex items-start justify-between">
          <Heading
            title="批次管理"
            description="管理库存批次信息，跟踪批次来源、数量和成本"
          />
          <Link
            href="/dashboard/inventory/adjust"
            className={cn(buttonVariants(), "text-xs md:text-sm")}
          >
            <IconPlus className="mr-2 h-4 w-4" /> 手动入库
          </Link>
        </div>
        <Separator />
        <Suspense
          fallback={
            <DataTableSkeleton columnCount={8} rowCount={10} filterCount={3} />
          }
        >
          <BatchListingPage searchParams={await searchParams} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
