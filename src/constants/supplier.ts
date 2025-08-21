// 供应商表单验证常量
export const SUPPLIER_VALIDATION = {
  CODE_MIN_LENGTH: 2,
  CODE_MAX_LENGTH: 20,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  ACCOUNT_MIN_LENGTH: 5,
  ACCOUNT_MAX_LENGTH: 50,
  PHONE_PATTERN: /^1[3-9]\d{9}$/,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
} as const;

// 供应商状态选项
export const SUPPLIER_STATUS_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '活跃', value: 'active' },
  { label: '停用', value: 'inactive' }
] as const;
