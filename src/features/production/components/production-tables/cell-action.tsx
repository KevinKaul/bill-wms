'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Copy, 
  Edit, 
  Eye, 
  MoreHorizontal, 
  CheckCircle, 
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
import { deleteApi } from "@/lib/delete-api";
import { useAuth } from '@clerk/nextjs';
import { useProductionTable } from './index';

interface CellActionProps {
  data: ProductionOrderTableItem;
}

export function CellAction({ data }: CellActionProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();
  const { onRefresh } = useProductionTable();

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
    if (data.status !== 'pending') {
      toast.error('只能确认待处理状态的加工单');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/v1/production/orders/${data.id}/start`, {
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
      onRefresh?.();
    } catch (error) {
      console.error('确认失败:', error);
      toast.error(error instanceof Error ? error.message : '确认失败');
    } finally {
      setLoading(false);
    }
  };

  const onStartProduction = async () => {
    if (data.status !== 'in_progress') {
      toast.error('只能完成进行中的加工单');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/v1/production/orders/${data.id}/start`, {
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
      onRefresh?.();
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/v1/production/orders/${data.id}/complete`, {
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
      onRefresh?.();
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/v1/production/orders/${data.id}/mark-paid`, {
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
      // 刷新表格数据
      onRefresh?.();
    } catch (error) {
      console.error('更新付款状态失败:', error);
      toast.error(error instanceof Error ? error.message : '更新付款状态失败');
    } finally {
      setLoading(false);
    }
  };

  const onCancel = async () => {
    if (!['pending', 'in_progress'].includes(data.status)) {
      toast.error('只能取消待处理或进行中的加工单');
      return;
    }

    setLoading(true);
    try {
      const response = await deleteApi.deleteProductionOrder(data.id, getToken);
      
      if (response.success) {
        toast.success('加工单已删除');
        // 刷新表格来移除已删除的行
        onRefresh?.();
      } else {
        toast.error(response.error?.message || '删除失败');
      }
    } catch (error) {
      console.error('删除加工单错误:', error);
      toast.error('删除失败，请重试');
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

        {data.status === 'pending' && (
          <DropdownMenuItem onClick={onEdit}>
            <Edit className='mr-2 h-4 w-4' />
            编辑
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* 状态操作 */}
        {data.status === 'pending' && (
          <DropdownMenuItem onClick={onConfirm} disabled={loading}>
            <CheckCircle className='mr-2 h-4 w-4' />
            开始加工
          </DropdownMenuItem>
        )}

        {data.status === 'in_progress' && (
          <DropdownMenuItem onClick={onStartProduction} disabled={loading}>
            <Square className='mr-2 h-4 w-4' />
            完成加工
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
        {['pending', 'in_progress'].includes(data.status) && (
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
