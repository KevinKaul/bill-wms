'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { ProductionOrderTableItem } from '@/types/production';
import { 
  PRODUCTION_STATUS_COLORS, 
  PRODUCTION_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS
} from '@/constants/production';
import { CellAction } from './cell-action';
import { formatAmount } from '@/lib/utils';

export const columns: ColumnDef<ProductionOrderTableItem>[] = [
  {
    accessorKey: 'orderNumber',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='加工单号' />
    ),
    cell: ({ row }) => {
      return (
        <div className='font-medium'>
          {row.getValue('orderNumber')}
        </div>
      );
    }
  },
  {
    accessorKey: 'productInfo',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='产品信息' />
    ),
    cell: ({ row }) => {
      const productInfo = row.getValue('productInfo') as { sku: string; name: string };
      return (
        <div className='flex flex-col gap-1'>
          <Badge variant='outline' className='font-mono text-xs w-fit'>
            {productInfo.sku}
          </Badge>
          <span className='text-sm'>{productInfo.name}</span>
        </div>
      );
    },
    enableSorting: false
  },
  {
    accessorKey: 'plannedQuantity',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='计划数量' />
    ),
    cell: ({ row }) => {
      const plannedQuantity = row.getValue('plannedQuantity') as number;
      const actualQuantity = row.original.actualQuantity;
      
      return (
        <div className='flex flex-col gap-1'>
          <span className='text-sm'>
            计划: {plannedQuantity != null ? plannedQuantity.toLocaleString() : '-'}
          </span>
          {actualQuantity != null && (
            <span className='text-xs text-muted-foreground'>
              实际: {actualQuantity.toLocaleString()}
            </span>
          )}
        </div>
      );
    }
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='生产状态' />
    ),
    cell: ({ row }) => {
      const status = row.getValue('status') as keyof typeof PRODUCTION_STATUS_COLORS;
      return (
        <Badge 
          variant='secondary' 
          className={PRODUCTION_STATUS_COLORS[status]}
        >
          {PRODUCTION_STATUS_LABELS[status]}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    }
  },
  {
    accessorKey: 'paymentStatus',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='付款状态' />
    ),
    cell: ({ row }) => {
      const paymentStatus = row.getValue('paymentStatus') as keyof typeof PAYMENT_STATUS_COLORS;
      return (
        <Badge 
          variant='secondary' 
          className={PAYMENT_STATUS_COLORS[paymentStatus]}
        >
          {PAYMENT_STATUS_LABELS[paymentStatus]}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    }
  },
  {
    accessorKey: 'supplierName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='加工供应商' />
    ),
    cell: ({ row }) => {
      const supplierName = row.getValue('supplierName') as string;
      return (
        <span className='text-sm'>
          {supplierName || '-'}
        </span>
      );
    }
  },
  {
    accessorKey: 'materialCost',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='物料成本' />
    ),
    cell: ({ row }) => {
      const materialCost = row.getValue('materialCost') as number;
      return (
        <span className='text-sm font-medium'>
          {materialCost != null 
            ? `¥${formatAmount(materialCost)}`
            : '-'
          }
        </span>
      );
    }
  },
  {
    accessorKey: 'processingFee',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='加工费用' />
    ),
    cell: ({ row }) => {
      const processingFee = row.getValue('processingFee') as number;
      return (
        <span className='text-sm'>
          {processingFee != null 
            ? `¥${formatAmount(processingFee)}`
            : '-'
          }
        </span>
      );
    }
  },
  {
    accessorKey: 'totalCost',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='总成本' />
    ),
    cell: ({ row }) => {
      const totalCost = row.getValue('totalCost') as number;
      return (
        <span className='text-sm font-medium'>
          {totalCost != null 
            ? `¥${formatAmount(totalCost)}`
            : '-'
          }
        </span>
      );
    }
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='创建时间' />
    ),
    cell: ({ row }) => {
      const createdAt = row.getValue('createdAt') as string;
      return (
        <span className='text-sm text-muted-foreground'>
          {new Date(createdAt).toLocaleString('zh-CN')}
        </span>
      );
    }
  },
  {
    id: 'actions',
    header: '操作',
    cell: ({ row }) => <CellAction data={row.original} />,
    enableSorting: false,
    enableHiding: false
  }
];
