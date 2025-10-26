"use client";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/ui/table/data-table-column-header";
import { Checkbox } from "@/components/ui/checkbox";
import {
  PRODUCT_TYPE_LABELS,
  PRODUCT_TYPE_COLORS,
  DEFAULT_PRODUCT_IMAGE,
} from "@/constants/product";
import { ProductTableItem } from "@/types/product";
import { Column, ColumnDef } from "@tanstack/react-table";
import { Package, Text, Tag } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { CellAction } from "./cell-action";
import { PRODUCT_TYPE_OPTIONS } from "./options";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

// 图片预览组件
function ImagePreview({
  src,
  alt,
  productName,
}: {
  src: string | null | undefined;
  alt: string;
  productName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        className="relative h-12 w-12 overflow-hidden rounded-lg cursor-pointer hover:opacity-80 hover:ring-2 hover:ring-primary/50 transition-all duration-200 group"
        onClick={() => setIsOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`查看 ${productName} 的产品图片`}
      >
        <Image
          src={src || DEFAULT_PRODUCT_IMAGE}
          alt={alt}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-200"
          sizes="48px"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
          <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Package className="h-4 w-4" />
          </div>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[95vh] p-0 overflow-hidden">
          <DialogTitle className="sr-only">
            {productName} 产品图片预览
          </DialogTitle>
          <div className="relative w-full h-full min-h-[60vh] max-h-[85vh] bg-gray-50 dark:bg-gray-900">
            <Image
              src={src || DEFAULT_PRODUCT_IMAGE}
              alt={alt}
              fill
              className="object-contain p-4"
              sizes="95vw"
              priority
            />
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-6">
            <h3 className="font-semibold text-lg">{productName}</h3>
            <p className="text-sm text-gray-300 mt-1">
              点击背景或按 ESC 键关闭
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export const columns: ColumnDef<ProductTableItem>[] = [
  {
    id: "select",
    header: ({ table }: { table: any }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value: any) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }: { row: any }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value: any) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  },
  {
    accessorKey: "image",
    header: "图片",
    cell: ({ row }) => {
      const imageUrl = row.getValue("image") as string | null | undefined;
      const productName = row.getValue("name") as string;
      return (
        <ImagePreview
          src={imageUrl || DEFAULT_PRODUCT_IMAGE}
          alt={productName}
          productName={productName}
        />
      );
    },
    enableSorting: false,
  },
  {
    id: "sku",
    accessorKey: "sku",
    header: ({ column }: { column: Column<ProductTableItem, unknown> }) => (
      <DataTableColumnHeader column={column} title="SKU" />
    ),
    cell: ({ cell }) => (
      <div className="font-mono text-sm">{cell.getValue<string>()}</div>
    ),
    meta: {
      label: "SKU",
      placeholder: "搜索SKU...",
      variant: "text",
      icon: Tag,
    },
    enableColumnFilter: true,
  },
  {
    id: "name",
    accessorKey: "name",
    header: ({ column }: { column: Column<ProductTableItem, unknown> }) => (
      <DataTableColumnHeader column={column} title="产品名称" />
    ),
    cell: ({ cell }) => (
      <div className="max-w-32 truncate font-medium">
        {cell.getValue<string>()}
      </div>
    ),
    meta: {
      label: "产品名称",
      placeholder: "搜索产品名称...",
      variant: "text",
      icon: Text,
    },
    enableColumnFilter: true,
  },
  {
    id: "type",
    accessorKey: "type",
    header: ({ column }: { column: Column<ProductTableItem, unknown> }) => (
      <DataTableColumnHeader column={column} title="产品类型" />
    ),
    cell: ({ row }) => {
      const type = row.getValue("type") as ProductTableItem["type"];
      const label = PRODUCT_TYPE_LABELS[type];
      const variant = PRODUCT_TYPE_COLORS[type];

      return (
        <Badge variant={variant} className="whitespace-nowrap">
          <Package className="mr-1 h-3 w-3" />
          {label}
        </Badge>
      );
    },
    enableColumnFilter: true,
    meta: {
      label: "产品类型",
      variant: "multiSelect",
      options: PRODUCT_TYPE_OPTIONS,
    },
  },
  {
    id: "referencePurchasePrice",
    accessorKey: "reference_purchase_price",
    header: ({ column }: { column: Column<ProductTableItem, unknown> }) => (
      <DataTableColumnHeader column={column} title="参考采购价" />
    ),
    cell: ({ cell }) => {
      const price = cell.getValue<number>();
      return price ? (
        <div className="text-center font-mono">¥{price.toFixed(2)}</div>
      ) : (
        <div className="text-center text-muted-foreground">-</div>
      );
    },
  },
  {
    id: "guidancePrice",
    accessorKey: "guide_unit_price",
    header: ({ column }: { column: Column<ProductTableItem, unknown> }) => (
      <DataTableColumnHeader column={column} title="指导单价" />
    ),
    cell: ({ cell }) => {
      const price = cell.getValue<number>();
      return price ? (
        <div className="text-center font-mono">¥{price.toFixed(2)}</div>
      ) : (
        <div className="text-center text-muted-foreground">-</div>
      );
    },
  },
  {
    id: "bomItemsCount",
    accessorKey: "bom_components_count",
    header: "BOM组件",
    cell: ({ cell }) => {
      const count = cell.getValue<number>();
      return count > 0 ? (
        <Badge variant="outline">{count}个组件</Badge>
      ) : (
        <div className="text-center text-muted-foreground">-</div>
      );
    },
    enableSorting: false,
  },
  {
    id: "createdAt",
    accessorKey: "created_at",
    header: ({ column }: { column: Column<ProductTableItem, unknown> }) => (
      <DataTableColumnHeader column={column} title="创建时间" />
    ),
    cell: ({ cell }) => {
      const dateValue = cell.getValue();
      let date: Date;

      try {
        // 处理不同的日期格式
        if (dateValue instanceof Date) {
          date = dateValue;
        } else if (typeof dateValue === "string") {
          date = new Date(dateValue);
        } else {
          throw new Error("Invalid date value");
        }

        // 检查日期是否有效
        if (isNaN(date.getTime())) {
          throw new Error("Invalid date");
        }

        return (
          <div className="text-sm text-center text-muted-foreground">
            {format(date, "yyyy-MM-dd HH:mm", { locale: zhCN })}
          </div>
        );
      } catch (error) {
        return (
          <div className="text-sm text-center text-muted-foreground">-</div>
        );
      }
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original as any} />,
  },
];
