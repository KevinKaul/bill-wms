import PageContainer from '@/components/layout/page-container';
import { Breadcrumbs } from '@/components/breadcrumbs';
import ProductForm from '@/features/products/components/product-form';

export const metadata = {
  title: '新增产品 - 仓库管理系统'
};

export default function NewProductPage() {
  return (
    <PageContainer scrollable={true}>
      <div className='space-y-4'>
        <Breadcrumbs />
        <ProductForm 
          pageTitle='新增产品'
          isEdit={false}
        />
      </div>
    </PageContainer>
  );
}
