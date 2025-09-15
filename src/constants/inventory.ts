// 库存相关验证常量
export const INVENTORY_VALIDATION = {
  QUANTITY_MIN: 0,
  QUANTITY_MAX: 999999,
  UNIT_COST_MIN: 0.01,
  UNIT_COST_MAX: 999999.99,
  BATCH_NUMBER_MIN_LENGTH: 3,
  BATCH_NUMBER_MAX_LENGTH: 30,
  REASON_MIN_LENGTH: 2,
  REASON_MAX_LENGTH: 200
} as const;

// 库存移动类型选项
export const MOVEMENT_TYPE_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '入库', value: 'inbound' },
  { label: '出库', value: 'outbound' },
  { label: '调拨入库', value: 'transfer_in' },
  { label: '调拨出库', value: 'transfer_out' },
  { label: '盘盈', value: 'adjustment_in' },
  { label: '盘亏', value: 'adjustment_out' }
] as const;

// 来源类型选项
export const SOURCE_TYPE_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '采购入库', value: 'purchase' },
  { label: '生产入库', value: 'production' },
  { label: '生产消耗', value: 'consumption' },
  { label: '库存调整', value: 'adjustment' }
] as const;

// 产品类型选项
export const PRODUCT_TYPE_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '原材料', value: 'raw_material' },
  { label: '成品', value: 'finished_product' }
] as const;

// 调整类型选项
export const ADJUSTMENT_TYPE_OPTIONS = [
  { label: '增加库存', value: 'increase' },
  { label: '减少库存', value: 'decrease' }
] as const;

// 状态颜色映射
export const STATUS_COLORS = {
  // 移动类型
  inbound: 'bg-green-100 text-green-800',
  outbound: 'bg-red-100 text-red-800',
  adjustment: 'bg-blue-100 text-blue-800',
  transfer_in: 'bg-blue-100 text-blue-800',
  transfer_out: 'bg-orange-100 text-orange-800',
  adjustment_in: 'bg-green-100 text-green-800',
  adjustment_out: 'bg-red-100 text-red-800',
  
  // 来源类型
  purchase: 'bg-purple-100 text-purple-800',
  production: 'bg-orange-100 text-orange-800',
  consumption: 'bg-red-100 text-red-800',
  transfer: 'bg-blue-100 text-blue-800',
  
  // 产品类型
  all: 'bg-gray-100 text-gray-800',
  raw_material: 'bg-blue-100 text-blue-800',
  finished_product: 'bg-green-100 text-green-800',
  
  // 调整类型
  increase: 'bg-green-100 text-green-800',
  decrease: 'bg-red-100 text-red-800',
  
  // 库存状态
  low_stock: 'bg-yellow-100 text-yellow-800',
  normal_stock: 'bg-green-100 text-green-800',
  out_of_stock: 'bg-red-100 text-red-800'
} as const;

// 移动类型颜色映射
export const MOVEMENT_TYPE_COLORS = {
  inbound: 'bg-green-100 text-green-800',
  outbound: 'bg-red-100 text-red-800',
  transfer_in: 'bg-blue-100 text-blue-800',
  transfer_out: 'bg-orange-100 text-orange-800',
  adjustment_in: 'bg-green-100 text-green-800',
  adjustment_out: 'bg-red-100 text-red-800'
} as const;

// 状态标签映射
export const STATUS_LABELS = {
  // 移动类型
  inbound: '入库',
  outbound: '出库',
  adjustment: '调整',
  transfer_in: '调拨入库',
  transfer_out: '调拨出库',
  adjustment_in: '盘盈',
  adjustment_out: '盘亏',
  
  // 来源类型
  purchase: '采购入库',
  production: '生产入库',
  consumption: '生产消耗',
  transfer: '调拨入库',
  
  // 产品类型
  all: '全部',
  raw_material: '原材料',
  finished_product: '成品',
  
  // 调整类型
  increase: '增加库存',
  decrease: '减少库存',
  
  // 库存状态
  low_stock: '低库存',
  normal_stock: '正常',
  out_of_stock: '缺货'
} as const;

// 移动类型标签映射
export const MOVEMENT_TYPE_LABELS = {
  inbound: '入库',
  outbound: '出库',
  transfer_in: '调拨入库',
  transfer_out: '调拨出库',
  adjustment_in: '盘盈',
  adjustment_out: '盘亏'
} as const;

// 常用调整原因
export const COMMON_ADJUSTMENT_REASONS = [
  '盘点调整',
  '损耗调整',
  '质量问题',
  '过期处理',
  '搬运损失',
  '系统错误修正',
  '初始化库存',
  '其他原因'
] as const;
