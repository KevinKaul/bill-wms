'use client';

import { PurchasePlanTableItem } from '@/types/purchase';
import { PurchasePlanTable } from './purchase-plan-tables';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type PurchasePlanListingPageProps = {};

export default function PurchasePlanListingPage({}: PurchasePlanListingPageProps) {
  const { getToken } = useAuth();
  const searchParams = useSearchParams();
  const [data, setData] = useState<PurchasePlanTableItem[]>([]);
  const [totalData, setTotalData] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const page = parseInt(searchParams.get('page') || '1');
        const search = searchParams.get('name') || undefined;
        const pageLimit = parseInt(searchParams.get('perPage') || '10');
        const status = searchParams.get('status') || undefined;

        const filters = {
          page,
          per_page: pageLimit,
          ...(search && { search }),
          ...(status && { status })
        };

        const token = await getToken();
        const response = await fetch(`/api/v1/purchase/plans?${new URLSearchParams(
          Object.entries(filters).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
        ).toString()}`, {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` })
          }
        });
        
        if (!response.ok) {
          throw new Error('获取采购计划列表失败');
        }

        const result = await response.json();
        const responseData = result.data;
        const totalPlans = responseData.total;
        const plans: PurchasePlanTableItem[] = responseData.plans.map((plan: any) => ({
          id: plan.id,
          planNumber: plan.plan_number,
          title: plan.title,
          status: plan.status,
          itemCount: plan.items_count,
          estimatedTotal: plan.total_estimated_amount,
          planDate: plan.created_at,
          expectedExecutionDate: plan.executed_at
        }));

        setData(plans);
        setTotalData(totalPlans);
      } catch (error) {
        console.error('获取采购计划列表失败:', error);
        setData([]);
        setTotalData(0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchParams, getToken]);

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <PurchasePlanTable data={data} totalData={totalData} />
  );
}
