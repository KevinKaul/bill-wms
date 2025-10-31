# 产品导入功能说明

## 概述

产品导入功能采用两步上传方案，避免 Vercel 的 413 FUNCTION_PAYLOAD_TOO_LARGE 错误。

## 工作流程

### 1. 文件上传（客户端直接上传）
- 用户在前端选择 Excel/CSV 文件
- 使用 `@vercel/blob/client` 的 `upload()` 方法
- 文件**直接从浏览器上传到 Vercel Blob**，不经过 Serverless Function
- 后端 API 只负责生成上传 token 和验证权限
- 获得文件的公开访问 URL

### 2. 导入处理（API → 下载 → 处理）
- 前端将文件 URL 发送给导入 API
- API 从 Blob 下载文件
- 解析并导入产品数据

### 3. 清理（可选）
- 导入成功后自动清理临时文件
- 节省 Blob 存储空间

## API 端点

### POST /api/v1/products/import/upload
客户端上传处理路由（生成 token）

**功能：**
1. 验证用户身份
2. 验证文件类型
3. 生成上传 token
4. 处理上传完成回调

**请求：**
```json
{
  "pathname": "product-imports/xxx.xlsx",
  "callbackUrl": "..."
}
```

**响应：**
```json
{
  "url": "https://blob.vercel-storage.com/...",
  "uploadUrl": "...",
  "token": "..."
}
```

**注意：**
- 这个 API 由 `@vercel/blob/client` 的 `handleUpload()` 处理
- 客户端使用 `upload()` 方法时会自动调用此 API

### POST /api/v1/products/import
处理产品导入

**请求方式 1（直接上传，小文件）：**
```
Content-Type: multipart/form-data
Body: FormData with 'file' field
```

**请求方式 2（URL下载，大文件，推荐）：**
```json
{
  "fileUrl": "https://blob.vercel-storage.com/..."
}
```

**响应：**
```json
{
  "success": 10,
  "failed": 2,
  "errors": [
    {
      "row": 5,
      "message": "SKU已存在"
    }
  ]
}
```

### POST /api/v1/products/import/cleanup
清理临时文件

**请求：**
```json
{
  "fileUrl": "https://blob.vercel-storage.com/..."
}
```

## 环境变量配置

需要在 Vercel 项目中配置以下环境变量：

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_xxx
```

### 如何获取 BLOB_READ_WRITE_TOKEN

1. 登录 Vercel Dashboard
2. 进入项目设置
3. 选择 Storage 标签
4. 创建或选择一个 Blob Store
5. Token 会自动添加到环境变量中

## 文件格式要求

### 支持的文件类型
- Excel: `.xlsx`, `.xls`
- CSV: `.csv`

### 文件大小限制
- 最大 50MB

### 模板结构

| 列 | 字段名 | 必填 | 说明 |
|---|--------|------|------|
| 1 | 封面 | 否 | 产品图片 |
| 2 | 商品名称 | 是 | 产品名称 |
| 3 | SKU | 是 | 唯一标识符 |
| 4 | 单价 | 否 | 参考采购价 |
| 5 | 产品描述 | 否 | 详细描述 |

## 技术实现

### 前端流程
```typescript
import { upload } from '@vercel/blob/client';

// 1. 使用客户端直接上传
const blob = await upload(fileName, file, {
  access: 'public',
  handleUploadUrl: '/api/v1/products/import/upload',
});

const fileUrl = blob.url;

// 2. 导入数据
const importResponse = await fetch('/api/v1/products/import', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ fileUrl }),
});

// 3. 清理临时文件（异步）
fetch('/api/v1/products/import/cleanup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ fileUrl }),
}).catch(console.warn);
```

### 后端流程

**上传处理 API:**
```typescript
import { handleUpload } from '@vercel/blob/client';

export async function POST(request: Request) {
  const body = await request.json();
  
  const jsonResponse = await handleUpload({
    body,
    request,
    onBeforeGenerateToken: async (pathname) => {
      // 验证用户和文件类型
      const { userId } = await auth();
      if (!userId) throw new Error('未授权');
      
      return {
        allowedContentTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ...],
        tokenPayload: JSON.stringify({ userId }),
      };
    },
    onUploadCompleted: async ({ blob }) => {
      console.log('上传完成:', blob.url);
    },
  });
  
  return NextResponse.json(jsonResponse);
}
```

**导入 API:**
```typescript
// 从 URL 下载文件
const { fileUrl } = await request.json();
const response = await fetch(fileUrl);
const file = new File([await response.blob()], fileName);
// 然后处理导入...
```

## 优势

1. **完全避免 413 错误**：文件直接从浏览器上传到 Blob，**完全不经过 Serverless Function**
2. **支持大文件**：最大 50MB（可配置）
3. **安全性**：后端 API 验证用户身份和文件类型
4. **自动清理**：节省存储空间
5. **进度反馈**：清晰的两步进度显示
6. **性能优化**：Function 只处理小的 JSON 请求，不处理大文件

## 故障排查

### 上传失败
- 检查 `BLOB_READ_WRITE_TOKEN` 是否正确配置
- 确认文件大小不超过 50MB
- 检查文件格式是否支持
- 检查用户是否已登录（Clerk 认证）

### 本地开发注意事项
- `onUploadCompleted` 回调在 `localhost` 上**不会执行**
- 如需测试完整流程，使用 [ngrok](https://ngrok.com/) 等工具
- 或者直接部署到 Vercel 测试

### 导入失败
- 查看错误详情，检查数据格式
- 确认 SKU 不重复
- 检查必填字段是否完整

### 清理失败
- 清理失败不影响导入结果
- 可以手动在 Vercel Blob Dashboard 中删除文件
