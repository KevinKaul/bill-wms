import PageContainer from '@/components/layout/page-container';
import { Breadcrumbs } from '@/components/breadcrumbs';
import ProductForm from '@/features/products/components/product-form';
import { fakeProductsApi } from '@/lib/mock-products';
import { notFound } from 'next/navigation';

export const metadata = {
  title: '编辑产品 - 仓库管理系统'
};

interface EditProductPageProps {
  params: Promise<{ productId: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { productId } = await params;
  const product = await fakeProductsApi.getProductById(productId);

  if (!product) {
    notFound();
  }

  return (
    <PageContainer scrollable={true}>
      <div className='space-y-4'>
        <Breadcrumbs />
        <ProductForm 
          pageTitle={`编辑产品 - ${product.name}`}
          initialData={{
            sku: product.sku,
            name: product.name,
            image: product.image,
            type: product.type,
            referencePurchasePrice: product.referencePurchasePrice,
            guidancePrice: product.guidancePrice,
            bomItems: [] // TODO: 从API获取BOM数据
          }}
          isEdit={true}
        />
      </div>
    </PageContainer>
  );
}
