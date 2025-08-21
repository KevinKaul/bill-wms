'use client';

import { ColumnDef } from '@tanstack/react-table';
import { SupplierTableItem } from '@/types/supplier';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Badge } from '@/components/ui/badge';

import { CellAction } from './cell-action';

export const columns: ColumnDef<SupplierTableItem>[] = [
  {
    accessorKey: 'code',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='供应商代号' />
    ),
    cell: ({ row }) => {
      const code = row.getValue('code') as string;
      return (
        <div className='flex items-center'>
          <Badge variant='outline' className='font-mono'>
            {code}
          </Badge>
        </div>
      );
    },
    enableSorting: true,
    enableHiding: false
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='供应商名称' />
    ),
    cell: ({ row }) => {
      const name = row.getValue('name') as string;
      return (
        <div className='max-w-[200px] truncate font-medium'>
          {name}
        </div>
      );
    },
    enableSorting: true
  },
  {
    accessorKey: 'contactPerson',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='联系人' />
    ),
    cell: ({ row }) => {
      const contactPerson = row.getValue('contactPerson') as string;
      return (
        <div className='text-muted-foreground'>
          {contactPerson || '-'}
        </div>
      );
    },
    enableSorting: false
  },
  {
    accessorKey: 'phone',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='联系电话' />
    ),
    cell: ({ row }) => {
      const phone = row.getValue('phone') as string;
      return (
        <div className='font-mono text-sm'>
          {phone || '-'}
        </div>
      );
    },
    enableSorting: false
  },
  {
    accessorKey: 'account',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='账号' />
    ),
    cell: ({ row }) => {
      const account = row.getValue('account') as string;
      return (
        <div className='font-mono text-sm max-w-[150px] truncate'>
          {account}
        </div>
      );
    },
    enableSorting: false
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='邮箱' />
    ),
    cell: ({ row }) => {
      const email = row.getValue('email') as string;
      return (
        <div className='text-sm text-muted-foreground max-w-[180px] truncate'>
          {email || '-'}
        </div>
      );
    },
    enableSorting: false
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='创建时间' />
    ),
    cell: ({ row }) => {
      const createdAt = row.getValue('createdAt') as string;
      return (
        <div className='text-sm text-muted-foreground'>
          {createdAt.toLocaleString()}
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
