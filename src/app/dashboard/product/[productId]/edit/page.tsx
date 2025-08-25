import PageContainer from '@/components/layout/page-container';
import { Breadcrumbs } from '@/components/breadcrumbs';
import ProductForm from '@/features/products/components/product-form';
import { productsApi } from '@/lib/api-client';
import { notFound } from 'next/navigation';

export const metadata = {
  title: '编辑产品 - 仓库管理系统'
};

interface EditProductPageProps {
  params: Promise<{ productId: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { productId } = await params;
  const response = await productsApi.getProduct(productId);

  if (!response.success || !response.data) {
    notFound();
  }

  const productData = (response.data as any).product;

  return (
    <PageContainer scrollable={true}>
      <div className='space-y-4'>
        <Breadcrumbs />
        <ProductForm 
          pageTitle={`编辑产品 - ${productData.name}`}
          initialData={{
            sku: productData.sku,
            name: productData.name,
            image: productData.image_url,
            type: productData.type,
            referencePurchasePrice: productData.reference_purchase_price,
            guidancePrice: productData.guide_unit_price,
            bomItems: [] // TODO: 从API获取BOM数据
          }}
          isEdit={true}
        />
      </div>
    </PageContainer>
  );
}
