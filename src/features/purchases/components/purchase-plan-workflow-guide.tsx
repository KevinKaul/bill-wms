'use client';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  CheckCircle, 
  PlayCircle,
  XCircle,
  ArrowRight,
  Info,
  Lightbulb,
  AlertTriangle
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export function PurchasePlanWorkflowGuide() {
  return (
    <Accordion type="single" collapsible className="mb-6">
      <AccordionItem value="workflow-guide" className="border rounded-lg px-4">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            <div className="text-left">
              <div className="font-semibold">采购计划业务流程说明</div>
              <div className="text-sm text-muted-foreground font-normal">
                了解采购计划的作用、流程和使用场景
              </div>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-6 pt-4">
        {/* 什么是采购计划 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <Lightbulb className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">什么是采购计划？</h4>
              <p className="text-sm text-blue-800 mb-2">
                采购计划是企业根据生产需求、库存情况和市场预测，提前规划未来一段时间内需要采购的原材料清单。
              </p>
              <p className="text-sm text-blue-800">
                它是<strong>计划阶段</strong>的工具，帮助企业：
              </p>
              <ul className="text-sm text-blue-800 mt-2 space-y-1 ml-4">
                <li>• 预估采购需求和预算</li>
                <li>• 提前与供应商沟通价格和交期</li>
                <li>• 合理安排资金和库存</li>
                <li>• 避免紧急采购和缺货风险</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 采购计划 vs 采购单 */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">采购计划 vs 采购单</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4 bg-purple-50">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-purple-600" />
                <h5 className="font-semibold text-purple-900">采购计划</h5>
              </div>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• <strong>计划阶段</strong>：预测未来需求</li>
                <li>• 不涉及实际采购</li>
                <li>• 可以反复修改调整</li>
                <li>• 用于预算和资源规划</li>
                <li>• 批准后可转为采购单</li>
              </ul>
            </div>
            <div className="border rounded-lg p-4 bg-green-50">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <h5 className="font-semibold text-green-900">采购单</h5>
              </div>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• <strong>执行阶段</strong>：实际采购订单</li>
                <li>• 向供应商下单</li>
                <li>• 确认后不能修改</li>
                <li>• 涉及付款和到货</li>
                <li>• 影响库存和财务</li>
              </ul>
            </div>
          </div>
        </div>

        <Separator />

        {/* 主流程 */}
        <div>
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">采购计划流程</span>
          </h4>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <Badge variant="outline" className="bg-gray-100 text-gray-800">草稿</Badge>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <Badge variant="outline" className="bg-green-100 text-green-800">已批准</Badge>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <PlayCircle className="h-4 w-4 text-blue-500" />
              <Badge variant="outline" className="bg-blue-100 text-blue-800">已执行</Badge>
            </div>
            <div className="mx-2 text-muted-foreground text-sm">或</div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <Badge variant="outline" className="bg-red-100 text-red-800">已取消</Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* 详细说明 */}
        <Accordion type="single" collapsible className="w-full">
          {/* 状态说明 */}
          <AccordionItem value="status">
            <AccordionTrigger className="text-sm font-semibold">
              计划状态说明
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="bg-gray-100 text-gray-800 mt-0.5">草稿</Badge>
                  <div className="flex-1 text-sm">
                    <p className="font-medium mb-1">初始状态</p>
                    <p className="text-muted-foreground">• 可以随时编辑和删除</p>
                    <p className="text-muted-foreground">• 用于初步规划和讨论</p>
                    <p className="text-muted-foreground">• 不影响实际业务</p>
                    <p className="text-muted-foreground">• 完善后提交审批</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="bg-green-100 text-green-800 mt-0.5">已批准</Badge>
                  <div className="flex-1 text-sm">
                    <p className="font-medium mb-1">审批通过</p>
                    <p className="text-muted-foreground">• 计划已获得批准</p>
                    <p className="text-muted-foreground">• 可以开始执行采购</p>
                    <p className="text-muted-foreground">• 可以转换为采购单</p>
                    <p className="text-muted-foreground">• 预算已确认</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 mt-0.5">已执行</Badge>
                  <div className="flex-1 text-sm">
                    <p className="font-medium mb-1">计划完成</p>
                    <p className="text-muted-foreground">• 已转换为采购单</p>
                    <p className="text-muted-foreground">• 实际采购已开始</p>
                    <p className="text-muted-foreground">• 计划流程结束</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="bg-red-100 text-red-800 mt-0.5">已取消</Badge>
                  <div className="flex-1 text-sm">
                    <p className="font-medium mb-1">计划作废</p>
                    <p className="text-muted-foreground">• 计划不再执行</p>
                    <p className="text-muted-foreground">• 可能因需求变化或预算调整</p>
                    <p className="text-muted-foreground">• 可以删除</p>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 使用场景 */}
          <AccordionItem value="scenarios">
            <AccordionTrigger className="text-sm font-semibold">
              典型使用场景
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <div>
                  <p className="font-medium text-sm mb-2">📅 月度采购计划</p>
                  <p className="text-sm text-muted-foreground ml-6">
                    每月初根据生产计划和库存情况，制定本月的采购计划，经过审批后逐步执行
                  </p>
                </div>

                <div>
                  <p className="font-medium text-sm mb-2">🎯 项目采购计划</p>
                  <p className="text-sm text-muted-foreground ml-6">
                    接到大订单后，根据BOM清单制定专项采购计划，确保项目物料供应
                  </p>
                </div>

                <div>
                  <p className="font-medium text-sm mb-2">📊 预算申请</p>
                  <p className="text-sm text-muted-foreground ml-6">
                    制定采购计划并预估金额，作为预算申请的依据，获得财务批准后执行
                  </p>
                </div>

                <div>
                  <p className="font-medium text-sm mb-2">🔄 库存补充计划</p>
                  <p className="text-sm text-muted-foreground ml-6">
                    定期检查库存水平，对低于安全库存的物料制定补充计划
                  </p>
                </div>

                <div>
                  <p className="font-medium text-sm mb-2">💡 价格比较</p>
                  <p className="text-sm text-muted-foreground ml-6">
                    制定计划后，可以向多个供应商询价，选择最优方案后再转为正式采购单
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 操作指南 */}
          <AccordionItem value="guide">
            <AccordionTrigger className="text-sm font-semibold">
              操作步骤指南
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <div>
                  <p className="font-medium text-sm mb-2">1️⃣ 创建采购计划</p>
                  <p className="text-sm text-muted-foreground ml-6">
                    填写计划标题、描述、计划日期和预计执行日期
                  </p>
                  <p className="text-sm text-muted-foreground ml-6 mt-1">
                    • 添加需要采购的原材料明细
                  </p>
                  <p className="text-sm text-muted-foreground ml-6">
                    • 填写计划数量和预估单价
                  </p>
                  <p className="text-sm text-muted-foreground ml-6">
                    • 设置优先级（低/中/高）
                  </p>
                </div>

                <div>
                  <p className="font-medium text-sm mb-2">2️⃣ 完善和调整</p>
                  <p className="text-sm text-muted-foreground ml-6">
                    在草稿状态下可以反复修改，与供应商沟通价格和交期
                  </p>
                </div>

                <div>
                  <p className="font-medium text-sm mb-2">3️⃣ 提交审批</p>
                  <p className="text-sm text-muted-foreground ml-6">
                    计划完善后，提交给上级或采购经理审批（功能待实现）
                  </p>
                </div>

                <div>
                  <p className="font-medium text-sm mb-2">4️⃣ 转为采购单</p>
                  <p className="text-sm text-muted-foreground ml-6">
                    批准后，根据计划创建正式的采购单，选择供应商并下单
                  </p>
                  <p className="text-sm text-muted-foreground ml-6 mt-1">
                    • 可以一次性转换全部明细
                  </p>
                  <p className="text-sm text-muted-foreground ml-6">
                    • 也可以分批转换，灵活执行
                  </p>
                </div>

                <div>
                  <p className="font-medium text-sm mb-2">5️⃣ 跟踪执行</p>
                  <p className="text-sm text-muted-foreground ml-6">
                    查看计划执行情况，对比计划与实际采购的差异
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 计划明细说明 */}
          <AccordionItem value="items">
            <AccordionTrigger className="text-sm font-semibold">
              计划明细字段说明
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="border rounded p-3">
                    <p className="font-medium text-sm mb-1">产品/原材料</p>
                    <p className="text-xs text-muted-foreground">需要采购的物料</p>
                  </div>
                  <div className="border rounded p-3">
                    <p className="font-medium text-sm mb-1">计划数量</p>
                    <p className="text-xs text-muted-foreground">预计需要采购的数量</p>
                  </div>
                  <div className="border rounded p-3">
                    <p className="font-medium text-sm mb-1">预估单价</p>
                    <p className="text-xs text-muted-foreground">根据历史价格或询价估算</p>
                  </div>
                  <div className="border rounded p-3">
                    <p className="font-medium text-sm mb-1">预估总价</p>
                    <p className="text-xs text-muted-foreground">自动计算：数量 × 单价</p>
                  </div>
                  <div className="border rounded p-3">
                    <p className="font-medium text-sm mb-1">优先级</p>
                    <p className="text-xs text-muted-foreground">
                      <Badge variant="outline" className="bg-red-100 text-red-800 text-xs mr-1">高</Badge>
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 text-xs mr-1">中</Badge>
                      <Badge variant="outline" className="bg-gray-100 text-gray-800 text-xs">低</Badge>
                    </p>
                  </div>
                  <div className="border rounded p-3">
                    <p className="font-medium text-sm mb-1">备注</p>
                    <p className="text-xs text-muted-foreground">特殊要求或说明</p>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* 重要提示 */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-orange-900">
              <p className="font-medium mb-1">重要提示</p>
              <ul className="space-y-1 text-orange-800">
                <li>• 采购计划只是<strong>规划工具</strong>，不会影响库存和财务</li>
                <li>• 只有转换为采购单并执行后，才会产生实际的采购业务</li>
                <li>• 预估价格仅供参考，实际采购价格以采购单为准</li>
                <li>• 建议定期更新计划，确保与实际需求保持一致</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 最佳实践 */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex gap-2">
            <Lightbulb className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-900">
              <p className="font-medium mb-1">最佳实践建议</p>
              <ul className="space-y-1 text-green-800">
                <li>• 根据生产计划和BOM清单制定采购计划，避免遗漏</li>
                <li>• 考虑库存安全库存量，合理规划采购时间和数量</li>
                <li>• 高优先级物料优先采购，确保生产不受影响</li>
                <li>• 定期与供应商沟通，获取准确的价格和交期信息</li>
                <li>• 保留历史计划数据，用于采购分析和预测</li>
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
