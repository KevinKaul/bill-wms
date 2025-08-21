# 产品管理 API 接口文档

## 概述

本文档定义了仓库管理系统中产品管理模块的API接口。所有接口都需要Clerk认证，支持RESTful风格的CRUD操作。

## 认证

所有API请求都需要通过Clerk进行身份验证：
- 使用Clerk的`auth()`函数获取用户信息
- 中间件已配置保护所有`/api/*`路由
- 请求头需要包含有效的Clerk token

## 数据库

- 使用Prisma作为ORM
- 数据库Schema已在`prisma/schema.prisma`中定义
- 主要表：`products`、`bom_items`

## API 接口规范

### 基础响应格式

```typescript
// 成功响应
{
  "success": true,
  "data": any,
  "message": string
}

// 错误响应  
{
  "success": false,
  "error": {
    "code": string,
    "message": string,
    "details"?: any
  }
}

// 分页响应
{
  "success": true,
  "data": {
    "items": any[],
    "pagination": {
      "page": number,
      "pageSize": number,
      "total": number,
      "totalPages": number
    }
  }
}
```

### 1. 产品列表 - GET /api/products

**功能**：获取产品列表，支持分页、搜索、筛选

**查询参数**：
```typescript
{
  page?: number;          // 页码，默认1
  pageSize?: number;      // 每页数量，默认10
  search?: string;        // 搜索关键词（SKU或名称）
  type?: ProductType;     // 产品类型筛选
  sortBy?: string;        // 排序字段
  sortOrder?: 'asc' | 'desc'; // 排序顺序
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "cm7xk1234",
        "sku": "RAW-001",
        "name": "优质棉花",
        "type": "RAW_MATERIAL",
        "image": "https://...",
        "referencePurchasePrice": 15.50,
        "guidancePrice": null,
        "calculatedCost": null,
        "bomItems": [],
        "createdAt": "2024-01-15T08:30:00Z",
        "updatedAt": "2024-01-15T08:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

### 2. 创建产品 - POST /api/products

**功能**：创建新产品

**请求体**：
```typescript
{
  sku: string;                    // 必填，产品SKU
  name: string;                   // 必填，产品名称
  type: ProductType;              // 必填，产品类型
  image?: string;                 // 可选，图片URL
  referencePurchasePrice?: number; // 原材料：参考采购单价
  guidancePrice?: number;         // 组合产品：指导单价
  bomItems?: {                    // 组合产品：BOM构成
    componentId: string;
    quantity: number;
  }[];
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "id": "cm7xk5678",
    "sku": "RAW-002",
    "name": "蚕丝原料",
    "type": "RAW_MATERIAL",
    "referencePurchasePrice": 25.80,
    "createdAt": "2024-01-20T10:00:00Z",
    "updatedAt": "2024-01-20T10:00:00Z"
  },
  "message": "产品创建成功"
}
```

### 3. 获取产品详情 - GET /api/products/[id]

**功能**：获取指定产品的详细信息

**路径参数**：
- `id`: 产品ID

**响应示例**：
```json
{
  "success": true,
  "data": {
    "id": "cm7xk1234",
    "sku": "FIN-001",
    "name": "精品手工花环",
    "type": "FINISHED_PRODUCT",
    "image": "https://...",
    "guidancePrice": 128.00,
    "calculatedCost": 95.50,
    "bomItems": [
      {
        "id": "bom1",
        "componentId": "cm7xk1234",
        "quantity": 10,
        "component": {
          "id": "cm7xk1234",
          "sku": "RAW-001",
          "name": "优质棉花",
          "referencePurchasePrice": 15.50
        }
      }
    ],
    "createdAt": "2024-01-17T10:45:00Z",
    "updatedAt": "2024-01-17T10:45:00Z"
  }
}
```

### 4. 更新产品 - PUT /api/products/[id]

**功能**：更新指定产品信息

**路径参数**：
- `id`: 产品ID

**请求体**：同创建产品接口

**响应示例**：
```json
{
  "success": true,
  "data": {
    "id": "cm7xk1234",
    "sku": "RAW-001",
    "name": "优质棉花（更新）",
    "type": "RAW_MATERIAL",
    "referencePurchasePrice": 16.00,
    "updatedAt": "2024-01-20T14:30:00Z"
  },
  "message": "产品更新成功"
}
```

### 5. 删除产品 - DELETE /api/products/[id]

**功能**：删除指定产品

**路径参数**：
- `id`: 产品ID

**响应示例**：
```json
{
  "success": true,
  "message": "产品删除成功"
}
```

### 6. 获取原材料列表 - GET /api/products/raw-materials

**功能**：获取所有原材料产品（用于BOM配置）

**查询参数**：
```typescript
{
  search?: string;    // 搜索关键词
}
```

**响应示例**：
```json
{
  "success": true,
  "data": [
    {
      "id": "cm7xk1234",
      "sku": "RAW-001",
      "name": "优质棉花",
      "referencePurchasePrice": 15.50
    }
  ]
}
```

### 7. 获取产品统计 - GET /api/products/stats

**功能**：获取产品统计信息

**响应示例**：
```json
{
  "success": true,
  "data": {
    "totalProducts": 25,
    "rawMaterials": 15,
    "finishedProducts": 10,
    "lowStockProducts": 3
  }
}
```

### 8. 批量操作 - POST /api/products/batch

**功能**：批量删除产品

**请求体**：
```typescript
{
  action: 'delete';
  productIds: string[];
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "processed": 5,
    "failed": 0
  },
  "message": "批量操作完成"
}
```

## 错误代码

| 错误代码 | HTTP状态码 | 描述 |
|---------|-----------|------|
| UNAUTHORIZED | 401 | 未授权访问 |
| FORBIDDEN | 403 | 权限不足 |
| NOT_FOUND | 404 | 产品不存在 |
| VALIDATION_ERROR | 400 | 请求参数验证失败 |
| SKU_EXISTS | 409 | SKU已存在 |
| CANNOT_DELETE | 409 | 产品正在使用，无法删除 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |

## 实现计划

### 第一阶段：基础CRUD
- [x] 产品列表接口
- [x] 创建产品接口  
- [x] 获取产品详情接口
- [x] 更新产品接口
- [x] 删除产品接口

### 第二阶段：增强功能
- [x] 原材料列表接口
- [x] 产品统计接口
- [x] 批量操作接口
- [x] 文件上传处理

### 第三阶段：优化
- [ ] 缓存策略
- [ ] 权限控制
- [ ] 操作日志
- [ ] 数据导入导出

## 文件结构

```
src/app/api/
├── products/
│   ├── route.ts                    # GET /api/products, POST /api/products
│   ├── [id]/
│   │   └── route.ts               # GET/PUT/DELETE /api/products/[id]
│   ├── raw-materials/
│   │   └── route.ts               # GET /api/products/raw-materials  
│   ├── stats/
│   │   └── route.ts               # GET /api/products/stats
│   └── batch/
│       └── route.ts               # POST /api/products/batch
└── utils/
    ├── auth.ts                    # 认证工具函数
    ├── validation.ts              # 数据验证
    ├── response.ts                # 响应格式化
    └── error.ts                   # 错误处理
```

## 数据验证

使用Zod进行请求数据验证，确保数据安全性和一致性：

```typescript
// 产品创建验证Schema
export const createProductSchema = z.object({
  sku: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  type: z.nativeEnum(ProductType),
  image: z.string().url().optional(),
  referencePurchasePrice: z.number().positive().optional(),
  guidancePrice: z.number().positive().optional(),
  bomItems: z.array(z.object({
    componentId: z.string().min(1),
    quantity: z.number().positive()
  })).optional()
});
```

## 安全考虑

1. **认证**：所有接口都需要Clerk认证
2. **数据验证**：使用Zod严格验证所有输入数据
3. **SQL注入防护**：使用Prisma ORM防止SQL注入
4. **权限控制**：基于用户角色控制操作权限
5. **操作日志**：记录所有数据变更操作

## 性能优化

1. **查询优化**：使用适当的索引和查询策略
2. **分页加载**：避免一次性加载大量数据
3. **缓存策略**：对频繁查询的数据进行缓存
4. **并发控制**：处理并发修改冲突
