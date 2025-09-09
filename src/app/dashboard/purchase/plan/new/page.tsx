import { Breadcrumbs } from "@/components/breadcrumbs";
import PageContainer from "@/components/layout/page-container";
import { PurchasePlanForm } from "@/features/purchases/components/purchase-plan-form";

export const metadata = {
  title: "新增采购计划",
};

export default function Page() {
  return (
    <PageContainer scrollable={true}>
      <div className="flex flex-1 flex-col space-y-4">
        {/* <Breadcrumbs /> */}
        <PurchasePlanForm />
      </div>
    </PageContainer>
  );
}
