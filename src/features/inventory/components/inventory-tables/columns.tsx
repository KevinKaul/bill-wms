'use client';

import { ColumnDef } from '@tanstack/react-table';
import { InventoryTableItem } from '@/types/inventory';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { STATUS_COLORS, STATUS_LABELS } from '@/constants/inventory';
import { CellAction } from './cell-action';

export const columns: ColumnDef<InventoryTableItem>[] = [
  {
    accessorKey: 'productSku',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='产品SKU' />
    ),
    cell: ({ row }) => {
      const productSku = row.getValue('productSku') as string;
      const productType = row.original.productType;
      return (
        <div className='flex items-center space-x-2'>
          <Badge variant='outline' className='font-mono'>
            {productSku}
          </Badge>
          <Badge className={STATUS_COLORS[productType]}>
            {STATUS_LABELS[productType]}
          </Badge>
        </div>
      );
    },
    enableSorting: true,
    enableHiding: false
  },
  {
    accessorKey: 'productName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='产品名称' />
    ),
    cell: ({ row }) => {
      const productName = row.getValue('productName') as string;
      return (
        <div className='max-w-[200px] truncate font-medium'>
          {productName}
        </div>
      );
    },
    enableSorting: true
  },
  {
    accessorKey: 'totalQuantity',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='库存数量' />
    ),
    cell: ({ row }) => {
      const totalQuantity = row.getValue('totalQuantity') as number;
      const lowStockAlert = row.original.lowStockAlert;
      return (
        <div className='text-center'>
          <Badge 
            variant={lowStockAlert ? 'destructive' : 'secondary'}
            className='font-mono'
          >
            {totalQuantity.toLocaleString()}
          </Badge>
          {lowStockAlert && (
            <div className='text-xs text-red-600 mt-1'>低库存</div>
          )}
        </div>
      );
    },
    enableSorting: true
  },
  {
    accessorKey: 'totalValue',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='库存价值' />
    ),
    cell: ({ row }) => {
      const totalValue = row.getValue('totalValue') as number;
      return (
        <div className='text-right font-mono'>
          ¥{totalValue.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
        </div>
      );
    },
    enableSorting: true
  },
  {
    accessorKey: 'avgUnitCost',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='平均成本' />
    ),
    cell: ({ row }) => {
      const avgUnitCost = row.getValue('avgUnitCost') as number;
      return (
        <div className='text-right font-mono text-sm'>
          ¥{avgUnitCost.toFixed(2)}
        </div>
      );
    },
    enableSorting: true
  },
  {
    accessorKey: 'batchCount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='批次数' />
    ),
    cell: ({ row }) => {
      const batchCount = row.getValue('batchCount') as number;
      return (
        <div className='text-center'>
          <Badge variant='outline'>
            {batchCount}
          </Badge>
        </div>
      );
    },
    enableSorting: true
  },
  {
    accessorKey: 'oldestBatchDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='最早批次' />
    ),
    cell: ({ row }) => {
      const oldestBatchDate = row.getValue('oldestBatchDate') as string;
      return (
        <div className='text-sm text-muted-foreground'>
          {new Date(oldestBatchDate).toLocaleDateString('zh-CN')}
        </div>
      );
    },
    enableSorting: true
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
