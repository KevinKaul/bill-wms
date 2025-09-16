'use client';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { SupplierFormData } from '@/types/supplier';
import { SUPPLIER_VALIDATION } from '@/constants/supplier';
import { createClientApi } from '@/lib/client-api';
import { useAuth } from '@clerk/nextjs';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Building2 } from 'lucide-react';
import * as z from 'zod';

const formSchema = z.object({
  code: z.string()
    .min(SUPPLIER_VALIDATION.CODE_MIN_LENGTH, {
      message: `供应商代号至少需要${SUPPLIER_VALIDATION.CODE_MIN_LENGTH}个字符`
    })
    .max(SUPPLIER_VALIDATION.CODE_MAX_LENGTH, {
      message: `供应商代号不能超过${SUPPLIER_VALIDATION.CODE_MAX_LENGTH}个字符`
    }),
  name: z.string()
    .min(SUPPLIER_VALIDATION.NAME_MIN_LENGTH, {
      message: `供应商名称至少需要${SUPPLIER_VALIDATION.NAME_MIN_LENGTH}个字符`
    })
    .max(SUPPLIER_VALIDATION.NAME_MAX_LENGTH, {
      message: `供应商名称不能超过${SUPPLIER_VALIDATION.NAME_MAX_LENGTH}个字符`
    }),
  account: z.string()
    .min(SUPPLIER_VALIDATION.ACCOUNT_MIN_LENGTH, {
      message: `账号至少需要${SUPPLIER_VALIDATION.ACCOUNT_MIN_LENGTH}个字符`
    })
    .max(SUPPLIER_VALIDATION.ACCOUNT_MAX_LENGTH, {
      message: `账号不能超过${SUPPLIER_VALIDATION.ACCOUNT_MAX_LENGTH}个字符`
    }),
  contactPerson: z.string().optional(),
  phone: z.string()
    .optional(),
    // .refine((val) => !val || SUPPLIER_VALIDATION.PHONE_PATTERN.test(val), {
    //   message: '请输入有效的手机号码'
    // }),
  email: z.string()
    .optional(),
    // .refine((val) => !val || SUPPLIER_VALIDATION.EMAIL_PATTERN.test(val), {
    //   message: '请输入有效的邮箱地址'
    // }),
  address: z.string().optional(),
  remark: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

interface SupplierFormProps {
  initialData?: SupplierFormData & { id?: string };
}

export function SupplierForm({ initialData }: SupplierFormProps) {
  const router = useRouter();
  const { getToken } = useAuth();
  const clientApi = createClientApi(getToken);
  const [loading, setLoading] = useState(false);

  const isEdit = !!initialData?.id;
  const title = isEdit ? '编辑供应商' : '新增供应商';
  const description = isEdit ? '修改供应商基础信息' : '创建新的供应商';
  const toastMessage = isEdit ? '供应商更新成功' : '供应商创建成功';
  const action = isEdit ? '更新' : '创建';

  const defaultValues: FormValues = {
    code: initialData?.code || '',
    name: initialData?.name || '',
    account: initialData?.account || '',
    contactPerson: initialData?.contactPerson || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    address: initialData?.address || '',
    remark: initialData?.remark || ''
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true);
      
      let response;
      if (isEdit && initialData?.id) {
        response = await clientApi.suppliers.updateSupplier(initialData.id, values);
      } else {
        response = await clientApi.suppliers.createSupplier(values);
      }
      
      if (response.success) {
        toast.success(toastMessage);
        router.push('/dashboard/supplier');
      } else {
        toast.error(response.error?.message || (isEdit ? '更新失败' : '创建失败'));
      }
    } catch (error) {
      toast.error(isEdit ? '更新失败，请重试' : '创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex flex-col space-y-4'>
      <div className='flex items-center space-x-2'>
        <Building2 className='h-6 w-6' />
        <div>
          <h3 className='text-lg font-medium'>{title}</h3>
          <p className='text-sm text-muted-foreground'>{description}</p>
        </div>
      </div>
      
      <Separator />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            {/* 基础信息 */}
            <div className='space-y-4'>
              <h4 className='text-sm font-medium'>基础信息</h4>
              
              <FormField
                control={form.control}
                name='code'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>供应商代号 *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='如：SUP001'
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      供应商的唯一标识代号
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>供应商全称 *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='如：上海华美材料有限公司'
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      供应商的法定全称
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='account'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>账号 *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='银行账户或其他财务账号'
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      用于财务结算的账号信息
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 联系信息 */}
            <div className='space-y-4'>
              <h4 className='text-sm font-medium'>联系信息</h4>
              
              <FormField
                control={form.control}
                name='contactPerson'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>联系人</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='如：张经理'
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='phone'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>联系电话</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='如：13812345678'
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>邮箱</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='如：contact@supplier.com'
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* 其他信息 */}
          <div className='space-y-4'>
            <h4 className='text-sm font-medium'>其他信息</h4>
            
            <FormField
              control={form.control}
              name='address'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>地址</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='供应商地址'
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='remark'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>备注</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='供应商相关备注信息'
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className='flex items-center justify-end space-x-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => router.back()}
              disabled={loading}
            >
              取消
            </Button>
            <Button type='submit' disabled={loading}>
              {loading ? '保存中...' : action}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
