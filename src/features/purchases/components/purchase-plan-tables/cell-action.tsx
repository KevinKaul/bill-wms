'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Eye, Edit, Copy, Trash, CheckCircle, XCircle } from 'lucide-react';
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
import { PurchasePlanTableItem } from '@/types/purchase';

interface CellActionProps {
  data: PurchasePlanTableItem;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const onConfirm = async () => {
    try {
      setLoading(true);
      // TODO: 实现删除采购计划逻辑
      toast.success('采购计划已删除');
      setOpen(false);
      // 刷新页面或更新数据
    } catch (error) {
      toast.error('删除失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const onCopy = () => {
    navigator.clipboard.writeText(data.planNumber);
    toast.success('已复制计划编号到剪贴板');
  };

  const onApprove = async () => {
    try {
      setLoading(true);
      // TODO: 实现批准采购计划逻辑
      toast.success('采购计划已批准');
    } catch (error) {
      toast.error('批准失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const onExecute = async () => {
    try {
      setLoading(true);
      // TODO: 实现执行采购计划逻辑（生成采购单）
      toast.success('采购计划已执行，已生成采购单');
    } catch (error) {
      toast.error('执行失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const canApprove = data.status === 'draft';
  const canExecute = data.status === 'approved';
  const canEdit = data.status === 'draft';
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
            <Copy className='mr-2 h-4 w-4' /> 复制编号
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => router.push(`/dashboard/purchase/plan/${data.id}`)}
          >
            <Eye className='mr-2 h-4 w-4' /> 查看详情
          </DropdownMenuItem>
          {canEdit && (
            <DropdownMenuItem
              onClick={() => router.push(`/dashboard/purchase/plan/${data.id}/edit`)}
            >
              <Edit className='mr-2 h-4 w-4' /> 编辑
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {canApprove && (
            <DropdownMenuItem onClick={onApprove} disabled={loading}>
              <CheckCircle className='mr-2 h-4 w-4' /> 批准计划
            </DropdownMenuItem>
          )}
          {canExecute && (
            <DropdownMenuItem onClick={onExecute} disabled={loading}>
              <CheckCircle className='mr-2 h-4 w-4' /> 执行计划
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
