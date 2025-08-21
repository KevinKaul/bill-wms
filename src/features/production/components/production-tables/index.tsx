'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { ProductionOrderTableItem, ProductionOrderFilters } from '@/types/production';
import { columns } from './columns';

interface ProductionTableProps {
  data: ProductionOrderTableItem[];
  totalItems: number;
  pageSizeOptions?: number[];
  searchableColumns?: { id: keyof ProductionOrderTableItem; title: string }[];
  filterableColumns?: { id: keyof ProductionOrderTableItem; title: string; options: { label: string; value: string }[] }[];
  onFiltersChange?: (filters: ProductionOrderFilters) => void;
}

export function ProductionTable({
  data,
  totalItems,
  pageSizeOptions = [10, 20, 50, 100],
  searchableColumns = [
    { id: 'orderNumber', title: '加工单号' },
    { id: 'productInfo', title: '产品信息' }
  ],
  filterableColumns = [
    {
      id: 'status',
      title: '生产状态',
      options: [
        { label: '草稿', value: 'draft' },
        { label: '已确认', value: 'confirmed' },
        { label: '生产中', value: 'in_progress' },
        { label: '已完成', value: 'completed' },
        { label: '已取消', value: 'cancelled' }
      ]
    },
    {
      id: 'paymentStatus',
      title: '付款状态',
      options: [
        { label: '未付款', value: 'unpaid' },
        { label: '已付款', value: 'paid' }
      ]
    }
  ],
  onFiltersChange
}: ProductionTableProps) {
  const { table } = useDataTable({
    data,
    columns,
    totalItems,
    pageSizeOptions,
    searchableColumns,
    filterableColumns
  });

  return (
    <div className='space-y-4'>
      <DataTableToolbar table={table} />
      <DataTable table={table} />
    </div>
  );
}
