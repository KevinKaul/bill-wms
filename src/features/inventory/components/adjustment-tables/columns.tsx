'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { CellAction } from './cell-action';

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

const adjustmentTypeLabels = {
  increase: '入库',
  decrease: '出库'
};

const adjustmentTypeColors = {
  increase: 'bg-green-100 text-green-800 border-green-200',
  decrease: 'bg-red-100 text-red-800 border-red-200'
};

export const adjustmentColumns: ColumnDef<AdjustmentTableItem>[] = [
  {
    accessorKey: 'product_sku',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="产品SKU" />
    ),
    cell: ({ row }) => (
      <div className="font-mono text-sm">
        {row.getValue('product_sku')}
      </div>
    ),
  },
  {
    accessorKey: 'product_name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="产品名称" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[200px] truncate">
        {row.getValue('product_name')}
      </div>
    ),
  },
  {
    accessorKey: 'type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="调整类型" />
    ),
    cell: ({ row }) => {
      const type = row.getValue('type') as 'increase' | 'decrease';
      return (
        <Badge 
          variant="outline" 
          className={adjustmentTypeColors[type]}
        >
          {adjustmentTypeLabels[type]}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'quantity',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="调整数量" />
    ),
    cell: ({ row }) => {
      const quantity = row.getValue('quantity') as number;
      const type = row.getValue('type') as 'increase' | 'decrease';
      const sign = type === 'increase' ? '+' : '-';
      const color = type === 'increase' ? 'text-green-600' : 'text-red-600';
      
      return (
        <div className={`font-semibold ${color}`}>
          {sign}{quantity?.toLocaleString() || 0}
        </div>
      );
    },
  },
  {
    accessorKey: 'unit_cost',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="单位成本" />
    ),
    cell: ({ row }) => {
      const unitCost = row.getValue('unit_cost') as number | null;
      return (
        <div>
          {unitCost != null ? `¥${unitCost.toFixed(2)}` : '-'}
        </div>
      );
    },
  },
  {
    accessorKey: 'total_cost',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="总成本" />
    ),
    cell: ({ row }) => {
      const totalCost = row.getValue('total_cost') as number | null;
      return (
        <div className="font-semibold">
          {totalCost != null ? `¥${totalCost.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}` : '-'}
        </div>
      );
    },
  },
  {
    accessorKey: 'reason',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="调整原因" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[150px] truncate">
        {row.getValue('reason')}
      </div>
    ),
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="调整时间" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('created_at'));
      return (
        <div className="text-sm">
          {format(date, 'yyyy-MM-dd HH:mm', { locale: zhCN })}
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: '操作',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
