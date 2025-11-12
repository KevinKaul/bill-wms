'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ShoppingCart, Calendar, DollarSign, Package, User } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { formatAmount } from '@/lib/utils';

interface PurchaseOrderDetailProps {
  orderId: string;
}

export function PurchaseOrderDetail({ orderId }: PurchaseOrderDetailProps) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const loadOrderDetail = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/v1/purchase/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('获取采购单详情失败');
        }

        const data = await response.json();
        // 合并订单信息和明细项
        const orderData = {
          ...data.data.order,
          items: data.data.items
        };
        setOrder(orderData);
      } catch (error) {
        console.error('Load order detail error:', error);
        toast.error('加载采购单详情失败');
        router.push('/dashboard/purchase/order');
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
          <p className="text-muted-foreground">采购单不存在</p>
        </div>
      </div>
    );
  }

  // 状态颜色映射
  const getStatusColor = (status: string) => {
    const colors = {
      'draft': 'bg-gray-100 text-gray-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors = {
      'unpaid': 'bg-yellow-100 text-yellow-800',
      'partial': 'bg-orange-100 text-orange-800',
      'paid': 'bg-green-100 text-green-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getDeliveryStatusColor = (status: string) => {
    const colors = {
      'not_delivered': 'bg-gray-100 text-gray-800',
      'partial_delivered': 'bg-orange-100 text-orange-800',
      'delivered': 'bg-green-100 text-green-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // 状态标签映射
  const getStatusLabel = (status: string) => {
    const labels = {
      'draft': '草稿',
      'confirmed': '已确认',
      'delivered': '已交付',
      'cancelled': '已取消'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getPaymentStatusLabel = (status: string) => {
    const labels = {
      'unpaid': '未付款',
      'partial': '部分付款',
      'paid': '已付款'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getDeliveryStatusLabel = (status: string) => {
    const labels = {
      'not_delivered': '待发货',
      'partial_delivered': '部分到货',
      'delivered': '已到货'
    };
    return labels[status as keyof typeof labels] || status;
  };

  // 计算金额
  const subtotal = order.subtotal || 0;
  const totalAmount = order.total_amount || 0;

  return (
    <div className="flex flex-col space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShoppingCart className="h-6 w-6" />
          <div>
            <h3 className="text-lg font-medium">采购单详情</h3>
            <p className="text-sm text-muted-foreground">查看采购单的详细信息</p>
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
                <label className="text-sm font-medium text-muted-foreground">采购单号</label>
                <p className="text-sm font-mono">{order.order_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">供应商</label>
                <div className="flex items-center space-x-2 mt-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{order.supplier_name || '未知供应商'}</span>
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
                <label className="text-sm font-medium text-muted-foreground">付款状态</label>
                <div className="mt-1">
                  <Badge className={getPaymentStatusColor(order.payment_status)}>
                    {getPaymentStatusLabel(order.payment_status)}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">到货状态</label>
                <div className="mt-1">
                  <Badge className={getDeliveryStatusColor(order.delivery_status)}>
                    {getDeliveryStatusLabel(order.delivery_status)}
                  </Badge>
                </div>
              </div>
              {order.expected_delivery_date && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">预计到货日期</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{new Date(order.expected_delivery_date).toLocaleDateString('zh-CN')}</span>
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

      {/* 金额汇总 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>金额汇总</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">商品小计:</span>
              <span className="font-mono">¥{formatAmount(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">附加费用:</span>
              <span className="font-mono">¥{formatAmount(order.additional_cost || 0)}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center text-lg font-medium">
              <span>总金额:</span>
              <span className="font-mono text-primary">¥{formatAmount(totalAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 采购明细 */}
      <Card>
        <CardHeader>
          <CardTitle>采购明细</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items?.map((item: any, index: number) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="text-xs">
                      {item.product_sku}
                    </Badge>
                    <span className="font-medium">{item.product_name}</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">数量:</span>
                    <span className="ml-2 font-mono">{item.quantity}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">单价:</span>
                    <span className="ml-2 font-mono">¥{formatAmount(item.unit_price)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">小计:</span>
                    <span className="ml-2 font-mono font-medium">¥{formatAmount(item.total_price)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">已收货:</span>
                    <span className="ml-2 font-mono">{item.received_quantity}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
