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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProductSelector } from '@/components/common/product-selector';
import { PURCHASE_VALIDATION } from '@/constants/purchase';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';
import { ShoppingCart, Plus, Trash2, Calendar, Check, ChevronsUpDown } from 'lucide-react';
import * as z from 'zod';
import { formatAmount } from '@/lib/utils';

const formSchema = z.object({
  supplierId: z.string().min(1, { message: '请选择供应商' }),
  additionalCost: z.number()
    .min(PURCHASE_VALIDATION.ADDITIONAL_COST_MIN, {
      message: `附加费用不能小于${PURCHASE_VALIDATION.ADDITIONAL_COST_MIN}`
    })
    .max(PURCHASE_VALIDATION.ADDITIONAL_COST_MAX, {
      message: `附加费用不能超过${PURCHASE_VALIDATION.ADDITIONAL_COST_MAX}`
    }),
  expectedDeliveryDate: z.date().optional(),
  remark: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1, { message: '请选择产品' }),
    quantity: z.number()
      .min(PURCHASE_VALIDATION.QUANTITY_MIN, {
        message: `数量不能小于${PURCHASE_VALIDATION.QUANTITY_MIN}`
      })
      .max(PURCHASE_VALIDATION.QUANTITY_MAX, {
        message: `数量不能超过${PURCHASE_VALIDATION.QUANTITY_MAX}`
      }),
    unitPrice: z.number()
      .min(PURCHASE_VALIDATION.UNIT_PRICE_MIN, {
        message: `单价不能小于${PURCHASE_VALIDATION.UNIT_PRICE_MIN}`
      })
      .max(PURCHASE_VALIDATION.UNIT_PRICE_MAX, {
        message: `单价不能超过${PURCHASE_VALIDATION.UNIT_PRICE_MAX}`
      })
  })).min(1, { message: '至少需要添加一个采购项目' })
});

type FormValues = z.infer<typeof formSchema>;

interface PurchaseOrderFormProps {
  orderId?: string;
}

export function PurchaseOrderForm({ orderId }: PurchaseOrderFormProps) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [openSupplierSelector, setOpenSupplierSelector] = useState(false);

  const isEdit = !!orderId;
  const title = isEdit ? '编辑采购单' : '新增采购单';
  const description = isEdit ? '修改采购单信息' : '创建新的采购单';
  const toastMessage = isEdit ? '采购单更新成功' : '采购单创建成功';
  const action = isEdit ? '更新' : '创建';

  const defaultValues: FormValues = {
    supplierId: '',
    additionalCost: 0,
    expectedDeliveryDate: undefined,
    remark: '',
    items: [{ productId: '', quantity: 1, unitPrice: 0 }]
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items'
  });

  // 加载供应商数据
  useEffect(() => {
    const loadData = async () => {
      try {
        const token = await getToken();
        const suppliersResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/v1/suppliers?per_page=1000`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!suppliersResponse.ok) {
          throw new Error('获取供应商数据失败');
        }

        const suppliersData = await suppliersResponse.json();
        setSuppliers(suppliersData.data?.suppliers || []);
      } catch (error) {
        toast.error('加载供应商数据失败');
        console.error('Load suppliers error:', error);
      }
    };
    loadData();
  }, [getToken]);

  // 加载采购单数据（编辑模式）
  useEffect(() => {
    if (!orderId) return;
    
    const loadOrderData = async () => {
      try {
        const token = await getToken();
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/v1/purchase/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('获取采购单数据失败');
        }

        const data = await response.json();
        const orderData = data.data;

        // 重置表单数据
        form.reset({
          supplierId: orderData.supplier_id || '',
          additionalCost: orderData.additional_cost || 0,
          expectedDeliveryDate: orderData.expected_delivery_date ? new Date(orderData.expected_delivery_date) : undefined,
          remark: orderData.remark || '',
          items: orderData.items?.map((item: any) => ({
            productId: item.product_id,
            quantity: item.quantity,
            unitPrice: item.unit_price
          })) || [{ productId: '', quantity: 1, unitPrice: 0 }]
        });
      } catch (error) {
        console.error('Load order data error:', error);
        toast.error('加载采购单数据失败');
        router.push('/dashboard/purchase/order');
      }
    };

    loadOrderData();
  }, [orderId, getToken, form, router]);

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true);
      const token = await getToken();
      
      const requestData = {
        supplier_id: values.supplierId,
        additional_cost: values.additionalCost,
        expected_delivery_date: values.expectedDeliveryDate?.toISOString(),
        remark: values.remark,
        items: values.items.map(item => ({
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.unitPrice
        }))
      };

      let response;
      if (isEdit && orderId) {
        response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/v1/purchase/orders/${orderId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(requestData)
        });
      } else {
        response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/v1/purchase/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(requestData)
        });
      }

      if (!response.ok) {
        throw new Error('操作失败');
      }
      
      toast.success(toastMessage);
      router.push('/dashboard/purchase/order');
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(isEdit ? '更新失败，请重试' : '创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理产品选择变化
  const handleProductChange = (index: number, productId: string) => {
    // 设置产品ID
    form.setValue(`items.${index}.productId`, productId);
    
    // Note: 价格需要手动输入或从产品详情API获取
    // ProductSelector现在是实时搜索，不在此组件中维护完整产品列表
    console.log('产品已选择:', productId);
  };

  // 计算总金额
  const watchedItems = form.watch('items');
  const watchedAdditionalCost = form.watch('additionalCost');
  const subtotal = watchedItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const totalAmount = subtotal + (watchedAdditionalCost || 0);

  return (
    <div className='flex flex-col space-y-6'>
      <div className='flex items-center space-x-2'>
        <ShoppingCart className='h-6 w-6' />
        <div>
          <h3 className='text-lg font-medium'>{title}</h3>
          <p className='text-sm text-muted-foreground'>{description}</p>
        </div>
      </div>
      
      <Separator />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          {/* 基础信息 */}
          <Card>
            <CardHeader>
              <CardTitle>基础信息</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='supplierId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>供应商 *</FormLabel>
                      <Popover 
                        open={openSupplierSelector} 
                        onOpenChange={setOpenSupplierSelector}
                      >
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between"
                              disabled={loading}
                            >
                              {field.value
                                ? (() => {
                                    const selectedSupplier = suppliers.find(s => s.id === field.value);
                                    return selectedSupplier ? (
                                      <div className='flex items-center space-x-2'>
                                        <Badge variant='outline' className='text-xs'>
                                          {selectedSupplier.code}
                                        </Badge>
                                        <span>{selectedSupplier.full_name}</span>
                                      </div>
                                    ) : '选择供应商';
                                  })()
                                : "选择供应商"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="搜索供应商..." />
                            <CommandEmpty>未找到供应商</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto">
                              {suppliers.map((supplier) => (
                                <CommandItem
                                  key={supplier.id}
                                  value={`${supplier.code} ${supplier.full_name}`}
                                  onSelect={() => {
                                    field.onChange(supplier.id);
                                    setOpenSupplierSelector(false);
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      field.value === supplier.id ? "opacity-100" : "opacity-0"
                                    }`}
                                  />
                                  <div className='flex items-center space-x-2'>
                                    <Badge variant='outline' className='text-xs'>
                                      {supplier.code}
                                    </Badge>
                                    <span>{supplier.full_name}</span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='expectedDeliveryDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>预计到货日期</FormLabel>
                      <FormControl>
                        <div className='relative'>
                          <Input
                            type='date'
                            disabled={loading}
                            value={field.value ? field.value.toISOString().split('T')[0] : ''}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                          />
                          <Calendar className='absolute right-3 top-3 h-4 w-4 text-muted-foreground' />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='additionalCost'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>附加费用</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        step='0.01'
                        placeholder='如运费等额外费用'
                        disabled={loading}
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      运费、包装费等额外费用
                    </FormDescription>
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
                        placeholder='采购单相关备注信息'
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* 采购明细 */}
          <Card>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle>采购明细</CardTitle>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => append({ productId: '', quantity: 1, unitPrice: 0 })}
                  disabled={loading}
                >
                  <Plus className='h-4 w-4 mr-2' />
                  添加项目
                </Button>
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              {fields.map((field, index) => (
                <div key={field.id} className='border rounded-lg p-4 space-y-4'>
                  <div className='flex items-center justify-between'>
                    <h4 className='font-medium'>项目 {index + 1}</h4>
                    {fields.length > 1 && (
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => remove(index)}
                        disabled={loading}
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    )}
                  </div>
                  
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                    <FormField
                      control={form.control}
                      name={`items.${index}.productId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>采购SKU *</FormLabel>
                          <FormControl>
                            <ProductSelector
                              value={field.value}
                              onValueChange={(productId) => {
                                handleProductChange(index, productId);
                              }}
                              placeholder="选择产品"
                              showPrice={true}
                              productType="RAW_MATERIAL"
                              disabled={loading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>数量 *</FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              min='1'
                              disabled={loading}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.unitPrice`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>采购单价 *</FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              step='0.01'
                              min='0.01'
                              placeholder='自动带入参考采购单价'
                              disabled={loading}
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          {/* <FormDescription>
                            系统自动带入参考采购单价，可手动修改
                          </FormDescription> */}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* 显示小计 */}
                  <div className='text-right text-sm text-muted-foreground'>
                    小计: ¥{formatAmount(watchedItems[index]?.quantity * watchedItems[index]?.unitPrice || 0)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 金额汇总 */}
          <Card>
            <CardHeader>
              <CardTitle>金额汇总</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                <div className='flex justify-between'>
                  <span>商品小计:</span>
                  <span className='font-mono'>¥{formatAmount(subtotal)}</span>
                </div>
                <div className='flex justify-between'>
                  <span>附加费用:</span>
                  <span className='font-mono'>¥{formatAmount(watchedAdditionalCost || 0)}</span>
                </div>
                <Separator />
                <div className='flex justify-between text-lg font-medium'>
                  <span>总金额:</span>
                  <span className='font-mono text-primary'>¥{formatAmount(totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

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
