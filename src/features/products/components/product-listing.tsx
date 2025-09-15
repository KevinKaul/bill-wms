"use client";

import { ProductTableItem, ProductType } from "@/types/product";
import { createClientApi } from "@/lib/client-api";
import { ProductTable } from "./product-tables";
import { columns } from "./product-tables/columns";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type ProductListingPage = {};

export default function ProductListingPage({}: ProductListingPage) {
  const { getToken, isSignedIn } = useAuth();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductTableItem[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // 删除产品函数
  const handleDeleteProduct = (productId: string) => {
    setProducts((prevProducts) =>
      prevProducts.filter((p) => p.id !== productId)
    );
    setTotalProducts((prevTotal) => prevTotal - 1);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      if (!isSignedIn) return;

      try {
        setLoading(true);
        setError(null);

        // 从URL搜索参数获取过滤条件
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("perPage") || "10");

        // 获取各种搜索和筛选参数 - 这些是 useDataTable 设置的参数
        const skuSearch = searchParams.get("sku") || undefined;
        const nameSearch = searchParams.get("name") || undefined;
        const typeFilter = searchParams.get("type") || undefined;

        // 合并搜索条件
        const searchTerms = [];
        if (skuSearch) searchTerms.push(skuSearch);
        if (nameSearch) searchTerms.push(nameSearch);
        const search =
          searchTerms.length > 0 ? searchTerms.join(" ") : undefined;

        // 处理产品类型筛选 - type可能是数组
        let productType: ProductType | undefined;
        if (typeFilter) {
          // 如果是多个值，取第一个
          const typeValues = typeFilter.split(",");
          productType = typeValues[0] as ProductType;
        }

        const filters = {
          page,
          pageSize,
          ...(search && { search }),
          ...(productType && { type: productType }),
          sortBy: "createdAt",
          sortOrder: "desc" as "asc" | "desc",
        };

        console.log("搜索参数:", {
          skuSearch,
          nameSearch,
          typeFilter,
          search,
          productType,
          filters,
        });

        const clientApi = createClientApi(getToken);
        const response = await clientApi.products.getProducts(filters);

        console.log("API响应:", response.data);

        if (!response.success) {
          throw new Error(response.error?.message || "获取产品列表失败");
        }

        const totalCount = (response.data as any)?.total || 0;
        const productList: ProductTableItem[] =
          (response.data as any)?.products?.map((product: any) => ({
            id: product.id,
            sku: product.sku,
            name: product.name,
            type: product.type,
            image: product.image,
            reference_purchase_price: product.reference_purchase_price,
            guide_unit_price: product.guide_unit_price,
            calculated_cost: product.calculated_cost,
            bom_components_count: product.bom_components_count,
            status: product.status,
            created_at: product.created_at
              ? new Date(product.created_at)
              : new Date(),
            updated_at: product.updated_at
              ? new Date(product.updated_at)
              : new Date(),
          })) || [];

        setProducts(productList);
        setTotalProducts(totalCount);
      } catch (err) {
        console.error("获取产品列表失败:", err);
        setError(err instanceof Error ? err.message : "获取产品列表失败");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [isSignedIn, getToken, searchParams]);

  if (loading) {
    return <div className="p-4">加载中...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">错误: {error}</div>;
  }

  if (!isSignedIn) {
    return <div className="p-4">请先登录</div>;
  }

  return (
    <ProductTable
      data={products}
      totalItems={totalProducts}
      columns={columns}
      onDeleteProduct={handleDeleteProduct}
    />
  );
}
