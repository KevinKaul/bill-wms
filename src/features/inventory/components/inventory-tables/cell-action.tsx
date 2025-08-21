'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Eye, Edit, Copy, Package, History, TrendingUp, TrendingDown } from 'lucide-react';
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
import { InventoryTableItem } from '@/types/inventory';

interface CellActionProps {
  data: InventoryTableItem;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();

  const onCopy = () => {
    navigator.clipboard.writeText(data.productSku);
    toast.success('已复制产品SKU到剪贴板');
  };

  const onViewBatches = () => {
    router.push(`/dashboard/inventory/batch?productId=${data.productId}`);
  };

  const onViewMovements = () => {
    router.push(`/dashboard/inventory/movement?productId=${data.productId}`);
  };

  const onAdjustIncrease = () => {
    router.push(`/dashboard/inventory/adjust?productId=${data.productId}&type=increase`);
  };

  const onAdjustDecrease = () => {
    router.push(`/dashboard/inventory/adjust?productId=${data.productId}&type=decrease`);
  };

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
        <DropdownMenuItem onClick={onCopy}>
          <Copy className='mr-2 h-4 w-4' /> 复制SKU
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onViewBatches}>
          <Package className='mr-2 h-4 w-4' /> 查看批次
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onViewMovements}>
          <History className='mr-2 h-4 w-4' /> 移动记录
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onAdjustIncrease}>
          <TrendingUp className='mr-2 h-4 w-4' /> 增加库存
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAdjustDecrease}>
          <TrendingDown className='mr-2 h-4 w-4' /> 减少库存
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
