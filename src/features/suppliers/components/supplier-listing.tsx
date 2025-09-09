import { SupplierTableItem } from '@/types/supplier';
import { suppliersApi } from '@/lib/api-client';
import { searchParamsCache } from '@/lib/searchparams';
import { SupplierTable } from './supplier-tables';

type SupplierListingPageProps = {};

export default async function SupplierListingPage({}: SupplierListingPageProps) {
  // 从搜索参数缓存获取过滤条件
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');

  const filters = {
    page,
    per_page: pageLimit,
    ...(search && typeof search === 'string' && { search }),
    sort: 'createdAt',
    order: 'desc' as 'asc' | 'desc'
  };

  const response = await suppliersApi.getSuppliers(filters);
  if (!response.success) {
    throw new Error(response.error?.message || '获取供应商列表失败');
  }

  const totalSuppliers = (response.data as any)?.total || 0;
  const suppliers: SupplierTableItem[] = (response.data as any)?.suppliers?.map((supplier: any) => ({
    id: supplier.id,
    code: supplier.code,
    name: supplier.name,
    account: supplier.account || '',
    contactPerson: supplier.contact_person,
    phone: supplier.phone,
    email: supplier.email,
    createdAt: supplier.created_at
  })) || [];

  return (
    <SupplierTable data={suppliers} totalData={totalSuppliers} />
  );
}
