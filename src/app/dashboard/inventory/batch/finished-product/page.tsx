import { Suspense } from 'react';
import { Metadata } from 'next';
import { FinishedProductBatchListing } from '@/features/inventory/components/finished-product-batch-listing';
import { Card, CardContent } from '@/components/ui/card';
import { Factory } from 'lucide-react';

export const metadata: Metadata = {
  title: '成品批次管理',
  description: '管理成品批次库存，查看生产入库记录和质量检验状态'
};

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-muted rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function FinishedProductBatchPage() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Factory className="h-8 w-8" />
            成品批次管理
          </h2>
          <p className="text-muted-foreground">
            管理成品批次库存，查看生产入库记录和质量检验状态
          </p>
        </div>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <FinishedProductBatchListing />
      </Suspense>
    </div>
  );
}
