'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { columns } from './columns';
import { PurchaseOrderTableItem } from '@/types/purchase';
import { parseAsInteger, useQueryState } from 'nuqs';

interface PurchaseOrderTableProps {
  data: PurchaseOrderTableItem[];
  totalData: number;
}

export function PurchaseOrderTable({ data, totalData }: PurchaseOrderTableProps) {
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
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}
