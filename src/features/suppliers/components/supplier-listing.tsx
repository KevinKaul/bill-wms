import { SupplierTableItem } from '@/types/supplier';
import { fakeSuppliersApi } from '@/lib/mock-suppliers';
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
    limit: pageLimit,
    ...(search && typeof search === 'string' && { search })
  };

  const data = await fakeSuppliersApi.getSuppliers(filters);
  const totalSuppliers = data.total_suppliers;
  const suppliers: SupplierTableItem[] = data.suppliers.map(supplier => ({
    id: supplier.id,
    code: supplier.code,
    name: supplier.name,
    account: supplier.account,
    contactPerson: supplier.contactPerson,
    phone: supplier.phone,
    email: supplier.email,
    createdAt: supplier.createdAt.toISOString()
  }));

  return (
    <SupplierTable data={suppliers} totalData={totalSuppliers} />
  );
}
