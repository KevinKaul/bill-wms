'use client';

import { ColumnDef } from '@tanstack/react-table';
import { PurchaseOrderTableItem } from '@/types/purchase';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { STATUS_COLORS, STATUS_LABELS } from '@/constants/purchase';
import { CellAction } from './cell-action';
import { StatusUpdateCell } from './status-update-cell';
import { PaymentStatusCell } from './payment-status-cell';

export const columns: ColumnDef<PurchaseOrderTableItem>[] = [
  {
    accessorKey: 'orderNumber',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='采购单号' />
    ),
    cell: ({ row }) => {
      const orderNumber = row.getValue('orderNumber') as string;
      return (
        <div className='flex items-center'>
          <Badge variant='outline' className='font-mono'>
            {orderNumber}
          </Badge>
        </div>
      );
    },
    enableSorting: true,
    enableHiding: false
  },
  {
    accessorKey: 'supplierName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='供应商' />
    ),
    cell: ({ row }) => {
      const supplierName = row.getValue('supplierName') as string;
      const supplierCode = row.original.supplierCode;
      return (
        <div className='space-y-1'>
          <div className='font-medium max-w-[200px] justify-center items-center  truncate'>{supplierName}</div>
          <Badge variant='secondary' className='text-xs font-mono'>
            {supplierCode}
          </Badge>
        </div>
      );
    },
    enableSorting: true
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='订单状态' />
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
    accessorKey: 'paymentStatus',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='付款状态' />
    ),
    cell: ({ row }) => {
      return (
        <PaymentStatusCell 
          data={row.original} 
          onUpdate={() => window.location.reload()}
        />
      );
    },
    enableSorting: true,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    }
  },
  {
    accessorKey: 'deliveryStatus',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='到货状态' />
    ),
    cell: ({ row }) => {
      return (
        <StatusUpdateCell 
          data={row.original} 
          statusType="delivery"
          onUpdate={() => window.location.reload()}
        />
      );
    },
    enableSorting: true,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    }
  },
  {
    accessorKey: 'totalAmount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='总金额' />
    ),
    cell: ({ row }) => {
      const totalAmount = row.getValue('totalAmount') as number;
      return (
        <div className='text-right font-mono font-medium'>
          ¥{totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
        </div>
      );
    },
    enableSorting: true
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
    accessorKey: 'orderDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='下单日期' />
    ),
    cell: ({ row }) => {
      const orderDate = row.getValue('orderDate') as string;
      return (
        <div className='text-sm text-muted-foreground'>
          {new Date(orderDate).toLocaleDateString('zh-CN')}
        </div>
      );
    },
    enableSorting: true
  },
  {
    accessorKey: 'expectedDeliveryDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='预计到货' />
    ),
    cell: ({ row }) => {
      const expectedDeliveryDate = row.getValue('expectedDeliveryDate') as string;
      return (
        <div className='text-sm text-muted-foreground'>
          {expectedDeliveryDate ? new Date(expectedDeliveryDate).toLocaleDateString('zh-CN') : '-'}
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
