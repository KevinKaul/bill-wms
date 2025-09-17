'use client';

import { useRouter } from 'next/navigation';
import { MoreHorizontal, Copy, Eye, FileText, Undo2 } from 'lucide-react';
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
import { MovementTableItem } from '@/types/inventory';

interface CellActionProps {
  data: MovementTableItem;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();

  const onCopy = () => {
    navigator.clipboard.writeText(data.movementNumber);
    toast.success('已复制移动编号到剪贴板');
  };

  const onViewDetail = () => {
    router.push(`/dashboard/inventory/movement/${data.id}`);
  };

  const onViewBatch = () => {
    router.push(`/dashboard/inventory/batch?batchNumber=${data.batchNumber}`);
  };

  const onViewSource = () => {
    if (data.sourceReference) {
      // 根据来源类型跳转到对应页面
      if (data.sourceType === 'purchase') {
        router.push(`/dashboard/purchase/order/${data.sourceReference}`);
      } else if (data.sourceType === 'production') {
        toast.info('生产模块尚未实现');
      } else {
        toast.info(`来源: ${data.sourceReference}`);
      }
    } else {
      toast.info('无来源信息');
    }
  };

  const onReverseMovement = () => {
    // 这里应该实现反向移动逻辑
    toast.info('反向移动功能开发中');
  };

  const canReverse = data.type !== 'adjustment_in' && data.type !== 'adjustment_out';

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='h-8 w-8 p-0'>
          <span className='sr-only'>打开菜单</span>
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuLabel>操作</DropdownMenuLabel>
        <DropdownMenuItem onClick={onViewDetail}>
          <Eye className='mr-2 h-4 w-4' /> 查看详情
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onCopy}>
          <Copy className='mr-2 h-4 w-4' /> 复制编号
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onViewBatch}>
          <FileText className='mr-2 h-4 w-4' /> 查看批次
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onViewSource}>
          <FileText className='mr-2 h-4 w-4' /> 查看来源
        </DropdownMenuItem>
        {canReverse && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onReverseMovement}>
              <Undo2 className='mr-2 h-4 w-4' /> 反向移动
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
