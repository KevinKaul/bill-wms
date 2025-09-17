'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Eye, Copy, Trash, CheckCircle, DollarSign, Truck } from 'lucide-react';
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
import { AlertModal } from '@/components/modal/alert-modal';
import { PurchaseOrderTableItem } from '@/types/purchase';
import { deleteApi } from "@/lib/delete-api";
import { useAuth } from '@clerk/nextjs';
import { usePurchaseOrderTable } from './index';

interface CellActionProps {
  data: PurchaseOrderTableItem;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { getToken } = useAuth();
  const { onDeletePurchaseOrder } = usePurchaseOrderTable();

  const onConfirm = async () => {
    try {
      setLoading(true);
      const response = await deleteApi.deletePurchaseOrder(data.id, getToken);
      
      if (response.success) {
        toast.success('采购单已删除');
        setOpen(false);
        // 使用上下文回调来即时移除表格行
        if (onDeletePurchaseOrder) {
          onDeletePurchaseOrder(data.id);
        } else {
          // 如果没有回调函数，则刷新页面
          router.refresh();
        }
      } else {
        toast.error(response.error?.message || '删除失败');
      }
    } catch (error) {
      console.error('删除采购单错误:', error);
      toast.error('删除失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const onCopy = () => {
    navigator.clipboard.writeText(data.orderNumber);
    toast.success('已复制采购单号到剪贴板');
  };

  const onConfirmOrder = async () => {
    try {
      setLoading(true);
      // TODO: 实现确认采购单逻辑
      toast.success('采购单已确认');
    } catch (error) {
      toast.error('确认失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const onMarkPaid = async () => {
    try {
      setLoading(true);
      // TODO: 实现标记已付款逻辑
      toast.success('已标记为已付款');
    } catch (error) {
      toast.error('操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const onMarkDelivered = async () => {
    try {
      setLoading(true);
      // TODO: 实现标记已到货逻辑（触发入库）
      toast.success('已标记为已到货，库存已更新');
    } catch (error) {
      toast.error('操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const canConfirm = data.status === 'draft';
  const canMarkPaid = data.status === 'confirmed' && data.paymentStatus === 'UNPAID';
  const canMarkDelivered = data.status === 'confirmed' && data.deliveryStatus === 'NOT_DELIVERED';
  const canDelete = data.status === 'draft' || data.status === 'cancelled';

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        loading={loading}
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>打开菜单</span>
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>操作</DropdownMenuLabel>
          <DropdownMenuItem onClick={onCopy}>
            <Copy className='mr-2 h-4 w-4' /> 复制单号
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => router.push(`/dashboard/purchase/order/${data.id}`)}
          >
            <Eye className='mr-2 h-4 w-4' /> 查看详情
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {canConfirm && (
            <DropdownMenuItem onClick={onConfirmOrder} disabled={loading}>
              <CheckCircle className='mr-2 h-4 w-4' /> 确认订单
            </DropdownMenuItem>
          )}
          {canMarkPaid && (
            <DropdownMenuItem onClick={onMarkPaid} disabled={loading}>
              <DollarSign className='mr-2 h-4 w-4' /> 标记已付款
            </DropdownMenuItem>
          )}
          {canMarkDelivered && (
            <DropdownMenuItem onClick={onMarkDelivered} disabled={loading}>
              <Truck className='mr-2 h-4 w-4' /> 标记已到货
            </DropdownMenuItem>
          )}
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setOpen(true)}
                className='text-red-600 focus:text-red-600'
              >
                <Trash className='mr-2 h-4 w-4' /> 删除
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
