import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  PRODUCT_TYPE_LABELS,
  PRODUCT_TYPE_COLORS,
  DEFAULT_PRODUCT_IMAGE,
} from "@/constants/product";
import { productsApi } from "@/lib/api-client";
import { Edit, Package, Calendar, DollarSign, Layers } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { notFound } from "next/navigation";
import { formatAmount } from "@/lib/utils";

type ProductViewPageProps = {
  productId: string;
};

export default async function ProductViewPage({
  productId,
}: ProductViewPageProps) {
  const response = await productsApi.getProduct(productId);

  if (!response.success || !response.data) {
    notFound();
  }

  const responseData = response.data as any;
  const productData = responseData.product;
  const bomComponents = responseData.bom_components || [];

  // 调试信息 - 在开发环境中记录BOM数据
  if (process.env.NODE_ENV === "development") {
    console.log("Product View Debug:", {
      productType: productData.type,
      bomComponentsCount: bomComponents.length,
      bomComponents: bomComponents,
    });
  }

  const product = {
    id: productData.id,
    sku: productData.sku,
    name: productData.name,
    type: productData.type,
    image: productData.image_url,
    referencePurchasePrice: productData.reference_purchase_price,
    guidancePrice: productData.guide_unit_price,
    calculatedCost: productData.calculated_cost,
    bomItemsCount: productData.bom_components_count || 0,
    createdAt: new Date(productData.created_at),
    updatedAt: new Date(productData.updated_at),
  };

  const typeLabel =
    PRODUCT_TYPE_LABELS[product.type as keyof typeof PRODUCT_TYPE_LABELS];
  const typeVariant =
    PRODUCT_TYPE_COLORS[product.type as keyof typeof PRODUCT_TYPE_COLORS];

  return (
    <div className="space-y-6">
      {/* 产品基础信息卡片 */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 overflow-hidden rounded-lg border">
                <Image
                  src={product.image || DEFAULT_PRODUCT_IMAGE}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-2xl">{product.name}</CardTitle>
                  <Badge variant={typeVariant} className="whitespace-nowrap">
                    <Package className="mr-1 h-3 w-3" />
                    {typeLabel}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="font-mono">SKU: {product.sku}</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    创建于{" "}
                    {format(product.createdAt, "yyyy年MM月dd日", {
                      locale: zhCN,
                    })}
                  </span>
                </div>
              </div>
            </div>
            <Link href={`/dashboard/product/${productId}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                编辑产品
              </Button>
            </Link>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* 价格信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              价格信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {product.referencePurchasePrice && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">参考采购单价</span>
                <span className="font-mono text-lg font-semibold">
                  ¥{formatAmount(product.referencePurchasePrice)}
                </span>
              </div>
            )}
            {product.guidancePrice && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">指导单价</span>
                <span className="font-mono text-lg font-semibold">
                  ¥{formatAmount(product.guidancePrice)}
                </span>
              </div>
            )}
            {product.calculatedCost && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">计算成本</span>
                <span className="font-mono text-lg font-semibold text-orange-600">
                  ¥{formatAmount(product.calculatedCost)}
                </span>
              </div>
            )}
            {!product.referencePurchasePrice &&
              !product.guidancePrice &&
              !product.calculatedCost && (
                <div className="text-center text-muted-foreground py-4">
                  暂无价格信息
                </div>
              )}
          </CardContent>
        </Card>

        {/* BOM信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              BOM构成
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bomComponents.length > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">组件数量</span>
                  <Badge variant="outline">{bomComponents.length}个组件</Badge>
                </div>
                <Separator />

                {/* BOM组件列表 */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    组件明细：
                  </h4>
                  <div className="space-y-2">
                    {bomComponents.map((component: any, index: number) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border bg-muted/20 gap-2"
                      >
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <span className="font-mono text-sm font-medium">
                              {component.material_sku}
                            </span>
                            <Badge
                              variant="secondary"
                              className="text-xs w-fit"
                            >
                              {component.material_name}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                          <span className="text-muted-foreground">
                            数量:{" "}
                            <span className="font-medium">
                              {component.quantity}
                            </span>
                          </span>
                          <span className="text-muted-foreground">
                            单价:{" "}
                            <span className="font-mono font-medium">
                              ¥{formatAmount(component.cost_per_unit)}
                            </span>
                          </span>
                          <span className="font-mono font-semibold text-orange-600">
                            小计: ¥{formatAmount(component.total_cost)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 总成本 */}
                  {product.calculatedCost && (
                    <div className="flex justify-between items-center pt-3 border-t">
                      <span className="font-medium">总成本</span>
                      <span className="font-mono text-lg font-bold text-orange-600">
                        ¥{product.calculatedCost.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Layers className="mx-auto h-12 w-12 opacity-50" />
                <p className="mt-2">此产品暂无BOM构成</p>
                {product.type === "FINISHED_PRODUCT" && (
                  <p className="text-xs mt-1">组合产品通常需要配置BOM构成</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 操作历史 */}
      <Card>
        <CardHeader>
          <CardTitle>操作历史</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Calendar className="mx-auto h-12 w-12 opacity-50" />
            <p className="mt-2">暂无操作历史记录</p>
            <p className="text-xs mt-1">TODO: 实现操作日志显示</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
