'use client';

import { ColumnDef } from '@tanstack/react-table';
import { PurchasePlanTableItem } from '@/types/purchase';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { STATUS_COLORS, STATUS_LABELS } from '@/constants/purchase';
import { CellAction } from './cell-action';

export const columns: ColumnDef<PurchasePlanTableItem>[] = [
  {
    accessorKey: 'planNumber',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='计划编号' />
    ),
    cell: ({ row }) => {
      const planNumber = row.getValue('planNumber') as string;
      return (
        <div className='flex items-center'>
          <Badge variant='outline' className='font-mono'>
            {planNumber}
          </Badge>
        </div>
      );
    },
    enableSorting: true,
    enableHiding: false
  },
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='计划标题' />
    ),
    cell: ({ row }) => {
      const title = row.getValue('title') as string;
      return (
        <div className='max-w-[300px] truncate font-medium'>
          {title}
        </div>
      );
    },
    enableSorting: true
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='状态' />
    ),
    cell: ({ row }) => {
      const status = row.getValue('status') as keyof typeof STATUS_LABELS;
      return (
        <Badge className={STATUS_COLORS[status]}>
          {STATUS_LABELS[status]}
        </Badge>
      );
    },
    enableSorting: true,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    }
  },
  {
    accessorKey: 'itemCount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='明细项数' />
    ),
    cell: ({ row }) => {
      const itemCount = row.getValue('itemCount') as number;
      return (
        <div className='text-center'>
          <Badge variant='secondary'>
            {itemCount}
          </Badge>
        </div>
      );
    },
    enableSorting: true
  },
  {
    accessorKey: 'estimatedTotal',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='预估总金额' />
    ),
    cell: ({ row }) => {
      const estimatedTotal = row.getValue('estimatedTotal') as number;
      return (
        <div className='text-right font-mono'>
          ¥{estimatedTotal.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
        </div>
      );
    },
    enableSorting: true
  },
  {
    accessorKey: 'planDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='计划日期' />
    ),
    cell: ({ row }) => {
      const planDate = row.getValue('planDate') as string;
      return (
        <div className='text-sm text-muted-foreground'>
          {new Date(planDate).toLocaleDateString('zh-CN')}
        </div>
      );
    },
    enableSorting: true
  },
  {
    accessorKey: 'expectedExecutionDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='预计执行日期' />
    ),
    cell: ({ row }) => {
      const expectedExecutionDate = row.getValue('expectedExecutionDate') as string;
      return (
        <div className='text-sm text-muted-foreground'>
          {expectedExecutionDate ? new Date(expectedExecutionDate).toLocaleDateString('zh-CN') : '-'}
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
