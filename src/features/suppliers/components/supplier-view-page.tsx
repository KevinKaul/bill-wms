'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Supplier } from '@/types/supplier';
// import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard,
  Edit,
  FileText,
  Calendar
} from 'lucide-react';

interface SupplierViewPageProps {
  supplier: Supplier;
}

export function SupplierViewPage({ supplier }: SupplierViewPageProps) {
  const router = useRouter();

  return (
    <div className='flex flex-col space-y-6'>
      {/* 页面标题和操作 */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-3'>
          <Building2 className='h-8 w-8 text-primary' />
          <div>
            <h1 className='text-2xl font-bold'>{supplier.name}</h1>
            <div className='flex items-center space-x-2 mt-1'>
              <Badge variant='outline' className='font-mono'>
                {supplier.code}
              </Badge>
            </div>
          </div>
        </div>
        <Button
          onClick={() => router.push(`/dashboard/supplier/${supplier.id}/edit`)}
          className='flex items-center space-x-2'
        >
          <Edit className='h-4 w-4' />
          <span>编辑供应商</span>
        </Button>
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        {/* 基础信息 */}
        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <Building2 className='h-5 w-5' />
              <span>基础信息</span>
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <div className='text-sm font-medium text-muted-foreground'>供应商代号</div>
                <div className='flex items-center space-x-2'>
                  <Badge variant='outline' className='font-mono'>
                    {supplier.code}
                  </Badge>
                </div>
              </div>
              
              <div className='space-y-2'>
                <div className='text-sm font-medium text-muted-foreground'>供应商全称</div>
                <div className='font-medium'>{supplier.name}</div>
              </div>
              
              <div className='space-y-2'>
                <div className='text-sm font-medium text-muted-foreground flex items-center space-x-1'>
                  <CreditCard className='h-4 w-4' />
                  <span>账号</span>
                </div>
                <div className='font-mono text-sm'>{supplier.account}</div>
              </div>
              
              <div className='space-y-2'>
                <div className='text-sm font-medium text-muted-foreground flex items-center space-x-1'>
                  <Calendar className='h-4 w-4' />
                  <span>创建时间</span>
                </div>
                <div className='text-sm'>{supplier.createdAt.toLocaleString()}</div>
              </div>
            </div>
            
            {supplier.remark && (
              <>
                <Separator />
                <div className='space-y-2'>
                  <div className='text-sm font-medium text-muted-foreground flex items-center space-x-1'>
                    <FileText className='h-4 w-4' />
                    <span>备注</span>
                  </div>
                  <div className='text-sm text-muted-foreground bg-muted/50 p-3 rounded-md'>
                    {supplier.remark}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 联系信息 */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <User className='h-5 w-5' />
              <span>联系信息</span>
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {supplier.contactPerson && (
              <div className='space-y-2'>
                <div className='text-sm font-medium text-muted-foreground flex items-center space-x-1'>
                  <User className='h-4 w-4' />
                  <span>联系人</span>
                </div>
                <div className='font-medium'>{supplier.contactPerson}</div>
              </div>
            )}
            
            {supplier.phone && (
              <div className='space-y-2'>
                <div className='text-sm font-medium text-muted-foreground flex items-center space-x-1'>
                  <Phone className='h-4 w-4' />
                  <span>联系电话</span>
                </div>
                <div className='font-mono text-sm'>{supplier.phone}</div>
              </div>
            )}
            
            {supplier.email && (
              <div className='space-y-2'>
                <div className='text-sm font-medium text-muted-foreground flex items-center space-x-1'>
                  <Mail className='h-4 w-4' />
                  <span>邮箱</span>
                </div>
                <div className='text-sm text-blue-600 hover:underline'>
                  <a href={`mailto:${supplier.email}`}>{supplier.email}</a>
                </div>
              </div>
            )}
            
            {supplier.address && (
              <div className='space-y-2'>
                <div className='text-sm font-medium text-muted-foreground flex items-center space-x-1'>
                  <MapPin className='h-4 w-4' />
                  <span>地址</span>
                </div>
                <div className='text-sm text-muted-foreground'>{supplier.address}</div>
              </div>
            )}
            
            {!supplier.contactPerson && !supplier.phone && !supplier.email && !supplier.address && (
              <div className='text-center text-muted-foreground py-4'>
                <User className='h-8 w-8 mx-auto mb-2 opacity-50' />
                <p className='text-sm'>暂无联系信息</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 相关业务信息 */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {/* 采购记录 */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <FileText className='h-5 w-5' />
              <span>采购记录</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-center text-muted-foreground py-8'>
              <FileText className='h-12 w-12 mx-auto mb-4 opacity-50' />
              <p className='text-sm'>暂无采购记录</p>
              <p className='text-xs mt-1'>采购单功能开发中...</p>
            </div>
          </CardContent>
        </Card>

        {/* 结算记录 */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <CreditCard className='h-5 w-5' />
              <span>结算记录</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-center text-muted-foreground py-8'>
              <CreditCard className='h-12 w-12 mx-auto mb-4 opacity-50' />
              <p className='text-sm'>暂无结算记录</p>
              <p className='text-xs mt-1'>供应商结算功能待开发...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
