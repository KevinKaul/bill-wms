import { PurchasePlanTableItem } from '@/types/purchase';
import { fakePurchasePlansApi } from '@/lib/mock-purchases';
import { searchParamsCache } from '@/lib/searchparams';
import { PurchasePlanTable } from './purchase-plan-tables';

type PurchasePlanListingPageProps = {};

export default async function PurchasePlanListingPage({}: PurchasePlanListingPageProps) {
  // 从搜索参数缓存获取过滤条件
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');
  const status = searchParamsCache.get('status');

  const filters = {
    page,
    limit: pageLimit,
    ...(search && typeof search === 'string' && { search }),
    ...(status && typeof status === 'string' && { status })
  };

  const data = await fakePurchasePlansApi.getPurchasePlans(filters);
  const totalPlans = data.total_plans;
  const plans: PurchasePlanTableItem[] = data.plans.map(plan => ({
    id: plan.id,
    planNumber: plan.planNumber,
    title: plan.title,
    status: plan.status,
    itemCount: plan.items.length,
    estimatedTotal: plan.items.reduce((sum, item) => sum + item.estimatedTotalPrice, 0),
    planDate: plan.planDate.toISOString(),
    expectedExecutionDate: plan.expectedExecutionDate?.toISOString()
  }));

  return (
    <PurchasePlanTable data={plans} totalData={totalPlans} />
  );
}
