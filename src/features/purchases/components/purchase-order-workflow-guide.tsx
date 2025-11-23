'use client';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  CheckCircle, 
  DollarSign, 
  Truck, 
  CheckCheck,
  ArrowRight,
  Info
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export function PurchaseOrderWorkflowGuide() {
  return (
    <Accordion type="single" collapsible className="mb-6">
      <AccordionItem value="workflow-guide" className="border rounded-lg px-4">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            <div className="text-left">
              <div className="font-semibold">采购单业务流程说明</div>
              <div className="text-sm text-muted-foreground font-normal">
                了解采购单的完整流程和各状态含义
              </div>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-6 pt-4">
        {/* 主流程 */}
        <div>
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">主要流程</span>
          </h4>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <Badge variant="outline" className="bg-gray-100 text-gray-800">草稿</Badge>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-500" />
              <Badge variant="outline" className="bg-blue-100 text-blue-800">已确认</Badge>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <Badge variant="outline" className="bg-green-100 text-green-800">付款中</Badge>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-orange-500" />
              <Badge variant="outline" className="bg-orange-100 text-orange-800">到货中</Badge>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <CheckCheck className="h-4 w-4 text-green-600" />
              <Badge variant="outline" className="bg-green-100 text-green-800">已完成</Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* 详细说明 */}
        <Accordion type="single" collapsible className="w-full">
          {/* 订单状态 */}
          <AccordionItem value="order-status">
            <AccordionTrigger className="text-sm font-semibold">
              订单状态说明
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="bg-gray-100 text-gray-800 mt-0.5">草稿</Badge>
                  <div className="flex-1 text-sm">
                    <p className="font-medium mb-1">初始状态</p>
                    <p className="text-muted-foreground">• 可以编辑和删除</p>
                    <p className="text-muted-foreground">• 不能进行付款和到货操作</p>
                    <p className="text-muted-foreground">• 点击&ldquo;确认订单&rdquo;后变为已确认状态</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 mt-0.5">已确认</Badge>
                  <div className="flex-1 text-sm">
                    <p className="font-medium mb-1">订单已锁定</p>
                    <p className="text-muted-foreground">• 不能再编辑订单内容</p>
                    <p className="text-muted-foreground">• 可以添加付款记录</p>
                    <p className="text-muted-foreground">• 可以标记已到货（触发库存入库）</p>
                    <p className="text-muted-foreground">• 向供应商正式下单后使用此状态</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="bg-green-100 text-green-800 mt-0.5">已完成</Badge>
                  <div className="flex-1 text-sm">
                    <p className="font-medium mb-1">订单结束</p>
                    <p className="text-muted-foreground">• 货物已全部到货且已入库</p>
                    <p className="text-muted-foreground">• 付款已完成</p>
                    <p className="text-muted-foreground">• 订单流程结束</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="bg-red-100 text-red-800 mt-0.5">已取消</Badge>
                  <div className="flex-1 text-sm">
                    <p className="font-medium mb-1">订单作废</p>
                    <p className="text-muted-foreground">• 订单被取消，不再执行</p>
                    <p className="text-muted-foreground">• 可以删除</p>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 付款状态 */}
          <AccordionItem value="payment-status">
            <AccordionTrigger className="text-sm font-semibold">
              付款状态说明
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 mt-0.5">未付款</Badge>
                  <div className="flex-1 text-sm">
                    <p className="font-medium mb-1">尚未付款</p>
                    <p className="text-muted-foreground">• 已付金额：¥0.00</p>
                    <p className="text-muted-foreground">• 订单确认后可以添加付款记录</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 mt-0.5">部分付款</Badge>
                  <div className="flex-1 text-sm">
                    <p className="font-medium mb-1">已付部分款项</p>
                    <p className="text-muted-foreground">• 已付金额小于订单总额</p>
                    <p className="text-muted-foreground">• 可以继续添加付款记录</p>
                    <p className="text-muted-foreground">• 系统会显示已付金额和待付金额</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="bg-green-100 text-green-800 mt-0.5">已付款</Badge>
                  <div className="flex-1 text-sm">
                    <p className="font-medium mb-1">款项已付清</p>
                    <p className="text-muted-foreground">• 已付金额等于订单总额</p>
                    <p className="text-muted-foreground">• 不能再添加付款记录</p>
                    <p className="text-muted-foreground">• 供应商结算完成</p>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 到货状态 */}
          <AccordionItem value="delivery-status">
            <AccordionTrigger className="text-sm font-semibold">
              到货状态说明
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="bg-gray-100 text-gray-800 mt-0.5">未到货</Badge>
                  <div className="flex-1 text-sm">
                    <p className="font-medium mb-1">等待供应商发货</p>
                    <p className="text-muted-foreground">• 货物尚未送达</p>
                    <p className="text-muted-foreground">• 订单确认后可以标记已到货</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="bg-green-100 text-green-800 mt-0.5">已到货</Badge>
                  <div className="flex-1 text-sm">
                    <p className="font-medium mb-1">货物已送达</p>
                    <p className="text-muted-foreground">• 货物已验收入库</p>
                    <p className="text-muted-foreground">• 系统自动创建原材料批次</p>
                    <p className="text-muted-foreground">• 库存数量自动增加</p>
                    <p className="text-orange-600 font-medium mt-1">⚠️ 重要：标记已到货会触发库存入库操作，不可撤销！</p>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 操作指南 */}
          <AccordionItem value="operation-guide">
            <AccordionTrigger className="text-sm font-semibold">
              常见操作指南
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <div>
                  <p className="font-medium text-sm mb-2">1️⃣ 创建采购单</p>
                  <p className="text-sm text-muted-foreground ml-6">
                    填写供应商、采购明细、预计到货日期等信息，保存为草稿状态
                  </p>
                </div>

                <div>
                  <p className="font-medium text-sm mb-2">2️⃣ 确认订单</p>
                  <p className="text-sm text-muted-foreground ml-6">
                    检查无误后点击&ldquo;确认订单&rdquo;，订单状态变为已确认，不能再修改
                  </p>
                </div>

                <div>
                  <p className="font-medium text-sm mb-2">3️⃣ 添加付款记录</p>
                  <p className="text-sm text-muted-foreground ml-6">
                    在付款状态列点击&ldquo;添加付款&rdquo;，记录每次付款的金额、日期、方式等
                  </p>
                  <p className="text-sm text-muted-foreground ml-6 mt-1">
                    • 支持分批付款，系统自动计算已付和待付金额
                  </p>
                  <p className="text-sm text-muted-foreground ml-6">
                    • 付清后状态自动变为&ldquo;已付款&rdquo;
                  </p>
                </div>

                <div>
                  <p className="font-medium text-sm mb-2">4️⃣ 标记已到货</p>
                  <p className="text-sm text-muted-foreground ml-6">
                    货物送达后，在到货状态列点击状态Badge，选择&ldquo;已到货&rdquo;
                  </p>
                  <p className="text-sm text-muted-foreground ml-6 mt-1">
                    • 系统自动创建原材料批次记录
                  </p>
                  <p className="text-sm text-muted-foreground ml-6">
                    • 库存数量自动增加
                  </p>
                  <p className="text-sm text-muted-foreground ml-6">
                    • 生成库存移动记录
                  </p>
                </div>

                <div>
                  <p className="font-medium text-sm mb-2">5️⃣ 查看详情和历史</p>
                  <p className="text-sm text-muted-foreground ml-6">
                    点击&ldquo;查看详情&rdquo;可以查看订单完整信息和付款历史记录
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* 提示信息 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-2">
            <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">温馨提示</p>
              <ul className="space-y-1 text-blue-800">
                <li>• 草稿状态的订单可以随时编辑和删除</li>
                <li>• 确认后的订单不能修改，请仔细检查后再确认</li>
                <li>• 付款记录支持多次添加，适用于分批付款场景</li>
                <li>• 标记已到货会自动触发库存入库，请确认货物已验收</li>
              </ul>
            </div>
          </div>
          </div>
        </div>
      </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
