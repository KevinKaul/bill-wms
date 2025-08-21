import { ProductionStatus, PaymentStatus } from '@/types/production';

// 生产状态选项
export const PRODUCTION_STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'confirmed', label: '已确认' },
  { value: 'in_progress', label: '生产中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' }
] as const;

// 付款状态选项
export const PAYMENT_STATUS_OPTIONS = [
  { value: 'unpaid', label: '未付款' },
  { value: 'paid', label: '已付款' }
] as const;

// 状态颜色映射
export const PRODUCTION_STATUS_COLORS: Record<ProductionStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  unpaid: 'bg-red-100 text-red-800',
  paid: 'bg-green-100 text-green-800'
};

// 状态标签映射
export const PRODUCTION_STATUS_LABELS: Record<ProductionStatus, string> = {
  draft: '草稿',
  confirmed: '已确认',
  in_progress: '生产中',
  completed: '已完成',
  cancelled: '已取消'
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: '未付款',
  paid: '已付款'
};

// 表单验证常量
export const PRODUCTION_VALIDATION = {
  QUANTITY_MIN: 0,
  QUANTITY_MAX: 999999,
  PROCESSING_FEE_MIN: 0,
  PROCESSING_FEE_MAX: 999999.99,
  REMARK_MAX_LENGTH: 500
};

// 筛选选项
export const PRODUCTION_STATUS_FILTER_OPTIONS = [
  { value: 'all', label: '全部状态' },
  ...PRODUCTION_STATUS_OPTIONS
];

export const PAYMENT_STATUS_FILTER_OPTIONS = [
  { value: 'all', label: '全部状态' },
  ...PAYMENT_STATUS_OPTIONS
];

// 默认分页设置
export const DEFAULT_PRODUCTION_PAGE_SIZE = 10;
export const PRODUCTION_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// 加工单号前缀
export const PRODUCTION_ORDER_PREFIX = 'PRO';

// 常用加工费用预设
export const COMMON_PROCESSING_FEES = [
  { label: '无加工费', value: 0 },
  { label: '人工费 50元', value: 50 },
  { label: '人工费 100元', value: 100 },
  { label: '人工费 200元', value: 200 },
  { label: '设备费 300元', value: 300 },
  { label: '设备费 500元', value: 500 }
];

// 物料需求状态
export const MATERIAL_REQUIREMENT_STATUS = {
  SUFFICIENT: 'sufficient',
  INSUFFICIENT: 'insufficient',
  UNAVAILABLE: 'unavailable'
} as const;

export const MATERIAL_REQUIREMENT_STATUS_COLORS = {
  sufficient: 'bg-green-100 text-green-800',
  insufficient: 'bg-yellow-100 text-yellow-800',
  unavailable: 'bg-red-100 text-red-800'
};

export const MATERIAL_REQUIREMENT_STATUS_LABELS = {
  sufficient: '库存充足',
  insufficient: '库存不足',
  unavailable: '无库存'
};
