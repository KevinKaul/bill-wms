# 仓库管理系统 API 接口设计文档

## 概述

本文档定义了仓库管理系统的完整API接口规范，包括产品管理、采购管理、库存管理、加工管理和批次管理等核心模块。

## 通用规范

### 请求格式
- 基础URL: `/api/v1`
- Content-Type: `application/json`
- 认证方式: Bearer Token

### 响应格式
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    total?: number;
    page?: number;
    per_page?: number;
    has_next?: boolean;
  };
}
```

### 分页参数
```typescript
interface PaginationParams {
  page?: number;        // 页码，默认1
  per_page?: number;    // 每页数量，默认10
  sort?: string;        // 排序字段
  order?: 'asc' | 'desc'; // 排序方向，默认desc
}
```

---

## 1. 产品管理模块 (Product Management)

### 1.1 获取产品列表
```
GET /api/v1/products
```

**查询参数:**
```typescript
interface ProductListParams extends PaginationParams {
  search?: string;           // 搜索关键词（SKU、名称）
  type?: 'raw_material' | 'finished_product'; // 产品类型
  category_id?: string;      // 分类ID
  status?: 'active' | 'inactive'; // 状态
}
```

**响应数据:**
```typescript
interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  per_page: number;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  type: 'raw_material' | 'finished_product';
  category_id?: string;
  category_name?: string;
  description?: string;
  image_url?: string;
  reference_purchase_price?: number; // 参考采购价（原材料）
  guide_unit_price?: number;         // 指导单价（成品）
  calculated_cost?: number;          // 计算成本（成品）
  bom_components_count: number;      // BOM组件数量
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}
```

### 1.2 获取产品详情
```
GET /api/v1/products/{id}
```

**响应数据:**
```typescript
interface ProductDetailResponse {
  product: Product;
  bom_components?: BOMComponent[]; // 如果是成品，返回BOM组件
  inventory_summary?: {
    total_quantity: number;
    total_value: number;
    batch_count: number;
  };
}

interface BOMComponent {
  id: string;
  material_id: string;
  material_sku: string;
  material_name: string;
  quantity: number;
  unit: string;
  cost_per_unit?: number;
  total_cost?: number;
}
```

### 1.3 创建产品
```
POST /api/v1/products
```

**请求参数:**
```typescript
interface CreateProductRequest {
  sku: string;
  name: string;
  type: 'raw_material' | 'finished_product';
  category_id?: string;
  description?: string;
  image_url?: string;
  reference_purchase_price?: number;
  guide_unit_price?: number;
  bom_components?: BOMComponentInput[];
}

interface BOMComponentInput {
  material_id: string;
  quantity: number;
  unit: string;
}
```

### 1.4 更新产品
```
PUT /api/v1/products/{id}
```

**请求参数:** 同创建产品，所有字段可选

### 1.5 删除产品
```
DELETE /api/v1/products/{id}
```

---

## 2. 采购管理模块 (Purchase Management)

### 2.1 采购计划管理

#### 2.1.1 获取采购计划列表
```
GET /api/v1/purchase/plans
```

**查询参数:**
```typescript
interface PurchasePlanListParams extends PaginationParams {
  search?: string;
  status?: 'draft' | 'approved' | 'executed' | 'cancelled';
  date_from?: string;
  date_to?: string;
}
```

**响应数据:**
```typescript
interface PurchasePlan {
  id: string;
  plan_number: string;
  title: string;
  status: 'draft' | 'approved' | 'executed' | 'cancelled';
  total_estimated_amount: number;
  items_count: number;
  created_by: string;
  approved_by?: string;
  executed_at?: string;
  created_at: string;
  updated_at: string;
}
```

#### 2.1.2 创建采购计划
```
POST /api/v1/purchase/plans
```

**请求参数:**
```typescript
interface CreatePurchasePlanRequest {
  title: string;
  items: PurchasePlanItemInput[];
  remark?: string;
}

interface PurchasePlanItemInput {
  product_id: string;
  quantity: number;
  estimated_unit_price: number;
  remark?: string;
}
```

#### 2.1.3 批准采购计划
```
POST /api/v1/purchase/plans/{id}/approve
```

#### 2.1.4 执行采购计划（生成采购单）
```
POST /api/v1/purchase/plans/{id}/execute
```

**请求参数:**
```typescript
interface ExecutePurchasePlanRequest {
  supplier_groups: SupplierGroupInput[];
}

interface SupplierGroupInput {
  supplier_id: string;
  item_ids: string[]; // 分配给该供应商的计划项ID
  additional_cost?: number;
  expected_delivery_date?: string;
  remark?: string;
}
```

### 2.2 采购单管理

#### 2.2.1 获取采购单列表
```
GET /api/v1/purchase/orders
```

**查询参数:**
```typescript
interface PurchaseOrderListParams extends PaginationParams {
  search?: string;
  supplier_id?: string;
  status?: 'draft' | 'confirmed' | 'completed' | 'cancelled';
  payment_status?: 'unpaid' | 'paid';
  delivery_status?: 'pending' | 'delivered' | 'arrived';
  date_from?: string;
  date_to?: string;
}
```

**响应数据:**
```typescript
interface PurchaseOrder {
  id: string;
  order_number: string;
  supplier_id: string;
  supplier_code: string;
  supplier_name: string;
  status: 'draft' | 'confirmed' | 'completed' | 'cancelled';
  payment_status: 'unpaid' | 'paid';
  delivery_status: 'pending' | 'delivered' | 'arrived';
  subtotal: number;
  additional_cost: number;
  total_amount: number;
  order_date: string;
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  items_count: number;
  remark?: string;
  created_at: string;
  updated_at: string;
}
```

#### 2.2.2 获取采购单详情
```
GET /api/v1/purchase/orders/{id}
```

**响应数据:**
```typescript
interface PurchaseOrderDetailResponse {
  order: PurchaseOrder;
  items: PurchaseOrderItem[];
}

interface PurchaseOrderItem {
  id: string;
  product_id: string;
  product_sku: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  received_quantity?: number; // 已到货数量
}
```

#### 2.2.3 创建采购单
```
POST /api/v1/purchase/orders
```

**请求参数:**
```typescript
interface CreatePurchaseOrderRequest {
  supplier_id: string;
  items: PurchaseOrderItemInput[];
  additional_cost?: number;
  expected_delivery_date?: string;
  remark?: string;
}

interface PurchaseOrderItemInput {
  product_id: string;
  quantity: number;
  unit_price: number;
}
```

#### 2.2.4 确认采购单
```
POST /api/v1/purchase/orders/{id}/confirm
```

#### 2.2.5 标记付款
```
POST /api/v1/purchase/orders/{id}/mark-paid
```

#### 2.2.6 标记到货
```
POST /api/v1/purchase/orders/{id}/mark-arrived
```

**请求参数:**
```typescript
interface MarkArrivedRequest {
  actual_delivery_date?: string;
  received_items?: ReceivedItemInput[];
}

interface ReceivedItemInput {
  item_id: string;
  received_quantity: number;
}
```

---

## 3. 库存管理模块 (Inventory Management)

### 3.1 库存概览
```
GET /api/v1/inventory/overview
```

**响应数据:**
```typescript
interface InventoryOverviewResponse {
  total_products: number;
  total_batches: number;
  total_value: number;
  low_stock_alerts: number;
  categories: CategoryInventory[];
}

interface CategoryInventory {
  category_id: string;
  category_name: string;
  products_count: number;
  total_quantity: number;
  total_value: number;
}
```

### 3.2 库存调整

#### 3.2.1 获取库存调整记录
```
GET /api/v1/inventory/adjustments
```

**查询参数:**
```typescript
interface InventoryAdjustmentListParams extends PaginationParams {
  product_id?: string;
  type?: 'increase' | 'decrease';
  reason?: string;
  date_from?: string;
  date_to?: string;
}
```

**响应数据:**
```typescript
interface InventoryAdjustment {
  id: string;
  product_id: string;
  product_sku: string;
  product_name: string;
  type: 'increase' | 'decrease';
  quantity: number;
  unit_cost?: number;
  total_cost?: number;
  reason: string;
  remark?: string;
  created_by: string;
  created_at: string;
}
```

#### 3.2.2 创建库存调整
```
POST /api/v1/inventory/adjustments
```

**请求参数:**
```typescript
interface CreateInventoryAdjustmentRequest {
  product_id: string;
  type: 'increase' | 'decrease';
  quantity: number;
  unit_cost?: number;
  reason: string;
  remark?: string;
}
```

### 3.3 库存移动

#### 3.3.1 获取库存移动记录
```
GET /api/v1/inventory/movements
```

**查询参数:**
```typescript
interface InventoryMovementListParams extends PaginationParams {
  product_id?: string;
  batch_id?: string;
  movement_type?: 'inbound' | 'outbound' | 'transfer';
  source_type?: 'purchase' | 'production' | 'adjustment' | 'transfer';
  date_from?: string;
  date_to?: string;
}
```

**响应数据:**
```typescript
interface InventoryMovement {
  id: string;
  product_id: string;
  product_sku: string;
  product_name: string;
  batch_id?: string;
  batch_number?: string;
  movement_type: 'inbound' | 'outbound' | 'transfer';
  source_type: 'purchase' | 'production' | 'adjustment' | 'transfer';
  source_reference: string;
  quantity: number;
  unit_cost?: number;
  total_cost?: number;
  from_location?: string;
  to_location?: string;
  created_at: string;
}
```

---

## 4. 加工管理模块 (Production Management)

### 4.1 获取加工单列表
```
GET /api/v1/production/orders
```

**查询参数:**
```typescript
interface ProductionOrderListParams extends PaginationParams {
  search?: string;
  product_id?: string;
  supplier_id?: string;
  status?: 'draft' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  payment_status?: 'unpaid' | 'paid';
  date_from?: string;
  date_to?: string;
}
```

**响应数据:**
```typescript
interface ProductionOrder {
  id: string;
  order_number: string;
  product_id: string;
  product_sku: string;
  product_name: string;
  planned_quantity: number;
  actual_quantity?: number;
  status: 'draft' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  payment_status: 'unpaid' | 'paid';
  supplier_id: string;
  supplier_name: string;
  processing_fee: number;
  material_cost: number;
  total_cost: number;
  order_date: string;
  start_date?: string;
  completion_date?: string;
  created_at: string;
  updated_at: string;
}
```

### 4.2 获取加工单详情
```
GET /api/v1/production/orders/{id}
```

**响应数据:**
```typescript
interface ProductionOrderDetailResponse {
  order: ProductionOrder;
  material_requirements: MaterialRequirement[];
  batch_allocations?: BatchAllocation[];
  finished_batches?: FinishedBatch[];
}

interface MaterialRequirement {
  material_id: string;
  material_sku: string;
  material_name: string;
  required_quantity: number;
  allocated_quantity: number;
  unit_cost: number;
  total_cost: number;
}

interface BatchAllocation {
  batch_id: string;
  batch_number: string;
  material_id: string;
  allocated_quantity: number;
  unit_cost: number;
  total_cost: number;
}
```

### 4.3 创建加工单
```
POST /api/v1/production/orders
```

**请求参数:**
```typescript
interface CreateProductionOrderRequest {
  product_id: string;
  planned_quantity: number;
  supplier_id: string;
  processing_fee: number;
  remark?: string;
}
```

### 4.4 计算物料需求
```
POST /api/v1/production/orders/calculate-materials
```

**请求参数:**
```typescript
interface CalculateMaterialsRequest {
  product_id: string;
  quantity: number;
}
```

**响应数据:**
```typescript
interface CalculateMaterialsResponse {
  materials: MaterialRequirement[];
  total_material_cost: number;
  feasible: boolean;
  shortage_materials?: ShortageMaterial[];
}

interface ShortageMaterial {
  material_id: string;
  material_sku: string;
  material_name: string;
  required_quantity: number;
  available_quantity: number;
  shortage_quantity: number;
}
```

### 4.5 确认加工单
```
POST /api/v1/production/orders/{id}/confirm
```

### 4.6 开始生产
```
POST /api/v1/production/orders/{id}/start
```

**请求参数:**
```typescript
interface StartProductionRequest {
  start_date?: string;
  batch_allocations?: BatchAllocationInput[];
}

interface BatchAllocationInput {
  material_id: string;
  allocations: {
    batch_id: string;
    quantity: number;
  }[];
}
```

### 4.7 完成生产
```
POST /api/v1/production/orders/{id}/complete
```

**请求参数:**
```typescript
interface CompleteProductionRequest {
  actual_quantity: number;
  completion_date?: string;
  quality_status?: 'passed' | 'failed';
  remark?: string;
}
```

---

## 5. 批次管理模块 (Batch Management)

### 5.1 原材料批次管理

#### 5.1.1 获取原材料批次列表
```
GET /api/v1/batches/raw-materials
```

**查询参数:**
```typescript
interface RawMaterialBatchListParams extends PaginationParams {
  search?: string;
  material_id?: string;
  supplier_id?: string;
  source_reference?: string;
  date_from?: string;
  date_to?: string;
}
```

**响应数据:**
```typescript
interface RawMaterialBatch {
  batch_id: string;
  batch_number: string;
  material_id: string;
  material_sku: string;
  material_name: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  original_unit_price: number;
  allocated_additional_cost: number;
  source_type: 'purchase';
  source_reference: string;
  supplier_id: string;
  supplier_name: string;
  inbound_date: string;
  location?: string;
  status: 'active' | 'consumed' | 'expired';
}
```

#### 5.1.2 获取原材料批次详情
```
GET /api/v1/batches/raw-materials/{batch_id}
```

**响应数据:**
```typescript
interface RawMaterialBatchDetailResponse {
  batch: RawMaterialBatch;
  movements: InventoryMovement[];
  allocations: ProductionAllocation[];
}

interface ProductionAllocation {
  production_order_id: string;
  production_order_number: string;
  allocated_quantity: number;
  allocated_date: string;
}
```

### 5.2 成品批次管理

#### 5.2.1 获取成品批次列表
```
GET /api/v1/batches/finished-products
```

**查询参数:**
```typescript
interface FinishedProductBatchListParams extends PaginationParams {
  search?: string;
  product_id?: string;
  production_order_id?: string;
  quality_status?: 'pending' | 'passed' | 'failed';
  date_from?: string;
  date_to?: string;
}
```

**响应数据:**
```typescript
interface FinishedProductBatch {
  batch_id: string;
  batch_number: string;
  product_id: string;
  product_sku: string;
  product_name: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  source_type: 'production';
  source_reference: string;
  production_date: string;
  location?: string;
  quality_status: 'pending' | 'passed' | 'failed';
  status: 'active' | 'sold' | 'expired';
}
```

### 5.3 批次库存查询
```
GET /api/v1/batches/inventory
```

**查询参数:**
```typescript
interface BatchInventoryParams {
  product_id?: string;
  product_type?: 'raw_material' | 'finished_product';
  location?: string;
  fifo_order?: boolean; // 是否按FIFO顺序返回
}
```

**响应数据:**
```typescript
interface BatchInventoryResponse {
  batches: BatchInventoryItem[];
  summary: {
    total_quantity: number;
    total_value: number;
    batch_count: number;
    avg_unit_cost: number;
  };
}

interface BatchInventoryItem {
  batch_id: string;
  batch_number: string;
  product_id: string;
  product_sku: string;
  product_name: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  inbound_date: string;
  location?: string;
  age_days: number;
}
```

---

## 6. 供应商管理模块 (Supplier Management)

### 6.1 获取供应商列表
```
GET /api/v1/suppliers
```

**查询参数:**
```typescript
interface SupplierListParams extends PaginationParams {
  search?: string;
  type?: 'material' | 'processing' | 'both';
  status?: 'active' | 'inactive';
}
```

**响应数据:**
```typescript
interface Supplier {
  id: string;
  code: string;
  name: string;
  type: 'material' | 'processing' | 'both';
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}
```

### 6.2 创建供应商
```
POST /api/v1/suppliers
```

### 6.3 更新供应商
```
PUT /api/v1/suppliers/{id}
```

---

## 7. 报表统计模块 (Reports & Analytics)

### 7.1 库存报表
```
GET /api/v1/reports/inventory
```

### 7.2 采购报表
```
GET /api/v1/reports/purchase
```

### 7.3 生产报表
```
GET /api/v1/reports/production
```

### 7.4 成本分析
```
GET /api/v1/reports/cost-analysis
```

---

## 8. 系统管理模块 (System Management)

### 8.1 用户管理
```
GET /api/v1/users
POST /api/v1/users
PUT /api/v1/users/{id}
DELETE /api/v1/users/{id}
```

### 8.2 权限管理
```
GET /api/v1/permissions
GET /api/v1/roles
```

### 8.3 系统配置
```
GET /api/v1/system/config
PUT /api/v1/system/config
```

---

## 错误码定义

```typescript
enum ErrorCodes {
  // 通用错误
  INVALID_REQUEST = 'INVALID_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  
  // 业务错误
  INSUFFICIENT_INVENTORY = 'INSUFFICIENT_INVENTORY',
  INVALID_BOM = 'INVALID_BOM',
  DUPLICATE_SKU = 'DUPLICATE_SKU',
  INVALID_BATCH = 'INVALID_BATCH',
  PRODUCTION_NOT_FEASIBLE = 'PRODUCTION_NOT_FEASIBLE',
  PURCHASE_ORDER_CONFIRMED = 'PURCHASE_ORDER_CONFIRMED',
  BATCH_ALREADY_CONSUMED = 'BATCH_ALREADY_CONSUMED',
}
```

这个API设计涵盖了仓库管理系统的所有核心功能，请审查并提出修改建议。
