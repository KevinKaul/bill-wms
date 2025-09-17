'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { adjustmentColumns as columns } from './columns';
import { parseAsInteger, useQueryState } from 'nuqs';

interface AdjustmentTableItem {
  id: string;
  product_id: string;
  product_sku: string;
  product_name: string;
  type: 'increase' | 'decrease';
  quantity: number;
  unit_cost: number | null;
  total_cost: number | null;
  reason: string;
  remark: string | null;
  created_by: string;
  created_at: string;
}

interface AdjustmentTableProps {
  data: AdjustmentTableItem[];
  totalData: number;
}

export function AdjustmentTable({ data, totalData }: AdjustmentTableProps) {
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
