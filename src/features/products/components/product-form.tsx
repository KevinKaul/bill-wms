"use client";

import { FileUploader } from "@/components/file-uploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NextImage from "next/image";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import { ProductSelector } from "@/components/common/product-selector";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ProductType } from "@/types/product";
import { PRODUCT_TYPE_OPTIONS } from "@/constants/product";
import { createClientApi } from "@/lib/client-api";
import { useAuth } from "@clerk/nextjs";
import { productFormSchema, ProductFormData } from "@/lib/product-validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Package, Plus, Trash2, Settings2 } from "lucide-react";
import { formatAmount } from "@/lib/utils";
const MAX_FILE_SIZE = 5000000;

type FormValues = ProductFormData;

interface ProductFormProps {
  initialData?: ProductFormData | null;
  pageTitle: string;
  isEdit?: boolean;
}

export default function ProductForm({
  initialData,
  pageTitle,
  isEdit = false,
}: ProductFormProps) {
  const router = useRouter();
  const { getToken } = useAuth();
  const clientApi = createClientApi(getToken);
  const [loading, setLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdProductName, setCreatedProductName] = useState("");
  const [rawMaterials, setRawMaterials] = useState<
    Array<{
      id: string;
      sku: string;
      name: string;
      type: 'RAW_MATERIAL' | 'FINISHED_PRODUCT';
      reference_purchase_price?: number;
      referencePurchasePrice?: number;
    }>
  >([]);
  const [isClient, setIsClient] = useState(false);

  const defaultValues: Partial<FormValues> = {
    sku: initialData?.sku || "",
    name: initialData?.name || "",
    description: initialData?.description || "",
    type: initialData?.type || ProductType.RAW_MATERIAL,
    referencePurchasePrice: initialData?.referencePurchasePrice,
    guidancePrice: initialData?.guidancePrice,
    bomItems: initialData?.bomItems || [],
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
    mode: "onChange", // 添加mode以便实时验证
  });

  const watchedType = form.watch("type");
  const watchedBomItems = form.watch("bomItems") || [];

  // 监控表单验证状态
  const formState = form.formState;

  // 在客户端显示表单错误
  useEffect(() => {
    if (isClient && Object.keys(formState.errors).length > 0) {
      console.log("表单验证错误:", formState.errors);
      // 显示第一个错误
      const firstError = Object.values(formState.errors)[0];
      if (firstError?.message) {
        toast.error(`表单验证失败: ${firstError.message}`);
      }
    }
  }, [formState.errors, isClient]);

  // 使用 useFieldArray 管理 BOM 项
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "bomItems",
  });

  // 计算组合产品的指导单价（基于BOM成本）
  const calculateGuidancePrice = (): number => {
    if (
      watchedType !== ProductType.FINISHED_PRODUCT ||
      !watchedBomItems.length
    ) {
      return 0;
    }

    return watchedBomItems.reduce((total: number, bomItem: any) => {
      if (!bomItem.componentId || !bomItem.quantity) return total;

      const material = rawMaterials.find((m) => m.id === bomItem.componentId);
      const materialPrice = material?.referencePurchasePrice || 0;

      return total + materialPrice * Number(bomItem.quantity);
    }, 0);
  };

  const calculatedGuidancePrice = calculateGuidancePrice();

  // 标记客户端已挂载，避免hydration问题
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 在编辑模式下重置表单值
  useEffect(() => {
    if (isEdit && initialData) {
      const resetData = {
        sku: initialData.sku || "",
        name: initialData.name || "",
        description: initialData.description || "",
        type: initialData.type || ProductType.RAW_MATERIAL,
        referencePurchasePrice: initialData.referencePurchasePrice,
        guidancePrice: initialData.guidancePrice,
        bomItems: initialData.bomItems || [],
      };
      console.log("重置表单数据:", resetData);
      form.reset(resetData);
    }
  }, [isEdit, initialData, form]);

  // 获取原材料列表
  useEffect(() => {
    const fetchRawMaterials = async () => {
      try {
        const response = await clientApi.products.getProducts({
          type: ProductType.RAW_MATERIAL,
          pageSize: 100, // 获取足够多的原材料
        });
        if (response.success && response.data) {
          const productsData = response.data as {
            products: Array<{
              id: string;
              sku: string;
              name: string;
              reference_purchase_price?: number;
            }>;
          };
          setRawMaterials(
            productsData.products.map((p) => ({
              id: p.id,
              sku: p.sku,
              name: p.name,
              type: 'RAW_MATERIAL' as const,
              reference_purchase_price: p.reference_purchase_price,
              referencePurchasePrice: p.reference_purchase_price,
            }))
          );
        }
      } catch (error) {
        console.error("获取原材料列表失败:", error);
      }
    };

    fetchRawMaterials();
  }, []);

  // 添加BOM项
  const addBOMItem = () => {
    append({ componentId: "", quantity: 1 });
  };

  // 删除BOM项
  const removeBOMItem = (index: number) => {
    remove(index);
  };

  const onSubmit = async (values: FormValues) => {
    console.log("提交开始 - 表单值:", values);
    console.log("表单是否有效:", formState.isValid);
    console.log("表单错误:", formState.errors);

    // 组合产品特殊检查
    if (values.type === ProductType.FINISHED_PRODUCT) {
      if (!values.bomItems || values.bomItems.length === 0) {
        toast.error("组合产品必须至少添加一个原材料");
        return;
      }
      
      // 检查每个BOM项是否完整
      const invalidBomItems = values.bomItems.filter(
        item => !item.componentId || !item.quantity
      );
      
      if (invalidBomItems.length > 0) {
        toast.error("存在不完整的BOM项，请检查原材料和数量");
        return;
      }
    }

    try {
      setLoading(true);

      // 处理图片URL
      let imageUrl = null;

      if (
        values.image &&
        Array.isArray(values.image) &&
        values.image.length > 0
      ) {
        const imageFile = values.image[0];

        // 检查是否是File对象(新上传的文件)还是字符串(已有的URL)
        if (
          imageFile &&
          typeof imageFile === "object" &&
          imageFile instanceof File
        ) {
          // 如果是File对象，说明FileUploader组件上传失败了，需要手动上传
          try {
            const uploadResponse = await clientApi.storage.uploadFile(
              imageFile,
              "products"
            );
            if (uploadResponse.success) {
              imageUrl = uploadResponse.data?.url || null;
            } else {
              toast.error(
                "图片上传失败：" + (uploadResponse.error?.message || "未知错误")
              );
              return;
            }
          } catch (uploadError) {
            console.error("图片上传错误:", uploadError);
            toast.error("图片上传失败，请重试");
            return;
          }
        } else if (typeof imageFile === "string") {
          // 如果是字符串，说明FileUploader已经上传成功并返回了URL
          imageUrl = imageFile;
        }
      } else if (isEdit && initialData?.image) {
        // 编辑模式且没有新上传图片，保留原有图片URL
        imageUrl = initialData.image;
      }

      // 实时计算指导单价（避免使用闭包中可能过期的值）
      const getCurrentGuidancePrice = () => {
        if (
          values.type !== ProductType.FINISHED_PRODUCT ||
          !values.bomItems?.length
        ) {
          return values.guidancePrice;
        }

        const currentCalculated = values.bomItems.reduce(
          (total: number, bomItem: any) => {
            if (!bomItem.componentId || !bomItem.quantity) return total;

            const material = rawMaterials.find(
              (m) => m.id === bomItem.componentId
            );
            const materialPrice = material?.referencePurchasePrice || 0;

            return total + materialPrice * Number(bomItem.quantity);
          },
          0
        );

        return currentCalculated;
      };

      // 准备产品数据
      const currentGuidancePrice = getCurrentGuidancePrice();
      const productData = {
        ...values,
        image: imageUrl,
        guidancePrice: currentGuidancePrice,
      };

      // 调试信息
      console.log("提交时的调试信息:", {
        rawMaterialsCount: rawMaterials.length,
        bomItems: values.bomItems,
        calculatedGuidancePrice: currentGuidancePrice,
        originalGuidancePrice: values.guidancePrice,
        productType: values.type,
      });

      // 调用真实API保存产品数据
      let response;

      if (isEdit && initialData?.id) {
        response = await clientApi.products.updateProduct(initialData.id, productData);
      } else {
        response = await clientApi.products.createProduct(productData);
      }

      if (response.success) {
        if (isEdit) {
          toast.success("产品更新成功");
          router.push("/dashboard/product");
        } else {
          // 创建成功，显示AlertDialog
          setCreatedProductName(values.name);
          setShowSuccessDialog(true);
        }
      } else {
        toast.error(
          response.error?.message || (isEdit ? "更新失败" : "创建失败")
        );
      }
    } catch (error) {
      console.error("产品表单提交错误:", error);
      toast.error(isEdit ? "更新失败，请重试" : "创建失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  // 处理AlertDialog选择
  const handleGoToList = () => {
    setShowSuccessDialog(false);
    router.push("/dashboard/product");
  };

  const handleContinueCreate = () => {
    setShowSuccessDialog(false);
    // 重置表单，确保清空图片字段
    form.reset({
      sku: "",
      name: "",
      type: ProductType.RAW_MATERIAL,
      referencePurchasePrice: undefined,
      guidancePrice: undefined,
      bomItems: [],
      image: undefined
    });
    toast.success("表单已清空，可以继续创建新产品");
  };

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-left text-2xl font-bold">
          {pageTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          {/* 显示表单验证错误 */}
          {isClient && Object.keys(formState.errors).length > 0 && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <h4 className="text-sm font-medium text-destructive mb-2">
                表单验证错误：
              </h4>
              <ul className="text-sm text-destructive space-y-1">
                {Object.entries(formState.errors).map(([field, error]) => (
                  <li key={field}>
                    <strong>{field}:</strong>{" "}
                    {(error as any)?.message || "验证失败"}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                <h3 className="text-lg font-medium">基础信息</h3>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="例如: RM001, FP001"
                          {...field}
                          className="font-mono"
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
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>产品名称 *</FormLabel>
                      <FormControl>
                        <Input placeholder="输入产品名称" {...field} />
                      </FormControl>
                      <FormDescription>
                        清晰描述产品的名称，便于识别和管理
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>产品描述</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="输入产品描述信息（可选）" 
                        className="resize-none"
                        rows={3}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      详细描述产品的特点、用途或其他相关信息，最多500个字符
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>产品类型 *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择产品类型" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PRODUCT_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex flex-col">
                                <span>{option.label}</span>
                                <span className="text-xs text-muted-foreground">
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
              </div>

              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>产品图片</FormLabel>
                    
                    {/* 显示现有图片 */}
                    {isEdit && initialData?.image && !field.value?.length && (
                      <div className="mb-4 space-y-2">
                        <p className="text-sm text-muted-foreground">当前图片：</p>
                        <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                          <NextImage
                            src={initialData.image}
                            alt="产品图片"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          上传新图片将替换当前图片
                        </p>
                      </div>
                    )}
                    
                    <FormControl>
                      <FileUploader
                        value={field.value}
                        onValueChange={field.onChange}
                        maxFiles={1}
                        maxSize={MAX_FILE_SIZE}
                        accept={{
                          "image/jpeg": [".jpg", ".jpeg"],
                          "image/png": [".png"],
                          "image/webp": [".webp"],
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

            <div className="space-y-6">
              <h3 className="text-lg font-medium">价格信息</h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {watchedType === ProductType.RAW_MATERIAL && (
                  <FormField
                    control={form.control}
                    name="referencePurchasePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>参考采购单价</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              ¥
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              className="pl-8"
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(
                                  value === "" ? null : parseFloat(value)
                                );
                              }}
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
                  <div className="space-y-3">
                    <FormLabel>指导单价（系统自动计算）</FormLabel>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        ¥
                      </span>
                      <Input
                        type="text"
                        value={
                          isClient ? calculatedGuidancePrice.toFixed(2) : "0.00"
                        }
                        readOnly
                        className="pl-8 bg-muted/50 cursor-not-allowed"
                      />
                    </div>
                    <FormDescription>
                      根据BOM中所有原材料的参考采购单价自动计算
                    </FormDescription>
                    {isClient &&
                      calculatedGuidancePrice > 0 &&
                      watchedBomItems.length > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          <span className="font-medium">计算明细：</span>
                          <ul className="mt-1 space-y-1">
                            {watchedBomItems.map(
                              (bomItem: any, index: number) => {
                                if (!bomItem.componentId || !bomItem.quantity)
                                  return null;
                                const material = rawMaterials.find(
                                  (m) => m.id === bomItem.componentId
                                );
                                if (!material) return null;
                                const itemCost =
                                  (material.referencePurchasePrice || 0) *
                                  Number(bomItem.quantity);
                                return (
                                  <li
                                    key={index}
                                    className="flex justify-between"
                                  >
                                    <span>
                                      {material.sku} × {bomItem.quantity}
                                    </span>
                                    <span>¥{itemCost.toFixed(2)}</span>
                                  </li>
                                );
                              }
                            )}
                          </ul>
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>

            {/* BOM配置区域 - 仅组合产品显示 */}
            {watchedType === ProductType.FINISHED_PRODUCT && (
              <>
                <Separator />
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings2 className="h-5 w-5" />
                      <h3 className="text-lg font-medium">产品构成 (BOM)</h3>
                      {isClient && calculatedGuidancePrice > 0 && (
                        <div className="ml-4 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                          预计成本: ¥{formatAmount(calculatedGuidancePrice)}
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addBOMItem}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      添加原材料
                    </Button>
                  </div>
                  
                  {/* 组合产品必须添加BOM项的提示 */}
                  {watchedBomItems.length === 0 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm">
                      <strong>注意：</strong> 组合产品必须至少添加一个原材料才能保存。
                    </div>
                  )}

                  {fields.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Settings2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>还没有添加任何原材料</p>
                      <p className="text-sm">
                        点击&quot;添加原材料&quot;按钮开始配置产品构成
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {fields.map((field, index) => (
                        <div
                          key={field.id}
                          className="flex gap-4 items-start p-4 border rounded-lg bg-muted/20"
                        >
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`bomItems.${index}.componentId`}
                              render={({ field: componentField }) => (
                                <FormItem>
                                  <FormLabel>原材料 *</FormLabel>
                                  <FormControl>
                                    <ProductSelector
                                      value={componentField.value}
                                      onValueChange={componentField.onChange}
                                      products={rawMaterials}
                                      placeholder="选择原材料"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`bomItems.${index}.quantity`}
                              render={({ field: quantityField }) => (
                                <FormItem>
                                  <FormLabel>需要数量 *</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.001"
                                      min="0"
                                      placeholder="1.000"
                                      value={quantityField.value || ""}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        quantityField.onChange(
                                          value === "" ? 1 : parseFloat(value)
                                        );
                                      }}
                                    />
                                  </FormControl>
                                  {/* <FormDescription>
                                    生产1个成品所需的该原材料数量
                                  </FormDescription> */}
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeBOMItem(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
                    <p className="font-medium mb-2">说明：</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>
                        产品构成定义了生产1个成品单位所需的所有原材料及其数量
                      </li>
                      <li>
                        例如：1个花环 = 10个原材料A + 5个原材料B + 8个原材料C
                      </li>
                      <li>系统将根据此配置自动计算产品成本和领料需求</li>
                    </ul>
                  </div>
                </div>
              </>
            )}

            <Separator />

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={loading || !formState.isValid || (
                  // 组合产品且没有BOM项时禁用按钮
                  watchedType === ProductType.FINISHED_PRODUCT && 
                  (!watchedBomItems || watchedBomItems.length === 0)
                )}
                onClick={() => {
                  console.log("提交按钮被点击");
                  console.log("当前表单状态:", {
                    isValid: formState.isValid,
                    errors: formState.errors,
                    values: form.getValues(),
                  });
                }}
              >
                {loading ? "保存中..." : isEdit ? "更新产品" : "创建产品"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>

      {/* 产品创建成功对话框 */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>产品创建成功！</AlertDialogTitle>
            <AlertDialogDescription>
              产品 &ldquo;{createdProductName}&rdquo;
              已成功创建。您希望接下来做什么？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleContinueCreate}>
              继续创建新产品
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleGoToList}>
              返回产品列表
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
