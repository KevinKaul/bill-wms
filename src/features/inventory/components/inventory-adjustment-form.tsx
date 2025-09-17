'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { INVENTORY_VALIDATION, ADJUSTMENT_TYPE_OPTIONS, COMMON_ADJUSTMENT_REASONS } from '@/constants/inventory';
import { InventoryAdjustmentFormData } from '@/types/inventory';
import { createClientApi } from '@/lib/client-api';

const adjustmentSchema = z.object({
  productId: z.string().min(1, '请选择产品'),
  adjustmentType: z.enum(['increase', 'decrease'], {
    required_error: '请选择调整类型'
  }),
  quantity: z.number()
    .min(INVENTORY_VALIDATION.QUANTITY_MIN + 1, '调整数量必须大于0')
    .max(INVENTORY_VALIDATION.QUANTITY_MAX, `调整数量不能超过${INVENTORY_VALIDATION.QUANTITY_MAX}`),
  unitCost: z.number()
    .min(0, '单位成本不能为负数')
    .max(INVENTORY_VALIDATION.UNIT_COST_MAX, `单位成本不能超过${INVENTORY_VALIDATION.UNIT_COST_MAX}`),
  reason: z.string()
    .min(INVENTORY_VALIDATION.REASON_MIN_LENGTH, `调整原因至少${INVENTORY_VALIDATION.REASON_MIN_LENGTH}个字符`)
    .max(INVENTORY_VALIDATION.REASON_MAX_LENGTH, `调整原因不能超过${INVENTORY_VALIDATION.REASON_MAX_LENGTH}个字符`),
  remark: z.string().max(500, '备注不能超过500个字符').optional()
});

interface InventoryAdjustmentFormProps {
  productId?: string;
  batchId?: string;
  defaultType?: 'increase' | 'decrease';
}

interface Product {
  id: string;
  sku: string;
  name: string;
}

interface InventoryInfo {
  totalQuantity: number;
  totalValue: number;
  avgUnitCost: number;
  batchCount: number;
}

export function InventoryAdjustmentForm({ productId, defaultType }: InventoryAdjustmentFormProps) {
  const router = useRouter();
  const { getToken, isSignedIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentInventory, setCurrentInventory] = useState<InventoryInfo | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingInventory, setLoadingInventory] = useState(false);

  const form = useForm<InventoryAdjustmentFormData>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      productId: productId || '',
      adjustmentType: defaultType || 'increase',
      quantity: 1,
      unitCost: 0,
      reason: '',
      remark: ''
    }
  });

  const watchedProductId = form.watch('productId');
  const watchedAdjustmentType = form.watch('adjustmentType');

  // 加载产品列表
  const loadProducts = useCallback(async () => {
    if (!isSignedIn) return;

    try {
      setLoadingProducts(true);
      const clientApi = createClientApi(getToken);
      const response = await clientApi.products.getProducts({
        pageSize: 100, // 获取所有产品
      });

      if (response.success && response.data) {
        const data = response.data as any;
        const productList = (data.products || []).map((product: any) => ({
          id: product.id,
          sku: product.sku,
          name: product.name
        }));
        setProducts(productList);
      } else {
        toast.error('获取产品列表失败');
      }
    } catch (error) {
      console.error('加载产品失败:', error);
      toast.error('获取产品列表失败');
    } finally {
      setLoadingProducts(false);
    }
  }, [getToken, isSignedIn]);

  // 加载库存信息
  const loadInventoryInfo = useCallback(async (productId: string) => {
    if (!isSignedIn || !productId) return;

    try {
      setLoadingInventory(true);
      const clientApi = createClientApi(getToken);
      const response = await clientApi.inventory.getInventoryOverview({
        limit: 1,
        search: productId, // 使用产品ID搜索
      });

      if (response.success && response.data) {
        const data = response.data as any;
        const inventoryItems = data.data || [];
        
        if (inventoryItems.length > 0) {
          const item = inventoryItems[0];
          setCurrentInventory({
            totalQuantity: Number(item.quantity || 0),
            totalValue: Number(item.total_cost || 0),
            avgUnitCost: Number(item.unit_cost || 0),
            batchCount: Number(item.batch_count || 0)
          });
        } else {
          setCurrentInventory({
            totalQuantity: 0,
            totalValue: 0,
            avgUnitCost: 0,
            batchCount: 0
          });
        }
      }
    } catch (error) {
      console.error('加载库存信息失败:', error);
      setCurrentInventory(null);
    } finally {
      setLoadingInventory(false);
    }
  }, [getToken, isSignedIn]);

  // 初始化加载产品列表
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // 当选择的产品改变时，加载库存信息
  useEffect(() => {
    if (watchedProductId) {
      loadInventoryInfo(watchedProductId);
    } else {
      setCurrentInventory(null);
    }
  }, [watchedProductId, loadInventoryInfo]);

  const onSubmit = async (data: InventoryAdjustmentFormData) => {
    setLoading(true);
    try {
      // 验证减少库存时的数量限制
      if (data.adjustmentType === 'decrease' && currentInventory) {
        if (data.quantity > currentInventory.totalQuantity) {
          toast.error(`调整数量不能超过当前库存数量 ${currentInventory.totalQuantity}`);
          setLoading(false);
          return;
        }
      }

      // 增加库存时必须提供单位成本
      if (data.adjustmentType === 'increase' && (!data.unitCost || data.unitCost <= 0)) {
        toast.error('增加库存时必须提供单位成本');
        setLoading(false);
        return;
      }

      // 调用真实API
      const clientApi = createClientApi(getToken);
      const response = await clientApi.inventory.createAdjustment({
        product_id: data.productId,
        type: data.adjustmentType,
        quantity: data.quantity,
        unit_cost: data.unitCost,
        reason: data.reason,
        remark: data.remark
      });

      if (response.success) {
        toast.success('库存调整成功');
        router.push('/dashboard/inventory/movement');
      } else {
        toast.error(response.error?.message || '库存调整失败');
      }
    } catch (error) {
      console.error('库存调整失败:', error);
      toast.error('库存调整失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='space-y-6 min-h-0'>
      <Card>
        <CardHeader>
          <CardTitle>库存调整</CardTitle>
          <CardDescription>
            调整产品库存数量，支持增加或减少库存
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              {/* 产品选择 */}
              <FormField
                control={form.control}
                name='productId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>选择产品 *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='请选择要调整的产品' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {loadingProducts ? (
                          <SelectItem value="loading" disabled>
                            加载产品中...
                          </SelectItem>
                        ) : products.length === 0 ? (
                          <SelectItem value="empty" disabled>
                            暂无产品数据
                          </SelectItem>
                        ) : (
                          products.map((product: Product) => (
                            <SelectItem key={product.id} value={product.id}>
                              <div className='flex items-center gap-2'>
                                <Badge variant='outline' className='font-mono text-xs'>
                                  {product.sku}
                                </Badge>
                                <span>{product.name}</span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 当前库存信息 */}
              {watchedProductId && (
                <Card className='bg-muted/50'>
                  <CardContent className='pt-6'>
                    {loadingInventory ? (
                      <div className='text-center py-4'>
                        <div className='text-sm text-muted-foreground'>加载库存信息中...</div>
                      </div>
                    ) : currentInventory ? (
                      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                        <div>
                          <div className='text-sm text-muted-foreground'>当前库存</div>
                          <div className='text-lg font-semibold'>
                            {currentInventory.totalQuantity.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className='text-sm text-muted-foreground'>库存价值</div>
                          <div className='text-lg font-semibold'>
                            ¥{currentInventory.totalValue.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                        <div>
                          <div className='text-sm text-muted-foreground'>平均成本</div>
                          <div className='text-lg font-semibold'>
                            ¥{currentInventory.avgUnitCost.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className='text-sm text-muted-foreground'>批次数量</div>
                          <div className='text-lg font-semibold'>
                            {currentInventory.batchCount}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className='text-center py-4'>
                        <div className='text-sm text-muted-foreground'>暂无库存信息</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Separator />

              {/* 调整类型 */}
              <FormField
                control={form.control}
                name='adjustmentType'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>调整类型 *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ADJUSTMENT_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 调整数量 */}
              <FormField
                control={form.control}
                name='quantity'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>调整数量 *</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min={1}
                        max={watchedAdjustmentType === 'decrease' && currentInventory ? currentInventory.totalQuantity : INVENTORY_VALIDATION.QUANTITY_MAX}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    {watchedAdjustmentType === 'decrease' && currentInventory && (
                      <div className='text-sm text-muted-foreground'>
                        最大可减少数量: {currentInventory.totalQuantity.toLocaleString()}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 单位成本（仅增加库存时显示） */}
              {watchedAdjustmentType === 'increase' && (
                <FormField
                  control={form.control}
                  name='unitCost'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>单位成本 *</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          step='0.01'
                          min={INVENTORY_VALIDATION.UNIT_COST_MIN}
                          max={INVENTORY_VALIDATION.UNIT_COST_MAX}
                          placeholder={currentInventory ? `参考成本: ¥${currentInventory.avgUnitCost.toFixed(2)}` : '请输入单位成本'}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* 调整原因 */}
              <FormField
                control={form.control}
                name='reason'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>调整原因 *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='请选择调整原因' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COMMON_ADJUSTMENT_REASONS.map((reason) => (
                          <SelectItem key={reason} value={reason}>
                            {reason}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 备注 */}
              <FormField
                control={form.control}
                name='remark'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>备注</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='请输入调整备注（可选）'
                        className='resize-none'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 调整预览 */}
              {watchedProductId && currentInventory && (
                <Card className='border-blue-200'>
                  <CardContent className=''>
              
                    <div className='grid grid-cols-3 gap-4 text-sm text-blue-700'>
                      <div>
                        <div className='text-blue-700'>调整前数量</div>
                        <div className='font-semibold'>{currentInventory.totalQuantity.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className='text-blue-700'>调整数量</div>
                        <div className='font-semibold'>
                          {watchedAdjustmentType === 'increase' ? '+' : '-'}{form.watch('quantity') || 0}
                        </div>
                      </div>
                      <div>
                        <div className='text-blue-700'>调整后数量</div>
                        <div className='font-semibold'>
                          {watchedAdjustmentType === 'increase' 
                            ? currentInventory.totalQuantity + (form.watch('quantity') || 0)
                            : currentInventory.totalQuantity - (form.watch('quantity') || 0)
                          }
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className='flex gap-4'>
                <Button type='submit' disabled={loading}>
                  {loading ? '调整中...' : '确认调整'}
                </Button>
                <Button type='button' variant='outline' onClick={() => router.back()}>
                  取消
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
