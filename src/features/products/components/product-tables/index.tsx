"use client";

import { DataTable } from "@/components/ui/table/data-table";
import { DataTableToolbar } from "@/components/ui/table/data-table-toolbar";
import { Button } from "@/components/ui/button";
import { AlertModal } from "@/components/modal/alert-modal";

import { useDataTable } from "@/hooks/use-data-table";
import { deleteApi } from "@/lib/delete-api";
import { useAuth } from "@clerk/nextjs";

import { ColumnDef } from "@tanstack/react-table";
import { parseAsInteger, useQueryState } from "nuqs";
import { createContext, useContext, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

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
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { getToken } = useAuth();

  const pageCount = Math.ceil(totalItems / pageSize);

  const { table } = useDataTable({
    data, // product data
    columns, // product columns
    pageCount: pageCount,
    shallow: false, //Setting to false triggers a network request with the updated querystring.
    debounceMs: 500,
  });

  // 获取选中的行
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedCount = selectedRows.length;

  // 批量删除函数
  const handleBatchDelete = async () => {
    try {
      setDeleteLoading(true);
      const selectedIds = selectedRows.map((row) => (row.original as any).id);

      // 逐个删除选中的产品
      let successCount = 0;
      let failCount = 0;

      for (const id of selectedIds) {
        try {
          const response = await deleteApi.deleteProduct(id, getToken);
          if (response.success) {
            successCount++;
            if (onDeleteProduct) {
              onDeleteProduct(id);
            }
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
        }
      }

      // 显示结果
      if (successCount > 0) {
        toast.success(`成功删除 ${successCount} 个产品`);
      }
      if (failCount > 0) {
        toast.error(`${failCount} 个产品删除失败`);
      }

      // 清除选中状态
      table.resetRowSelection();
      setDeleteOpen(false);
    } catch (error) {
      console.error("批量删除错误:", error);
      toast.error("批量删除失败，请重试");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <ProductTableContext.Provider value={{ onDeleteProduct }}>
      {/* 删除确认对话框 */}
      <AlertModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleBatchDelete}
        loading={deleteLoading}
        title="批量删除产品"
        description={`确定要删除选中的 ${selectedCount} 个产品吗？此操作无法撤销。`}
      />

      {/* 批量操作工具栏 */}
      {selectedCount > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3">
          <span className="text-sm font-medium text-red-900">
            已选中 {selectedCount} 个产品
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            disabled={deleteLoading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            批量删除
          </Button>
        </div>
      )}

      <DataTable table={table}>
        <DataTableToolbar table={table} />
      </DataTable>
    </ProductTableContext.Provider>
  );
}
