"use client";
import { AlertModal } from "@/components/modal/alert-modal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProductTableItem } from "@/types/product";
import { productsApi } from "@/lib/api-client";
import { Edit, MoreHorizontal, Trash, Eye, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useProductTable } from "./index";

interface CellActionProps {
  data: ProductTableItem;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { onDeleteProduct } = useProductTable();

  const onConfirm = async () => {
    try {
      setLoading(true);
      const response = await productsApi.deleteProduct(data.id);

      if (response.success) {
        toast.success("产品已删除");
        setOpen(false);
        // 从表格中移除该行，而不是刷新页面
        if (onDeleteProduct) {
          onDeleteProduct(data.id);
        }
      } else {
        toast.error(response.error?.message || "删除失败");
      }
    } catch (error) {
      console.error("删除产品错误:", error);
      toast.error("删除失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const onCopy = () => {
    navigator.clipboard.writeText(data.sku);
    toast.success("已复制SKU到剪贴板");
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        loading={loading}
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">打开菜单</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>操作</DropdownMenuLabel>

          <DropdownMenuItem onClick={onCopy}>
            <Copy className="mr-2 h-4 w-4" /> 复制SKU
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => router.push(`/dashboard/product/${data.id}`)}
          >
            <Eye className="mr-2 h-4 w-4" /> 查看详情
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => router.push(`/dashboard/product/${data.id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" /> 编辑
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setOpen(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash className="mr-2 h-4 w-4" /> 删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
