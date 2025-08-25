"use client";

import { DataTable } from "@/components/ui/table/data-table";
import { DataTableToolbar } from "@/components/ui/table/data-table-toolbar";

import { useDataTable } from "@/hooks/use-data-table";

import { ColumnDef } from "@tanstack/react-table";
import { parseAsInteger, useQueryState } from "nuqs";
import { createContext, useContext } from "react";

// 创建产品表格操作上下文
const ProductTableContext = createContext<{
  onDeleteProduct?: (productId: string) => void;
}>({});

// 导出 hook 供子组件使用
export const useProductTable = () => useContext(ProductTableContext);
interface ProductTableParams<TData, TValue> {
  data: TData[];
  totalItems: number;
  columns: ColumnDef<TData, TValue>[];
  onDeleteProduct?: (productId: string) => void;
}
export function ProductTable<TData, TValue>({
  data,
  totalItems,
  columns,
  onDeleteProduct,
}: ProductTableParams<TData, TValue>) {
  const [pageSize] = useQueryState("perPage", parseAsInteger.withDefault(10));

  const pageCount = Math.ceil(totalItems / pageSize);

  const { table } = useDataTable({
    data, // product data
    columns, // product columns
    pageCount: pageCount,
    shallow: false, //Setting to false triggers a network request with the updated querystring.
    debounceMs: 500,
  });

  return (
    <ProductTableContext.Provider value={{ onDeleteProduct }}>
      <DataTable table={table}>
        <DataTableToolbar table={table} />
      </DataTable>
    </ProductTableContext.Provider>
  );
}
