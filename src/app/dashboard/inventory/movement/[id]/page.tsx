import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { MovementDetail } from "@/features/inventory/components/movement-detail";
import { Suspense } from "react";

interface MovementDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "库存移动详情 - 仓库管理系统",
};

export default async function MovementDetailPage({ params }: MovementDetailPageProps) {
  const { id } = await params;

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <div className="flex items-start justify-between">
          <Heading
            title="库存移动详情"
            description="查看库存移动记录的详细信息"
          />
        </div>
        <Separator />
        <Suspense fallback={<div>加载中...</div>}>
          <MovementDetail movementId={id} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
