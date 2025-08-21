'use client';

import { ColumnDef } from '@tanstack/react-table';
import { BatchTableItem } from '@/types/inventory';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { STATUS_COLORS, STATUS_LABELS } from '@/constants/inventory';
import { CellAction } from './cell-action';

export const columns: ColumnDef<BatchTableItem>[] = [
  {
    accessorKey: 'batchNumber',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='批次号' />
    ),
    cell: ({ row }) => {
      const batchNumber = row.getValue('batchNumber') as string;
      return (
        <div className='flex items-center'>
          <Badge variant='outline' className='font-mono'>
            {batchNumber}
          </Badge>
        </div>
      );
    },
    enableSorting: true,
    enableHiding: false
  },
  {
    accessorKey: 'productSku',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='产品SKU' />
    ),
    cell: ({ row }) => {
      const productSku = row.getValue('productSku') as string;
      const productName = row.original.productName;
      return (
        <div className='space-y-1'>
          <Badge variant='outline' className='font-mono text-xs'>
            {productSku}
          </Badge>
          <div className='text-sm text-muted-foreground max-w-[150px] truncate'>
            {productName}
          </div>
        </div>
      );
    },
    enableSorting: true
  },
  {
    accessorKey: 'quantity',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='当前库存' />
    ),
    cell: ({ row }) => {
      const quantity = row.getValue('quantity') as number;
      const originalQuantity = row.original.originalQuantity;
      const isLow = quantity < originalQuantity * 0.2; // 低于原始数量20%显示警告
      
      return (
        <div className='text-center space-y-1'>
          <Badge variant={isLow ? 'destructive' : 'secondary'} className='font-mono'>
            {quantity.toLocaleString()}
          </Badge>
          <div className='text-xs text-muted-foreground'>
            原始: {originalQuantity.toLocaleString()}
          </div>
        </div>
      );
    },
    enableSorting: true
  },
  {
    accessorKey: 'unitCost',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='单位成本' />
    ),
    cell: ({ row }) => {
      const unitCost = row.getValue('unitCost') as number;
      return (
        <div className='text-right font-mono text-sm'>
          ¥{unitCost.toFixed(2)}
        </div>
      );
    },
    enableSorting: true
  },
  {
    accessorKey: 'totalCost',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='批次总成本' />
    ),
    cell: ({ row }) => {
      const totalCost = row.getValue('totalCost') as number;
      const quantity = row.original.quantity;
      const currentValue = quantity * row.original.unitCost;
      
      return (
        <div className='text-right space-y-1'>
          <div className='font-mono text-sm'>
            ¥{totalCost.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
          </div>
          <div className='text-xs text-muted-foreground'>
            当前价值: ¥{currentValue.toFixed(2)}
          </div>
        </div>
      );
    },
    enableSorting: true
  },
  {
    accessorKey: 'sourceType',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='来源类型' />
    ),
    cell: ({ row }) => {
      const sourceType = row.getValue('sourceType') as keyof typeof STATUS_LABELS;
      const supplierCode = row.original.supplierCode;
      
      return (
        <div className='space-y-1'>
          <Badge className={STATUS_COLORS[sourceType]}>
            {STATUS_LABELS[sourceType]}
          </Badge>
          {supplierCode && (
            <div className='text-xs text-muted-foreground'>
              {supplierCode}
            </div>
          )}
        </div>
      );
    },
    enableSorting: true,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    }
  },
  {
    accessorKey: 'location',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='存储位置' />
    ),
    cell: ({ row }) => {
      const location = row.getValue('location') as string;
      return (
        <div className='text-sm text-muted-foreground'>
          {location || '-'}
        </div>
      );
    },
    enableSorting: false
  },
  {
    accessorKey: 'inboundDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='入库日期' />
    ),
    cell: ({ row }) => {
      const inboundDate = row.getValue('inboundDate') as string;
      const date = new Date(inboundDate);
      const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      return (
        <div className='space-y-1'>
          <div className='text-sm'>
            {date.toLocaleDateString('zh-CN')}
          </div>
          <div className='text-xs text-muted-foreground'>
            {daysAgo}天前
          </div>
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
