import PageContainer from "@/components/layout/page-container";
import { Breadcrumbs } from "@/components/breadcrumbs";
import ProductForm from "@/features/products/components/product-form";
import { productsApi } from "@/lib/api-client";
import { notFound } from "next/navigation";

export const metadata = {
  title: "编辑产品 - 仓库管理系统",
};

interface EditProductPageProps {
  params: Promise<{ productId: string }>;
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { productId } = await params;
  const response = await productsApi.getProduct(productId);

  if (!response.success || !response.data) {
    notFound();
  }

  const responseData = response.data as any;
  const productData = responseData.product;
  const bomComponents = responseData.bom_components || [];

  // 转换BOM数据格式
  const bomItems = bomComponents.map((component: any) => ({
    componentId: component.material_id,
    quantity: component.quantity,
  }));

  return (
    <PageContainer scrollable={true}>
      <div className="space-y-4">
        <ProductForm
          pageTitle={`编辑产品 - ${productData.name}`}
          initialData={{
            id: productData.id,
            sku: productData.sku,
            name: productData.name,
            image: productData.image_url,
            type: productData.type,
            referencePurchasePrice: productData.reference_purchase_price,
            guidancePrice: productData.guide_unit_price,
            bomItems: bomItems,
          }}
          isEdit={true}
        />
      </div>
    </PageContainer>
  );
}
