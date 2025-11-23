// 采购相关验证常量
export const PURCHASE_VALIDATION = {
  ORDER_NUMBER_MIN_LENGTH: 3,
  ORDER_NUMBER_MAX_LENGTH: 20,
  TITLE_MIN_LENGTH: 2,
  TITLE_MAX_LENGTH: 100,
  QUANTITY_MIN: 1,
  QUANTITY_MAX: 999999,
  UNIT_PRICE_MIN: 0.01,
  UNIT_PRICE_MAX: 999999.99,
  ADDITIONAL_COST_MIN: 0,
  ADDITIONAL_COST_MAX: 999999.99
} as const;

// 采购单状态选项
export const PURCHASE_ORDER_STATUS_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '草稿', value: 'draft' },
  { label: '已确认', value: 'confirmed' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' }
] as const;

// 付款状态选项
export const PAYMENT_STATUS_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '未付款', value: 'UNPAID' },
  { label: '部分付款', value: 'PARTIAL_PAID' },
  { label: '已付款', value: 'PAID' }
] as const;

// 到货状态选项
export const DELIVERY_STATUS_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '未到货', value: 'NOT_DELIVERED' },
  { label: '已到货', value: 'DELIVERED' }
] as const;

// 采购计划状态选项
export const PURCHASE_PLAN_STATUS_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '草稿', value: 'draft' },
  { label: '已批准', value: 'approved' },
  { label: '已执行', value: 'executed' },
  { label: '已取消', value: 'cancelled' }
] as const;

// 优先级选项
export const PRIORITY_OPTIONS = [
  { label: '低', value: 'low' },
  { label: '中', value: 'medium' },
  { label: '高', value: 'high' }
] as const;

// 状态颜色映射
export const STATUS_COLORS = {
  // 采购单状态
  draft: 'bg-gray-100 text-gray-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  
  // 付款状态
  UNPAID: 'bg-yellow-100 text-yellow-800',
  PARTIAL_PAID: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  
  // 到货状态
  NOT_DELIVERED: 'bg-orange-100 text-orange-800',
  DELIVERED: 'bg-green-100 text-green-800',
  
  // 采购计划状态
  approved: 'bg-blue-100 text-blue-800',
  executed: 'bg-green-100 text-green-800',
  
  // 优先级
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800'
} as const;

// 状态标签映射
export const STATUS_LABELS = {
  // 采购单状态
  draft: '草稿',
  confirmed: '已确认',
  completed: '已完成',
  cancelled: '已取消',
  
  // 付款状态
  UNPAID: '未付款',
  PARTIAL_PAID: '部分付款',
  PAID: '已付款',
  
  // 到货状态
  NOT_DELIVERED: '待发货',
  DELIVERED: '已到货',
  
  // 采购计划状态
  approved: '已批准',
  executed: '已执行',
  
  // 优先级
  low: '低',
  medium: '中',
  high: '高'
} as const;
