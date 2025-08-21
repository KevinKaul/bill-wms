'use client';

import { FileUploader } from '@/components/file-uploader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ProductFormData, ProductType } from '@/types/product';
import { PRODUCT_TYPE_OPTIONS, PRODUCT_VALIDATION } from '@/constants/product';
import { fakeProductsApi } from '@/lib/mock-products';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Package } from 'lucide-react';
import * as z from 'zod';

const MAX_FILE_SIZE = 5000000;

const formSchema = z.object({
  sku: z.string()
    .min(PRODUCT_VALIDATION.SKU_MIN_LENGTH, {
      message: `SKU至少需要${PRODUCT_VALIDATION.SKU_MIN_LENGTH}个字符`
    })
    .max(PRODUCT_VALIDATION.SKU_MAX_LENGTH, {
      message: `SKU不能超过${PRODUCT_VALIDATION.SKU_MAX_LENGTH}个字符`
    }),
  name: z.string()
    .min(PRODUCT_VALIDATION.NAME_MIN_LENGTH, {
      message: `产品名称至少需要${PRODUCT_VALIDATION.NAME_MIN_LENGTH}个字符`
    }),
  type: z.nativeEnum(ProductType, {
    required_error: '请选择产品类型'
  }),
  image: z.any().optional(),
  referencePurchasePrice: z.number().optional(),
  guidancePrice: z.number().optional()
});

type FormValues = z.infer<typeof formSchema>;

interface ProductFormProps {
  initialData?: ProductFormData | null;
  pageTitle: string;
  isEdit?: boolean;
}

export default function ProductForm({
  initialData,
  pageTitle,
  isEdit = false
}: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const defaultValues: Partial<FormValues> = {
    sku: initialData?.sku || '',
    name: initialData?.name || '',
    type: initialData?.type || ProductType.RAW_MATERIAL,
    referencePurchasePrice: initialData?.referencePurchasePrice,
    guidancePrice: initialData?.guidancePrice
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const watchedType = form.watch('type');

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true);
      // TODO: 实现API调用保存产品数据
      await fakeProductsApi.createProduct(values);
      toast.success(isEdit ? '产品更新成功' : '产品创建成功');
      router.push('/dashboard/product');
    } catch (error) {
      toast.error(isEdit ? '更新失败，请重试' : '创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>
          {pageTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
            <div className='space-y-6'>
              <div className='flex items-center gap-2'>
                <Package className='h-5 w-5' />
                <h3 className='text-lg font-medium'>基础信息</h3>
              </div>
              
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='sku'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder='例如: RM001, FP001' 
                          {...field}
                          className='font-mono'
                        />
                      </FormControl>
                      <FormDescription>
                        产品唯一标识符，建议原材料以RM开头，组合产品以FP开头
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
                      <FormLabel>产品名称 *</FormLabel>
                      <FormControl>
                        <Input placeholder='输入产品名称' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='type'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>产品类型 *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='选择产品类型' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRODUCT_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className='flex flex-col'>
                              <span>{option.label}</span>
                              <span className='text-xs text-muted-foreground'>
                                {option.description}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='image'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>产品图片</FormLabel>
                    <FormControl>
                      <FileUploader
                        value={field.value}
                        onValueChange={field.onChange}
                        maxFiles={1}
                        maxSize={MAX_FILE_SIZE}
                        accept={{
                          'image/jpeg': ['.jpg', '.jpeg'],
                          'image/png': ['.png'],
                          'image/webp': ['.webp']
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      支持 JPG、PNG、WebP 格式，最大 5MB
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className='space-y-6'>
              <h3 className='text-lg font-medium'>价格信息</h3>
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                {watchedType === ProductType.RAW_MATERIAL && (
                  <FormField
                    control={form.control}
                    name='referencePurchasePrice'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>参考采购单价</FormLabel>
                        <FormControl>
                          <div className='relative'>
                            <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>
                              ¥
                            </span>
                            <Input
                              type='number'
                              step='0.01'
                              placeholder='0.00'
                              className='pl-8'
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          用作创建采购单时的默认参考价格
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {watchedType === ProductType.FINISHED_PRODUCT && (
                  <FormField
                    control={form.control}
                    name='guidancePrice'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>指导单价</FormLabel>
                        <FormControl>
                          <div className='relative'>
                            <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>
                              ¥
                            </span>
                            <Input
                              type='number'
                              step='0.01'
                              placeholder='0.00'
                              className='pl-8'
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          建议销售价格或内部核算价格
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            <Separator />

            <div className='flex justify-end gap-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => router.back()}
                disabled={loading}
              >
                取消
              </Button>
              <Button type='submit' disabled={loading}>
                {loading ? '保存中...' : (isEdit ? '更新产品' : '创建产品')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
