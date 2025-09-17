'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AdjustmentTableItem {
  id: string;
  product_id: string;
  product_sku: string;
  product_name: string;
  type: 'increase' | 'decrease';
  quantity: number;
  unit_cost: number | null;
  total_cost: number | null;
  reason: string;
  remark: string | null;
  created_by: string;
  created_at: string;
}

interface CellActionProps {
  data: AdjustmentTableItem;
}

export function CellAction({ data }: CellActionProps) {
  const router = useRouter();

  const handleViewDetails = () => {
    // 暂时跳转到库存移动记录页面，因为调整会产生移动记录
    router.push(`/dashboard/inventory/movement?sourceType=adjustment&sourceReference=${data.id}`);
  };

  const handleViewProduct = () => {
    router.push(`/dashboard/product/${data.product_id}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">打开菜单</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>操作</DropdownMenuLabel>
        <DropdownMenuItem onClick={handleViewDetails}>
          <Eye className="mr-2 h-4 w-4" />
          查看详情
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleViewProduct}>
          <FileText className="mr-2 h-4 w-4" />
          查看产品
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
