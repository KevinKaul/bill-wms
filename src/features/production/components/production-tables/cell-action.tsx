'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Copy, 
  Edit, 
  Eye, 
  MoreHorizontal, 
  CheckCircle, 
  Play, 
  Square,
  CreditCard,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ProductionOrderTableItem } from '@/types/production';

interface CellActionProps {
  data: ProductionOrderTableItem;
}

export function CellAction({ data }: CellActionProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('已复制到剪贴板');
  };

  const onView = () => {
    router.push(`/dashboard/production/order/${data.id}`);
  };

  const onEdit = () => {
    router.push(`/dashboard/production/order/${data.id}/edit`);
  };

  const onConfirm = async () => {
    if (data.status !== 'draft') {
      toast.error('只能确认草稿状态的加工单');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/production/orders/${data.id}/start`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || '确认失败');
      }

      toast.success('加工单已确认');
      router.refresh();
    } catch (error) {
      console.error('确认失败:', error);
      toast.error(error instanceof Error ? error.message : '确认失败');
    } finally {
      setLoading(false);
    }
  };

  const onStartProduction = async () => {
    if (data.status !== 'confirmed') {
      toast.error('只能开始已确认的加工单');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/production/orders/${data.id}/start`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || '开始生产失败');
      }

      toast.success('生产已开始');
      router.refresh();
    } catch (error) {
      console.error('开始生产失败:', error);
      toast.error(error instanceof Error ? error.message : '开始生产失败');
    } finally {
      setLoading(false);
    }
  };

  const onComplete = async () => {
    if (data.status !== 'in_progress') {
      toast.error('只能完成生产中的加工单');
      return;
    }

    // 这里应该弹出对话框让用户输入实际产出数量
    const actualQuantity = data.plannedQuantity; // 临时使用计划数量

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/production/orders/${data.id}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actual_quantity: actualQuantity,
          quality_status: 'passed',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || '完成生产失败');
      }

      toast.success('生产已完成');
      router.refresh();
    } catch (error) {
      console.error('完成生产失败:', error);
      toast.error(error instanceof Error ? error.message : '完成生产失败');
    } finally {
      setLoading(false);
    }
  };

  const onMarkPaid = async () => {
    if (data.paymentStatus === 'paid') {
      toast.error('该加工单已付款');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/production/orders/${data.id}/mark-paid`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || '更新付款状态失败');
      }

      toast.success('已标记为已付款');
      router.refresh();
    } catch (error) {
      console.error('更新付款状态失败:', error);
      toast.error(error instanceof Error ? error.message : '更新付款状态失败');
    } finally {
      setLoading(false);
    }
  };

  const onCancel = async () => {
    if (!['draft', 'confirmed'].includes(data.status)) {
      toast.error('只能取消草稿或已确认的加工单');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/production/orders/${data.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || '取消失败');
      }

      toast.success('加工单已取消');
      router.refresh();
    } catch (error) {
      console.error('取消失败:', error);
      toast.error(error instanceof Error ? error.message : '取消失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='h-8 w-8 p-0'>
          <span className='sr-only'>打开菜单</span>
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuLabel>操作</DropdownMenuLabel>
        
        <DropdownMenuItem onClick={() => onCopy(data.orderNumber)}>
          <Copy className='mr-2 h-4 w-4' />
          复制加工单号
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={onView}>
          <Eye className='mr-2 h-4 w-4' />
          查看详情
        </DropdownMenuItem>

        {data.status === 'draft' && (
          <DropdownMenuItem onClick={onEdit}>
            <Edit className='mr-2 h-4 w-4' />
            编辑
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* 状态操作 */}
        {data.status === 'draft' && (
          <DropdownMenuItem onClick={onConfirm} disabled={loading}>
            <CheckCircle className='mr-2 h-4 w-4' />
            确认加工单
          </DropdownMenuItem>
        )}

        {data.status === 'confirmed' && (
          <DropdownMenuItem onClick={onStartProduction} disabled={loading}>
            <Play className='mr-2 h-4 w-4' />
            开始生产
          </DropdownMenuItem>
        )}

        {data.status === 'in_progress' && (
          <DropdownMenuItem onClick={onComplete} disabled={loading}>
            <Square className='mr-2 h-4 w-4' />
            完成生产
          </DropdownMenuItem>
        )}

        {/* 付款操作 */}
        {data.paymentStatus === 'unpaid' && data.processingFee > 0 && (
          <DropdownMenuItem onClick={onMarkPaid} disabled={loading}>
            <CreditCard className='mr-2 h-4 w-4' />
            标记已付款
          </DropdownMenuItem>
        )}

        {/* 取消操作 */}
        {['draft', 'confirmed'].includes(data.status) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={onCancel} 
              disabled={loading}
              className='text-red-600 focus:text-red-600'
            >
              <Trash2 className='mr-2 h-4 w-4' />
              取消加工单
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
