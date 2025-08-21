'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Eye, Copy, History, MapPin, TrendingDown } from 'lucide-react';
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
import { BatchTableItem } from '@/types/inventory';

interface CellActionProps {
  data: BatchTableItem;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();

  const onCopy = () => {
    navigator.clipboard.writeText(data.batchNumber);
    toast.success('已复制批次号到剪贴板');
  };

  const onViewMovements = () => {
    router.push(`/dashboard/inventory/movement?batchId=${data.id}`);
  };

  const onViewLocation = () => {
    if (data.location) {
      toast.info(`存储位置: ${data.location}`);
    } else {
      toast.info('未设置存储位置');
    }
  };

  const onAdjustBatch = () => {
    router.push(`/dashboard/inventory/adjust?batchId=${data.id}`);
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
          <Copy className='mr-2 h-4 w-4' /> 复制批次号
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onViewMovements}>
          <History className='mr-2 h-4 w-4' /> 移动记录
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onViewLocation}>
          <MapPin className='mr-2 h-4 w-4' /> 查看位置
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onAdjustBatch}>
          <TrendingDown className='mr-2 h-4 w-4' /> 批次调整
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
