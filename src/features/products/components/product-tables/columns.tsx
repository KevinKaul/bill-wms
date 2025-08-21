'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { PRODUCT_TYPE_LABELS, PRODUCT_TYPE_COLORS, DEFAULT_PRODUCT_IMAGE } from '@/constants/product';
import { ProductTableItem } from '@/types/product';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Package, Text, Tag } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { CellAction } from './cell-action';
import { PRODUCT_TYPE_OPTIONS } from './options';

export const columns: ColumnDef<ProductTableItem>[] = [
  {
    accessorKey: 'image',
    header: '图片',
    cell: ({ row }) => {
      const imageUrl = row.getValue('image') as string;
      return (
        <div className='relative h-12 w-12 overflow-hidden rounded-lg'>
          <Image
            src={imageUrl || DEFAULT_PRODUCT_IMAGE}
            alt={row.getValue('name')}
            fill
            className='object-cover'
            sizes='48px'
          />
        </div>
      );
    },
    enableSorting: false
  },
  {
    id: 'sku',
    accessorKey: 'sku',
    header: ({ column }: { column: Column<ProductTableItem, unknown> }) => (
      <DataTableColumnHeader column={column} title='SKU' />
    ),
    cell: ({ cell }) => (
      <div className='font-mono text-sm'>{cell.getValue<string>()}</div>
    ),
    meta: {
      label: 'SKU',
      placeholder: '搜索SKU...',
      variant: 'text',
      icon: Tag
    },
    enableColumnFilter: true
  },
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }: { column: Column<ProductTableItem, unknown> }) => (
      <DataTableColumnHeader column={column} title='产品名称' />
    ),
    cell: ({ cell }) => (
      <div className='max-w-32 truncate font-medium'>
        {cell.getValue<string>()}
      </div>
    ),
    meta: {
      label: '产品名称',
      placeholder: '搜索产品名称...',
      variant: 'text',
      icon: Text
    },
    enableColumnFilter: true
  },
  {
    id: 'type',
    accessorKey: 'type',
    header: ({ column }: { column: Column<ProductTableItem, unknown> }) => (
      <DataTableColumnHeader column={column} title='产品类型' />
    ),
    cell: ({ row }) => {
      const type = row.getValue('type') as ProductTableItem['type'];
      const label = PRODUCT_TYPE_LABELS[type];
      const variant = PRODUCT_TYPE_COLORS[type];
      
      return (
        <Badge variant={variant} className='whitespace-nowrap'>
          <Package className='mr-1 h-3 w-3' />
          {label}
        </Badge>
      );
    },
    enableColumnFilter: true,
    meta: {
      label: '产品类型',
      variant: 'multiSelect',
      options: PRODUCT_TYPE_OPTIONS
    }
  },
  {
    id: 'referencePurchasePrice',
    accessorKey: 'referencePurchasePrice',
    header: ({ column }: { column: Column<ProductTableItem, unknown> }) => (
      <DataTableColumnHeader column={column} title='参考采购价' />
    ),
    cell: ({ cell }) => {
      const price = cell.getValue<number>();
      return price ? (
        <div className='text-right font-mono'>¥{price.toFixed(2)}</div>
      ) : (
        <div className='text-muted-foreground'>-</div>
      );
    }
  },
  {
    id: 'guidancePrice',
    accessorKey: 'guidancePrice',
    header: ({ column }: { column: Column<ProductTableItem, unknown> }) => (
      <DataTableColumnHeader column={column} title='指导单价' />
    ),
    cell: ({ cell }) => {
      const price = cell.getValue<number>();
      return price ? (
        <div className='text-right font-mono'>¥{price.toFixed(2)}</div>
      ) : (
        <div className='text-muted-foreground'>-</div>
      );
    }
  },
  {
    id: 'bomItemsCount',
    accessorKey: 'bomItemsCount',
    header: 'BOM组件',
    cell: ({ cell }) => {
      const count = cell.getValue<number>();
      return count > 0 ? (
        <Badge variant='outline'>{count}个组件</Badge>
      ) : (
        <div className='text-muted-foreground'>-</div>
      );
    },
    enableSorting: false
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: ({ column }: { column: Column<ProductTableItem, unknown> }) => (
      <DataTableColumnHeader column={column} title='创建时间' />
    ),
    cell: ({ cell }) => {
      const date = cell.getValue<Date>();
      return (
        <div className='text-sm text-muted-foreground'>
          {format(date, 'yyyy-MM-dd HH:mm', { locale: zhCN })}
        </div>
      );
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original as any} />
  }
];
