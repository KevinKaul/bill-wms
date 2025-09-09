"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Edit, ArrowLeft, Calendar, Package, DollarSign } from "lucide-react";

interface PurchasePlanDetailProps {
  planId: string;
}

export function PurchasePlanDetail({ planId }: PurchasePlanDetailProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [planData, setPlanData] = useState<any>(null);

  useEffect(() => {
    const fetchPlanData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/v1/purchase/plans/${planId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setPlanData(result.data);
          } else {
            toast.error('获取采购计划详情失败');
          }
        } else {
          toast.error('获取采购计划详情失败');
        }
      } catch (error) {
        console.error('获取采购计划详情失败:', error);
        toast.error('获取采购计划详情失败');
      } finally {
        setLoading(false);
      }
    };

    fetchPlanData();
  }, [planId]);

  if (loading) {
    return <div className="flex justify-center items-center h-64">加载中...</div>;
  }

  if (!planData) {
    return <div className="flex justify-center items-center h-64">采购计划不存在</div>;
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: '草稿', variant: 'secondary' as const },
      approved: { label: '已批准', variant: 'default' as const },
      executed: { label: '已执行', variant: 'default' as const },
      cancelled: { label: '已取消', variant: 'destructive' as const },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      {/* 头部信息 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{planData.title}</h1>
            <p className="text-muted-foreground">计划编号: {planData.plan_number}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(planData.status)}
          {planData.status === 'draft' && (
            <Button onClick={() => router.push(`/dashboard/purchase/plan/${planId}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              编辑
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 基本信息 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              基本信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">计划标题</label>
                <p className="mt-1">{planData.title}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">状态</label>
                <div className="mt-1">{getStatusBadge(planData.status)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">创建时间</label>
                <p className="mt-1 flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(planData.created_at)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">预计执行时间</label>
                <p className="mt-1 flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {planData.executed_at ? formatDate(planData.executed_at) : '未设置'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">创建人</label>
                <p className="mt-1">{planData.created_by || '系统'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">批准人</label>
                <p className="mt-1">{planData.approved_by || '未批准'}</p>
              </div>
            </div>
            {planData.remark && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">备注</label>
                <p className="mt-1 text-sm bg-muted p-3 rounded-md">{planData.remark}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 金额统计 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              金额统计
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">总预估金额</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(planData.total_estimated_amount)}
                </p>
              </div>
              <Separator />
              <div className="text-center">
                <p className="text-sm text-muted-foreground">采购项目数</p>
                <p className="text-xl font-semibold">{planData.items?.length || 0} 项</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 采购明细 */}
      <Card>
        <CardHeader>
          <CardTitle>采购明细</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">产品SKU</th>
                  <th className="text-left py-3 px-4">产品名称</th>
                  <th className="text-right py-3 px-4">数量</th>
                  <th className="text-right py-3 px-4">预估单价</th>
                  <th className="text-right py-3 px-4">预估总价</th>
                  <th className="text-left py-3 px-4">备注</th>
                </tr>
              </thead>
              <tbody>
                {planData.items?.map((item: any, index: number) => (
                  <tr key={index} className="border-b">
                    <td className="py-3 px-4">
                      <Badge variant="outline">{item.product_sku}</Badge>
                    </td>
                    <td className="py-3 px-4">{item.product_name}</td>
                    <td className="text-right py-3 px-4">{item.quantity}</td>
                    <td className="text-right py-3 px-4">
                      {formatCurrency(item.estimated_unit_price)}
                    </td>
                    <td className="text-right py-3 px-4 font-medium">
                      {formatCurrency(item.estimated_total_price)}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {item.remark || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
