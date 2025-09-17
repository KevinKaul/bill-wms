'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { ProductionOrderTableItem, ProductionOrderFilters } from '@/types/production';
import { columns } from './columns';
import { createContext, useContext } from 'react';

// 创建生产订单表格操作上下文
const ProductionTableContext = createContext<{
  onRefresh?: () => void;
}>({});

// 导出 hook 供子组件使用
export const useProductionTable = () => useContext(ProductionTableContext);

interface ProductionTableProps {
  data: ProductionOrderTableItem[];
  totalItems: number;
  onRefresh?: () => void;
  pageSizeOptions?: number[];
  searchableColumns?: { id: keyof ProductionOrderTableItem; title: string }[];
  filterableColumns?: { id: keyof ProductionOrderTableItem; title: string; options: { label: string; value: string }[] }[];
  onFiltersChange?: (filters: ProductionOrderFilters) => void;
}

export function ProductionTable({
  data,
  totalItems,
  onRefresh,
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
        { label: '待处理', value: 'pending' },
        { label: '进行中', value: 'in_progress' },
        { label: '已完成', value: 'completed' }
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
  console.log('ProductionTable 接收到的数据:', { data, totalItems });
  
  const pageCount = Math.ceil(totalItems / 10);
  
  const { table } = useDataTable({
    data,
    columns,
    pageCount: pageCount,
    shallow: false,
    debounceMs: 500
  });

  console.log('useDataTable 返回的 table:', table);
  console.log('table.getRowModel().rows:', table.getRowModel().rows);

  return (
    <ProductionTableContext.Provider value={{ onRefresh }}>
      <DataTable table={table}>
        <DataTableToolbar table={table} />
      </DataTable>
    </ProductionTableContext.Provider>
  );
}
