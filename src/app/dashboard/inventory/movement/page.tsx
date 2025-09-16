import PageContainer from "@/components/layout/page-container";
import { buttonVariants } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { MovementListingPage } from "@/features/inventory/components/movement-listing";
import { cn } from "@/lib/utils";
import { IconTrendingUp, IconTrendingDown } from "@tabler/icons-react";
import Link from "next/link";
import { Suspense } from "react";

interface MovementPageProps {
  searchParams: Promise<{
    page?: string;
    per_page?: string;
    sort?: string;
    movementNumber?: string;
    batchNumber?: string;
    productSku?: string;
    type?: string;
    sourceType?: string;
    batchId?: string;
    productId?: string;
  }>;
}

export const metadata = {
  title: "库存移动记录 - 仓库管理系统",
};

export default async function MovementPage({ searchParams }: MovementPageProps) {
  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <div className="flex items-start justify-between">
          <Heading
            title="库存移动记录"
            description="查看所有库存移动记录，包括入库、出库、调拨和调整"
          />
          <div className="flex gap-2">
            <Link
              href="/dashboard/inventory/adjust?type=increase"
              className={cn(buttonVariants({ variant: "outline" }), "text-xs md:text-sm")}
            >
              <IconTrendingUp className="mr-2 h-4 w-4" /> 手动入库
            </Link>
            <Link
              href="/dashboard/inventory/adjust?type=decrease"
              className={cn(buttonVariants({ variant: "outline" }), "text-xs md:text-sm")}
            >
              <IconTrendingDown className="mr-2 h-4 w-4" /> 手动出库
            </Link>
          </div>
        </div>
        <Separator />
        <Suspense
          fallback={
            <DataTableSkeleton columnCount={9} rowCount={10} filterCount={3} />
          }
        >
          <MovementListingPage searchParams={await searchParams} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
