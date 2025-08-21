'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getBatchDetail, type RawMaterialBatch } from '@/lib/purchase-inbound';
import { Package, MapPin, Calendar, DollarSign, Truck, ArrowLeft } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format-utils';
import { useRouter } from 'next/navigation';

interface BatchDetailProps {
  batchId: string;
}

export function BatchDetail({ batchId }: BatchDetailProps) {
  const [batch, setBatch] = useState<RawMaterialBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchBatchDetail = async () => {
      try {
        setLoading(true);
        const batchData = getBatchDetail(batchId);
        setBatch(batchData);
      } catch (error) {
        // 获取批次详情失败
      } finally {
        setLoading(false);
      }
    };

    fetchBatchDetail();
  }, [batchId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">加载批次详情中...</p>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">批次不存在或已被删除</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-2xl font-bold">批次详情</h1>
            <p className="text-muted-foreground">
              批次号: {batch.batchNumber}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-sm">
          {batch.sourceType === 'purchase' ? '采购入库' : '其他'}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              基本信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">批次号</label>
                <p className="font-medium">{batch.batchNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">原材料SKU</label>
                <p className="font-medium">{batch.materialSku}</p>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">原材料名称</label>
              <p className="font-medium">{batch.materialName}</p>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">库存数量</label>
                <p className="text-lg font-bold">{batch.quantity.toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">存储位置</label>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline">{batch.location || '未分配'}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 成本信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              成本信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">原始采购单价</label>
                <p className="font-medium">{formatCurrency(batch.originalUnitPrice)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">分摊附加费用</label>
                <p className="font-medium">{formatCurrency(batch.allocatedAdditionalCost)}</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">实际入库单价</label>
                <p className="text-lg font-bold text-green-600">{formatCurrency(batch.unitCost)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">批次总成本</label>
                <p className="text-lg font-bold text-blue-600">{formatCurrency(batch.totalCost)}</p>
              </div>
            </div>

            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                成本计算: 原始单价 + 分摊费用 = 实际单价
              </p>
              <p className="text-sm">
                {formatCurrency(batch.originalUnitPrice)} + {formatCurrency(batch.allocatedAdditionalCost / batch.quantity)} = {formatCurrency(batch.unitCost)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 供应商信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              供应商信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">供应商名称</label>
              <p className="font-medium">{batch.supplierName}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">来源单号</label>
              <Badge variant="secondary">{batch.sourceReference}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* 时间信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              时间信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">入库时间</label>
              <p className="font-medium">{formatDate(batch.inboundDate)}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">库存天数</label>
              <p className="font-medium">
                {Math.floor((new Date().getTime() - new Date(batch.inboundDate).getTime()) / (1000 * 60 * 60 * 24))} 天
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 操作记录 */}
      <Card>
        <CardHeader>
          <CardTitle>操作记录</CardTitle>
          <CardDescription>
            该批次的出入库和调整记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2" />
            <p>暂无操作记录</p>
            <p className="text-sm">批次操作记录功能开发中...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
