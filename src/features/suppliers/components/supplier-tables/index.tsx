'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { columns } from './columns';
import { SupplierTableItem } from '@/types/supplier';
import { parseAsInteger, useQueryState } from 'nuqs';

interface SupplierTableProps {
  data: SupplierTableItem[];
  totalData: number;
}

export function SupplierTable({ data, totalData }: SupplierTableProps) {
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
