'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MovementTableItem } from '@/types/inventory';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { STATUS_COLORS, STATUS_LABELS, MOVEMENT_TYPE_LABELS, MOVEMENT_TYPE_COLORS } from '@/constants/inventory';
import { CellAction } from './cell-action';

export const columns: ColumnDef<MovementTableItem>[] = [
  {
    accessorKey: 'movementNumber',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='移动编号' />
    ),
    cell: ({ row }) => {
      const movementNumber = row.getValue('movementNumber') as string;
      return (
        <div className='flex items-center'>
          <Badge variant='outline' className='font-mono'>
            {movementNumber}
          </Badge>
        </div>
      );
    },
    enableSorting: true,
    enableHiding: false
  },
  {
    accessorKey: 'type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='移动类型' />
    ),
    cell: ({ row }) => {
      const type = row.getValue('type') as keyof typeof MOVEMENT_TYPE_LABELS;
      return (
        <Badge className={MOVEMENT_TYPE_COLORS[type]}>
          {MOVEMENT_TYPE_LABELS[type]}
        </Badge>
      );
    },
    enableSorting: true,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    }
  },
  {
    accessorKey: 'batchNumber',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='批次信息' />
    ),
    cell: ({ row }) => {
      const batchNumber = row.getValue('batchNumber') as string;
      const productSku = row.original.productSku;
      const productName = row.original.productName;
      
      return (
        <div className='space-y-1'>
          <Badge variant='outline' className='font-mono text-xs'>
            {batchNumber}
          </Badge>
          <div className='text-xs text-muted-foreground'>
            {productSku} - {productName}
          </div>
        </div>
      );
    },
    enableSorting: true
  },
  {
    accessorKey: 'quantity',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='移动数量' />
    ),
    cell: ({ row }) => {
      const quantity = row.getValue('quantity') as number;
      const type = row.original.type;
      const isOutbound = ['outbound', 'transfer_out', 'adjustment_out'].includes(type);
      
      return (
        <div className='text-center'>
          <Badge variant={isOutbound ? 'destructive' : 'default'} className='font-mono'>
            {isOutbound ? '-' : '+'}{quantity.toLocaleString()}
          </Badge>
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
      <DataTableColumnHeader column={column} title='总成本' />
    ),
    cell: ({ row }) => {
      const totalCost = row.getValue('totalCost') as number;
      const type = row.original.type;
      const isOutbound = ['outbound', 'transfer_out', 'adjustment_out'].includes(type);
      
      return (
        <div className='text-right'>
          <Badge variant={isOutbound ? 'destructive' : 'default'} className='font-mono'>
            {isOutbound ? '-' : '+'}¥{totalCost.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
          </Badge>
        </div>
      );
    },
    enableSorting: true
  },
  {
    accessorKey: 'sourceType',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='来源' />
    ),
    cell: ({ row }) => {
      const sourceType = row.getValue('sourceType') as keyof typeof STATUS_LABELS;
      const sourceReference = row.original.sourceReference;
      
      return (
        <div className='space-y-1'>
          <Badge className={STATUS_COLORS[sourceType]} variant='outline'>
            {STATUS_LABELS[sourceType]}
          </Badge>
          {sourceReference && (
            <div className='text-xs text-muted-foreground font-mono'>
              {sourceReference}
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
      <DataTableColumnHeader column={column} title='位置变化' />
    ),
    cell: ({ row }) => {
      const fromLocation = row.original.fromLocation;
      const toLocation = row.original.toLocation;
      
      if (!fromLocation && !toLocation) {
        return <div className='text-sm text-muted-foreground'>-</div>;
      }
      
      return (
        <div className='text-xs space-y-1'>
          {fromLocation && (
            <div className='text-muted-foreground'>
              从: {fromLocation}
            </div>
          )}
          {toLocation && (
            <div className='text-foreground'>
              到: {toLocation}
            </div>
          )}
        </div>
      );
    },
    enableSorting: false
  },
  {
    accessorKey: 'movementDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='移动时间' />
    ),
    cell: ({ row }) => {
      const movementDate = row.getValue('movementDate') as string;
      const date = new Date(movementDate);
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      let timeAgo = '';
      if (diffHours < 1) {
        timeAgo = '刚刚';
      } else if (diffHours < 24) {
        timeAgo = `${diffHours}小时前`;
      } else {
        const diffDays = Math.floor(diffHours / 24);
        timeAgo = `${diffDays}天前`;
      }
      
      return (
        <div className='space-y-1'>
          <div className='text-sm'>
            {date.toLocaleDateString('zh-CN')}
          </div>
          <div className='text-xs text-muted-foreground'>
            {date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className='text-xs text-muted-foreground'>
            {timeAgo}
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
