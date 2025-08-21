import { Suspense } from 'react';
import { Metadata } from 'next';
import { BatchDetail } from '@/features/inventory/components/batch-detail';
import { Card, CardContent } from '@/components/ui/card';
import { Package } from 'lucide-react';

interface BatchDetailPageProps {
  params: {
    batchId: string;
  };
}

export async function generateMetadata({ params }: BatchDetailPageProps): Promise<Metadata> {
  return {
    title: `批次详情 - ${params.batchId}`,
    description: '查看原材料批次的详细信息，包括成本分摊、库存状态和操作记录'
  };
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-2"></div>
          <div className="h-4 bg-muted rounded w-32"></div>
        </div>
        <div className="h-6 bg-muted rounded w-20"></div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function BatchDetailPage({ params }: BatchDetailPageProps) {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <Suspense fallback={<LoadingSkeleton />}>
        <BatchDetail batchId={params.batchId} />
      </Suspense>
    </div>
  );
}
