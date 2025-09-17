'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { columns } from './columns';
import { PurchaseOrderTableItem } from '@/types/purchase';
import { parseAsInteger, useQueryState } from 'nuqs';
import { createContext, useContext } from 'react';

// 创建采购单表格操作上下文
const PurchaseOrderTableContext = createContext<{
  onDeletePurchaseOrder?: (orderId: string) => void;
}>({});

// 导出 hook 供子组件使用
export const usePurchaseOrderTable = () => useContext(PurchaseOrderTableContext);

interface PurchaseOrderTableProps {
  data: PurchaseOrderTableItem[];
  totalData: number;
  onDeletePurchaseOrder?: (orderId: string) => void;
}

export function PurchaseOrderTable({ data, totalData, onDeletePurchaseOrder }: PurchaseOrderTableProps) {
  const [pageSize] = useQueryState('perPage', parseAsInteger.withDefault(10));

  const pageCount = Math.ceil(totalData / pageSize);

  const { table } = useDataTable({
    data,
    columns,
    pageCount: pageCount,
    shallow: false,
    debounceMs: 500
  });

  return (
    <PurchaseOrderTableContext.Provider value={{ onDeletePurchaseOrder }}>
      <DataTable table={table}>
        <DataTableToolbar table={table} />
      </DataTable>
    </PurchaseOrderTableContext.Provider>
  );
}
