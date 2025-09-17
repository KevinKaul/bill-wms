"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createClientApi } from '@/lib/client-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, TrendingUp, TrendingDown, RotateCcw, Truck } from 'lucide-react';

interface MovementData {
  id: string;
  movement_number: string;
  product_sku: string;
  product_name: string;
  movement_type: 'inbound' | 'outbound';
  source_type: 'purchase' | 'production' | 'adjustment' | 'transfer';
  source_reference: string | null;
  batch_number: string | null;
  quantity: number;
  unit_cost: number | null;
  total_cost: number | null;
  location_from: string | null;
  location_to: string | null;
  remark: string | null;
  created_at: string;
}

interface MovementDetailProps {
  movementId: string;
}

const movementTypeLabels = {
  inbound: '入库',
  outbound: '出库'
};

const movementTypeColors = {
  inbound: 'bg-green-100 text-green-800 border-green-200',
  outbound: 'bg-red-100 text-red-800 border-red-200'
};

const sourceTypeLabels = {
  purchase: '采购入库',
  production: '生产入库',
  adjustment: '库存调整',
  transfer: '库存调拨'
};

const sourceTypeIcons = {
  purchase: Truck,
  production: Package,
  adjustment: RotateCcw,
  transfer: TrendingUp
};

export function MovementDetail({ movementId }: MovementDetailProps) {
  const { getToken, isSignedIn } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [movement, setMovement] = useState<MovementData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMovementDetail() {
      if (!isSignedIn || !movementId) return;

      try {
        setLoading(true);
        setError(null);

        // 由于我们没有单独的移动详情API，这里使用列表API并过滤
        const clientApi = createClientApi(getToken);
        const response = await clientApi.inventory.getMovements({
          page: 1,
          per_page: 1,
          // 如果有movement_number搜索，可以使用
        });

        if (response.success && response.data) {
          // 在实际应用中，应该有专门的详情API
          // 这里暂时使用模拟数据
          setMovement({
            id: movementId,
            movement_number: `MOV${new Date().getFullYear()}${String(Date.now()).slice(-6)}`,
            product_sku: 'RAW001',
            product_name: '原材料A',
            movement_type: 'inbound',
            source_type: 'adjustment',
            source_reference: 'ADJ202412180001',
            batch_number: 'BATCH202412180001',
            quantity: 100,
            unit_cost: 15.75,
            total_cost: 1575.00,
            location_from: null,
            location_to: '默认仓库',
            remark: '手动调整库存',
            created_at: new Date().toISOString()
          });
        } else {
          setError('获取移动记录详情失败');
        }
      } catch (err) {
        console.error('获取移动记录详情失败:', err);
        setError('获取移动记录详情失败');
      } finally {
        setLoading(false);
      }
    }

    fetchMovementDetail();
  }, [isSignedIn, getToken, movementId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="text-lg">加载中...</div>
          <div className="text-sm text-muted-foreground mt-2">正在获取移动记录详情</div>
        </div>
      </div>
    );
  }

  if (error || !movement) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="text-lg text-destructive">加载失败</div>
          <div className="text-sm text-muted-foreground mt-2">{error || '移动记录不存在'}</div>
          <Button 
            variant="outline" 
            onClick={() => router.back()} 
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
        </div>
      </div>
    );
  }

  const SourceIcon = sourceTypeIcons[movement.source_type];

  return (
    <div className="space-y-6">
      {/* 返回按钮 */}
      <Button 
        variant="outline" 
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        返回列表
      </Button>

      {/* 基本信息 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <SourceIcon className="h-5 w-5" />
                库存移动记录
              </CardTitle>
              <CardDescription>
                移动编号: {movement.movement_number}
              </CardDescription>
            </div>
            <Badge 
              variant="outline" 
              className={movementTypeColors[movement.movement_type]}
            >
              {movementTypeLabels[movement.movement_type]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-muted-foreground">产品信息</div>
              <div className="font-semibold">{movement.product_name}</div>
              <div className="text-sm font-mono text-muted-foreground">{movement.product_sku}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">移动类型</div>
              <div className="font-semibold">{sourceTypeLabels[movement.source_type]}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">移动时间</div>
              <div className="font-semibold">
                {format(new Date(movement.created_at), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 数量和成本信息 */}
      <Card>
        <CardHeader>
          <CardTitle>数量和成本</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-muted-foreground">移动数量</div>
              <div className="text-2xl font-bold flex items-center gap-2">
                {movement.movement_type === 'inbound' ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                )}
                {movement.quantity.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">单位成本</div>
              <div className="text-2xl font-bold">
                {movement.unit_cost != null ? `¥${movement.unit_cost.toFixed(2)}` : '-'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">总成本</div>
              <div className="text-2xl font-bold">
                {movement.total_cost != null ? `¥${movement.total_cost.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}` : '-'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 位置和批次信息 */}
      <Card>
        <CardHeader>
          <CardTitle>位置和批次信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-muted-foreground">源位置</div>
              <div className="font-semibold">
                {movement.location_from || '外部'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">目标位置</div>
              <div className="font-semibold">
                {movement.location_to || '外部'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">批次号</div>
              <div className="font-semibold font-mono">
                {movement.batch_number || '-'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">源单据</div>
              <div className="font-semibold font-mono">
                {movement.source_reference || '-'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 备注信息 */}
      {movement.remark && (
        <Card>
          <CardHeader>
            <CardTitle>备注信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">{movement.remark}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
