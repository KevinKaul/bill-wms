'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { PRODUCTION_VALIDATION, COMMON_PROCESSING_FEES } from '@/constants/production';
import { ProductionOrderFormData, MaterialRequirement } from '@/types/production';
import { fakeProductionApi } from '@/lib/mock-production';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const productionOrderSchema = z.object({
  productId: z.string().min(1, '请选择产品'),
  plannedQuantity: z.number()
    .min(PRODUCTION_VALIDATION.QUANTITY_MIN + 1, '生产数量必须大于0')
    .max(PRODUCTION_VALIDATION.QUANTITY_MAX, `生产数量不能超过${PRODUCTION_VALIDATION.QUANTITY_MAX}`),
  supplierId: z.string().optional(),
  processingFee: z.number()
    .min(PRODUCTION_VALIDATION.PROCESSING_FEE_MIN, '加工费用不能小于0')
    .max(PRODUCTION_VALIDATION.PROCESSING_FEE_MAX, `加工费用不能超过${PRODUCTION_VALIDATION.PROCESSING_FEE_MAX}`),
  remark: z.string()
    .max(PRODUCTION_VALIDATION.REMARK_MAX_LENGTH, `备注不能超过${PRODUCTION_VALIDATION.REMARK_MAX_LENGTH}个字符`)
    .optional()
});

interface ProductionOrderFormProps {
  initialData?: Partial<ProductionOrderFormData>;
}

// 模拟产品数据（只包含成品）
const mockFinishedProducts = [
  { id: '3', sku: 'FIN001', name: '成品A' },
  { id: '4', sku: 'FIN002', name: '成品B' }
];

// 模拟供应商数据
const mockSuppliers = [
  { id: 'SUP001', name: '加工厂A' },
  { id: 'SUP002', name: '加工厂B' },
  { id: 'SUP003', name: '加工厂C' }
];

export function ProductionOrderForm({ initialData }: ProductionOrderFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [materialRequirements, setMaterialRequirements] = useState<MaterialRequirement[]>([]);
  const [canProduce, setCanProduce] = useState(false);
  const [maxProducibleQuantity, setMaxProducibleQuantity] = useState(0);
  const [checkingMaterials, setCheckingMaterials] = useState(false);

  const form = useForm<ProductionOrderFormData>({
    resolver: zodResolver(productionOrderSchema),
    defaultValues: {
      productId: initialData?.productId || '',
      plannedQuantity: initialData?.plannedQuantity || 1,
      supplierId: initialData?.supplierId || '',
      processingFee: initialData?.processingFee || 0,
      remark: initialData?.remark || ''
    }
  });

  const watchedProductId = form.watch('productId');
  const watchedQuantity = form.watch('plannedQuantity');

  // 当产品或数量变化时，重新计算物料需求
  useEffect(() => {
    const checkMaterialRequirements = async () => {
      if (!watchedProductId || !watchedQuantity || watchedQuantity <= 0) {
        setMaterialRequirements([]);
        setCanProduce(false);
        setMaxProducibleQuantity(0);
        return;
      }

      setCheckingMaterials(true);
      try {
        const response = await fakeProductionApi.getMaterialRequirements(
          watchedProductId, 
          watchedQuantity
        );
        
        setMaterialRequirements(response.requirements);
        setCanProduce(response.canProduce);
        setMaxProducibleQuantity(response.maxProducibleQuantity);
      } catch (error) {
        console.error('检查物料需求失败:', error);
        setMaterialRequirements([]);
        setCanProduce(false);
        setMaxProducibleQuantity(0);
      } finally {
        setCheckingMaterials(false);
      }
    };

    const timeoutId = setTimeout(checkMaterialRequirements, 300);
    return () => clearTimeout(timeoutId);
  }, [watchedProductId, watchedQuantity]);

  const onSubmit = async (data: ProductionOrderFormData) => {
    if (!canProduce && materialRequirements.length > 0) {
      toast.error('物料库存不足，无法创建加工单');
      return;
    }

    setLoading(true);
    try {
      await fakeProductionApi.createProductionOrder(data);
      toast.success('加工单创建成功');
      router.push('/dashboard/production/order');
    } catch (error) {
      toast.error('创建加工单失败');
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = mockFinishedProducts.find(p => p.id === watchedProductId);

  // 计算物料总成本
  const totalMaterialCost = materialRequirements.reduce((total, req) => {
    // 模拟单价计算
    const unitCost = req.materialSku === 'RAW001' ? 15.75 : 26.5;
    return total + (req.requiredQuantity * unitCost);
  }, 0);

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>创建加工单</CardTitle>
          <CardDescription>
            选择成品和生产数量，系统将自动计算物料需求
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              {/* 基础信息 */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <FormField
                  control={form.control}
                  name='productId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>选择成品 *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='请选择要生产的成品' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {mockFinishedProducts.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              <div className='flex items-center gap-2'>
                                <Badge variant='outline' className='font-mono text-xs'>
                                  {product.sku}
                                </Badge>
                                <span>{product.name}</span>
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
                  name='plannedQuantity'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>计划生产数量 *</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          placeholder='请输入生产数量'
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                      {maxProducibleQuantity > 0 && (
                        <p className='text-xs text-muted-foreground'>
                          当前库存最多可生产 {maxProducibleQuantity} 个
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='supplierId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>加工供应商</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='请选择加工供应商（可选）' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {mockSuppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
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
                  name='processingFee'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>加工费用</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          step='0.01'
                          placeholder='请输入加工费用'
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                      <div className='flex flex-wrap gap-1 mt-2'>
                        {COMMON_PROCESSING_FEES.map((fee) => (
                          <Button
                            key={fee.value}
                            type='button'
                            variant='outline'
                            size='sm'
                            className='text-xs'
                            onClick={() => form.setValue('processingFee', fee.value)}
                          >
                            {fee.label}
                          </Button>
                        ))}
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='remark'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>备注</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='请输入备注信息（可选）'
                        className='resize-none'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='flex justify-end gap-4'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => router.back()}
                >
                  取消
                </Button>
                <Button 
                  type='submit' 
                  disabled={loading || (!canProduce && materialRequirements.length > 0)}
                >
                  {loading ? '创建中...' : '创建加工单'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* 物料需求分析 */}
      {selectedProduct && (
        <Card>
          <CardHeader>
            <CardTitle>物料需求分析</CardTitle>
            <CardDescription>
              基于产品BOM计算的物料需求情况
            </CardDescription>
          </CardHeader>
          <CardContent>
            {checkingMaterials ? (
              <div className='flex items-center justify-center py-8'>
                <div className='text-sm text-muted-foreground'>计算物料需求中...</div>
              </div>
            ) : materialRequirements.length > 0 ? (
              <div className='space-y-4'>
                {/* 生产状态提示 */}
                <Alert className={canProduce ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                  <div className='flex items-center gap-2'>
                    {canProduce ? (
                      <CheckCircle className='h-4 w-4 text-green-600' />
                    ) : (
                      <XCircle className='h-4 w-4 text-red-600' />
                    )}
                    <AlertDescription className={canProduce ? 'text-green-800' : 'text-red-800'}>
                      {canProduce 
                        ? `物料库存充足，可以生产 ${watchedQuantity} 个${selectedProduct.name}`
                        : `物料库存不足，无法生产 ${watchedQuantity} 个${selectedProduct.name}`
                      }
                    </AlertDescription>
                  </div>
                </Alert>

                {/* 物料需求表格 */}
                <div className='border rounded-lg'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>物料信息</TableHead>
                        <TableHead className='text-right'>需要数量</TableHead>
                        <TableHead className='text-right'>可用库存</TableHead>
                        <TableHead className='text-right'>缺口数量</TableHead>
                        <TableHead>状态</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materialRequirements.map((req) => {
                        const isShortfall = req.shortfall > 0;
                        return (
                          <TableRow key={req.materialId}>
                            <TableCell>
                              <div className='flex flex-col gap-1'>
                                <Badge variant='outline' className='font-mono text-xs w-fit'>
                                  {req.materialSku}
                                </Badge>
                                <span className='text-sm'>{req.materialName}</span>
                              </div>
                            </TableCell>
                            <TableCell className='text-right font-medium'>
                              {req.requiredQuantity.toLocaleString()}
                            </TableCell>
                            <TableCell className='text-right'>
                              {req.availableQuantity.toLocaleString()}
                            </TableCell>
                            <TableCell className='text-right'>
                              {isShortfall ? (
                                <span className='text-red-600 font-medium'>
                                  {req.shortfall.toLocaleString()}
                                </span>
                              ) : (
                                <span className='text-green-600'>0</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant='secondary'
                                className={isShortfall 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-green-100 text-green-800'
                                }
                              >
                                {isShortfall ? '库存不足' : '库存充足'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* 成本预估 */}
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t'>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-blue-600'>
                      ¥{totalMaterialCost.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className='text-sm text-muted-foreground'>预估物料成本</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-green-600'>
                      ¥{form.watch('processingFee').toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className='text-sm text-muted-foreground'>加工费用</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-purple-600'>
                      ¥{(totalMaterialCost + form.watch('processingFee')).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className='text-sm text-muted-foreground'>预估总成本</div>
                  </div>
                </div>
              </div>
            ) : watchedProductId ? (
              <Alert>
                <AlertTriangle className='h-4 w-4' />
                <AlertDescription>
                  该产品暂无BOM配置，无法计算物料需求
                </AlertDescription>
              </Alert>
            ) : (
              <div className='text-center py-8 text-muted-foreground'>
                请先选择要生产的成品
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
