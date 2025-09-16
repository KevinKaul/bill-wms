"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PURCHASE_VALIDATION } from "@/constants/purchase";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ClipboardList, Plus, Trash2, Calendar } from "lucide-react";
import * as z from "zod";

const formSchema = z.object({
  title: z
    .string()
    .min(PURCHASE_VALIDATION.TITLE_MIN_LENGTH, {
      message: `标题不能少于${PURCHASE_VALIDATION.TITLE_MIN_LENGTH}个字符`,
    })
    .max(PURCHASE_VALIDATION.TITLE_MAX_LENGTH, {
      message: `标题不能超过${PURCHASE_VALIDATION.TITLE_MAX_LENGTH}个字符`,
    }),
  description: z.string().optional(),
  planDate: z.date({ required_error: "请选择计划日期" }),
  expectedExecutionDate: z.date().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, { message: "请选择产品" }),
        plannedQuantity: z
          .number()
          .min(PURCHASE_VALIDATION.QUANTITY_MIN, {
            message: `计划数量不能小于${PURCHASE_VALIDATION.QUANTITY_MIN}`,
          })
          .max(PURCHASE_VALIDATION.QUANTITY_MAX, {
            message: `计划数量不能超过${PURCHASE_VALIDATION.QUANTITY_MAX}`,
          }),
        estimatedUnitPrice: z
          .number()
          .min(PURCHASE_VALIDATION.UNIT_PRICE_MIN, {
            message: `预估单价不能小于${PURCHASE_VALIDATION.UNIT_PRICE_MIN}`,
          })
          .max(PURCHASE_VALIDATION.UNIT_PRICE_MAX, {
            message: `预估单价不能超过${PURCHASE_VALIDATION.UNIT_PRICE_MAX}`,
          }),
        remark: z.string().optional(),
      })
    )
    .min(1, { message: "至少需要添加一个采购项目" }),
});

type FormValues = z.infer<typeof formSchema>;

interface PurchasePlanFormProps {
  planId?: string; // 采购计划ID，用于编辑模式
  initialData?: any; // 简化处理
}

export function PurchasePlanForm({ planId, initialData }: PurchasePlanFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [planData, setPlanData] = useState<any>(null);

  const isEdit = !!planId;
  const title = isEdit ? "编辑采购计划" : "新增采购计划";
  const description = isEdit ? "修改采购计划信息" : "创建新的采购计划";
  const toastMessage = isEdit ? "采购计划更新成功" : "采购计划创建成功";
  const action = isEdit ? "更新" : "创建";

  const currentData = planData || initialData;
  
  const defaultValues: FormValues = {
    title: currentData?.title || "",
    description: currentData?.remark || "",
    planDate: currentData?.created_at
      ? new Date(currentData.created_at)
      : new Date(),
    expectedExecutionDate: currentData?.executed_at
      ? new Date(currentData.executed_at)
      : undefined,
    items: currentData?.items?.map((item: any) => ({
      productId: item.product_id,
      plannedQuantity: item.quantity,
      estimatedUnitPrice: item.estimated_unit_price,
      remark: item.remark || "",
    })) || [
      {
        productId: "",
        plannedQuantity: 1,
        estimatedUnitPrice: 0,
        remark: "",
      },
    ],
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // 加载采购计划数据（编辑模式）
  useEffect(() => {
    const fetchPlanData = async () => {
      if (!planId) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/v1/purchase/plans/${planId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setPlanData(result.data);
            // 重置表单数据
            const data = result.data;
            form.reset({
              title: data.title || "",
              description: data.remark || "",
              planDate: data.created_at ? new Date(data.created_at) : new Date(),
              expectedExecutionDate: data.executed_at ? new Date(data.executed_at) : undefined,
              items: data.items?.map((item: any) => ({
                productId: item.product_id,
                plannedQuantity: item.quantity,
                estimatedUnitPrice: item.estimated_unit_price,
                remark: item.remark || "",
              })) || [{
                productId: "",
                plannedQuantity: 1,
                estimatedUnitPrice: 0,
                remark: "",
              }],
            });
          }
        }
      } catch (error) {
        console.error('获取采购计划详情失败:', error);
        toast.error('获取采购计划详情失败');
      } finally {
        setLoading(false);
      }
    };

    fetchPlanData();
  }, [planId, form]);

  // 加载产品数据
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/v1/products');
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setProducts(result.data.products || []);
          }
        }
      } catch (error) {
        console.error('获取产品列表失败:', error);
      }
    };

    fetchProducts();
  }, []);

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true);

      const requestData = {
        title: values.title,
        remark: values.description,
        items: values.items.map(item => ({
          productId: item.productId,
          quantity: item.plannedQuantity,
          estimatedUnitPrice: item.estimatedUnitPrice,
          remark: item.remark
        }))
      };

      let response;
      if (isEdit && planId) {
        response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/v1/purchase/plans/${planId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData)
        });
      } else {
        response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/v1/purchase/plans`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData)
        });
      }

      if (!response.ok) {
        throw new Error('操作失败');
      }

      toast.success(toastMessage);
      router.push("/dashboard/purchase/plan");
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(isEdit ? "更新失败，请重试" : "创建失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  // 计算总预估金额
  const watchedItems = form.watch("items");
  const totalEstimated = watchedItems.reduce(
    (sum, item) => sum + item.plannedQuantity * item.estimatedUnitPrice,
    0
  );

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center space-x-2">
        <ClipboardList className="h-6 w-6" />
        <div>
          <h3 className="text-lg font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <Separator />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* 基础信息 */}
          <Card>
            <CardHeader>
              <CardTitle>基础信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>计划标题 *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="输入采购计划标题"
                          disabled={loading}
                          {...field}
                        />
                      </FormControl>
                      {/* <FormDescription>
                        简洁明了的计划标题，便于识别和管理
                      </FormDescription> */}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="planDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>计划日期 *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="date"
                            disabled={loading}
                            value={
                              field.value
                                ? field.value.toISOString().split("T")[0]
                                : ""
                            }
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? new Date(e.target.value)
                                  : undefined
                              )
                            }
                          />
                          <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="expectedExecutionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>预计执行日期</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="date"
                          disabled={loading}
                          value={
                            field.value
                              ? field.value.toISOString().split("T")[0]
                              : ""
                          }
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? new Date(e.target.value)
                                : undefined
                            )
                          }
                        />
                        <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      </div>
                    </FormControl>
                    <FormDescription>预计开始执行采购的日期</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>计划描述</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="详细描述采购计划的目的、背景等"
                        disabled={loading}
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      可选的详细描述，说明采购计划的背景和目的
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* 采购明细 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>采购明细</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      productId: "",
                      plannedQuantity: 1,
                      estimatedUnitPrice: 0,
                      remark: "",
                    })
                  }
                  disabled={loading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  添加项目
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">项目 {index + 1}</h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <FormField
                      control={form.control}
                      name={`items.${index}.productId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>产品 *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="选择产品" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  <div className="flex items-center space-x-2">
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
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
                      name={`items.${index}.plannedQuantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>计划数量 *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              disabled={loading}
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 1)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.estimatedUnitPrice`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>预估单价 *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0.01"
                              disabled={loading}
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                  </div>

                  <FormField
                    control={form.control}
                    name={`items.${index}.remark`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>备注</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="项目备注信息"
                            disabled={loading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 显示小计 */}
                  <div className="text-right text-sm text-muted-foreground">
                    预估小计: ¥
                    {(
                      watchedItems[index]?.plannedQuantity *
                        watchedItems[index]?.estimatedUnitPrice || 0
                    ).toFixed(2)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 金额汇总 */}
          <Card>
            <CardHeader>
              <CardTitle>预估金额汇总</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>项目数量:</span>
                  <span className="font-mono">{watchedItems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>总计划数量:</span>
                  <span className="font-mono">
                    {watchedItems.reduce(
                      (sum, item) => sum + item.plannedQuantity,
                      0
                    )}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-medium">
                  <span>预估总金额:</span>
                  <span className="font-mono text-primary">
                    ¥{totalEstimated.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "保存中..." : action}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
