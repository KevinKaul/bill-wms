'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Factory, Calendar, DollarSign, Package, User, Clock } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';

interface ProductionOrderDetailProps {
  orderId: string;
}

export function ProductionOrderDetail({ orderId }: ProductionOrderDetailProps) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const loadOrderDetail = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/v1/production/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('获取加工单详情失败');
        }

        const data = await response.json();
        console.log('加工单详情API响应:', data);
        setOrder(data.data);
      } catch (error) {
        console.error('Load order detail error:', error);
        toast.error('加载加工单详情失败');
        router.push('/dashboard/production/order');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      loadOrderDetail();
    }
  }, [orderId, getToken, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">加工单不存在</p>
        </div>
      </div>
    );
  }

  // 状态颜色映射
  const getStatusColor = (status: string) => {
    const colors = {
      'pending': 'bg-gray-100 text-gray-800',
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors = {
      'unpaid': 'bg-yellow-100 text-yellow-800',
      'paid': 'bg-green-100 text-green-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getQualityStatusColor = (status: string) => {
    const colors = {
      'passed': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800',
      'pending': 'bg-yellow-100 text-yellow-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // 状态标签映射
  const getStatusLabel = (status: string) => {
    const labels = {
      'pending': '待处理',
      'in_progress': '进行中',
      'completed': '已完成'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getPaymentStatusLabel = (status: string) => {
    const labels = {
      'unpaid': '未付款',
      'paid': '已付款'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getQualityStatusLabel = (status: string) => {
    const labels = {
      'passed': '质检通过',
      'failed': '质检不合格',
      'pending': '待质检'
    };
    return labels[status as keyof typeof labels] || status;
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Factory className="h-6 w-6" />
          <div>
            <h3 className="text-lg font-medium">加工单详情</h3>
            <p className="text-sm text-muted-foreground">查看加工单的详细信息</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            返回
          </Button>
        </div>
      </div>

      <Separator />

      {/* 基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>基本信息</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">加工单号</label>
                <p className="text-sm font-mono">{order.order_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">产品信息</label>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {order.product_sku}
                  </Badge>
                  <span className="text-sm">{order.product_name}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">加工供应商</label>
                <div className="flex items-center space-x-2 mt-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{order.supplier_name || '未指定'}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">订单状态</label>
                <div className="mt-1">
                  <Badge className={getStatusColor(order.status)}>
                    {getStatusLabel(order.status)}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">计划数量</label>
                <p className="text-sm font-mono">{order.planned_quantity}</p>
              </div>
              {order.actual_quantity && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">实际产出</label>
                  <p className="text-sm font-mono">{order.actual_quantity}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">付款状态</label>
                <div className="mt-1">
                  <Badge className={getPaymentStatusColor(order.payment_status)}>
                    {getPaymentStatusLabel(order.payment_status)}
                  </Badge>
                </div>
              </div>
              {order.quality_status && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">质检状态</label>
                  <div className="mt-1">
                    <Badge className={getQualityStatusColor(order.quality_status)}>
                      {getQualityStatusLabel(order.quality_status)}
                    </Badge>
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">创建时间</label>
                <div className="flex items-center space-x-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{order.order_date ? new Date(order.order_date).toLocaleString('zh-CN') : 'Invalid Date'}</span>
                </div>
              </div>
              {order.start_date && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">开始时间</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{new Date(order.start_date).toLocaleString('zh-CN')}</span>
                  </div>
                </div>
              )}
              {order.completion_date && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">完成时间</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{new Date(order.completion_date).toLocaleString('zh-CN')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          {order.remark && (
            <div className="mt-4">
              <label className="text-sm font-medium text-muted-foreground">备注</label>
              <p className="text-sm mt-1 p-3 bg-muted rounded-md">{order.remark}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 成本汇总 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>成本汇总</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">物料成本:</span>
              <span className="font-mono">¥{order.material_cost?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">加工费用:</span>
              <span className="font-mono">¥{order.processing_fee?.toFixed(2) || '0.00'}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center text-lg font-medium">
              <span>总成本:</span>
              <span className="font-mono text-primary">¥{order.total_cost?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 物料使用明细 */}
      {order.material_usages && order.material_usages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>物料使用明细</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.material_usages.map((usage: any, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="text-xs">
                        {usage.product_sku}
                      </Badge>
                      <span className="font-medium">{usage.product_name}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">使用数量:</span>
                      <span className="ml-2 font-mono">{usage.used_quantity}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">单位成本:</span>
                      <span className="ml-2 font-mono">¥{usage.unit_cost?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">总成本:</span>
                      <span className="ml-2 font-mono font-medium">¥{usage.total_cost?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 成品批次信息 */}
      {order.finished_batches && order.finished_batches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>成品批次信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.finished_batches.map((batch: any, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">批次号:</span>
                      <span className="ml-2 font-mono">{batch.batch_number}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">数量:</span>
                      <span className="ml-2 font-mono">{batch.inbound_quantity}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">入库日期:</span>
                      <span className="ml-2">{batch.inbound_date ? new Date(batch.inbound_date).toLocaleDateString('zh-CN') : '-'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">单位成本:</span>
                      <span className="ml-2 font-mono">¥{batch.actual_unit_cost?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
