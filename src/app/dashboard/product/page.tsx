'use client';

import { useState } from 'react';
import PageContainer from "@/components/layout/page-container";
import { buttonVariants } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import ProductListingPage from "@/features/products/components/product-listing";
import { ProductImportDialog } from "@/features/products/components/product-import-dialog";
import { cn } from "@/lib/utils";
import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import { Suspense } from "react";

export default function Page() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <div className="flex items-start justify-between">
          <Heading
            title="产品管理"
            description="管理原材料和组合产品，包括SKU、价格、BOM等信息"
          />
          <div className="flex gap-2">
            <ProductImportDialog onRefresh={handleRefresh} />
            <Link
              href="/dashboard/product/new"
              className={cn(buttonVariants({ variant: "outline" }), "text-xs md:text-sm")}
            >
              <IconPlus className="mr-2 h-4 w-4" /> 新增产品
            </Link>
          </div>
        </div>
        <Separator />
        <Suspense
          key={refreshTrigger}
          fallback={
            <DataTableSkeleton columnCount={6} rowCount={10} filterCount={3} />
          }
        >
          <ProductListingPage refreshTrigger={refreshTrigger} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
