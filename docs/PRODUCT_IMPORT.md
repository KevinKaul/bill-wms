# 产品导入功能说明

## 概述

产品导入功能采用两步上传方案，避免 Vercel 的 413 FUNCTION_PAYLOAD_TOO_LARGE 错误。

## 工作流程

### 1. 文件上传（客户端 → Vercel Blob）
- 用户在前端选择 Excel/CSV 文件
- 文件直接上传到 Vercel Blob 存储
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
上传文件到 Blob 存储

**请求：**
```
Content-Type: multipart/form-data
Body: FormData with 'file' field
```

**响应：**
```json
{
  "success": true,
  "data": {
    "url": "https://blob.vercel-storage.com/...",
    "fileName": "产品导入.xlsx",
    "size": 12345
  }
}
```

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
// 1. 上传文件
const uploadResponse = await fetch('/api/v1/products/import/upload', {
  method: 'POST',
  body: formData,
});
const { data: { url: fileUrl } } = await uploadResponse.json();

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
```typescript
// 导入 API 支持两种方式
if (contentType.includes('multipart/form-data')) {
  // 方式1：直接上传（兼容旧版本）
  file = formData.get('file');
} else if (contentType.includes('application/json')) {
  // 方式2：URL下载（推荐）
  const { fileUrl } = await request.json();
  const response = await fetch(fileUrl);
  file = new File([await response.blob()], fileName);
}
```

## 优势

1. **避免 413 错误**：文件不经过 Serverless Function，直接上传到 Blob
2. **支持大文件**：最大支持 50MB 文件
3. **向后兼容**：仍支持直接上传小文件
4. **自动清理**：导入后自动删除临时文件
5. **进度反馈**：清晰的两步进度显示

## 故障排查

### 上传失败
- 检查 `BLOB_READ_WRITE_TOKEN` 是否正确配置
- 确认文件大小不超过 50MB
- 检查文件格式是否支持

### 导入失败
- 查看错误详情，检查数据格式
- 确认 SKU 不重复
- 检查必填字段是否完整

### 清理失败
- 清理失败不影响导入结果
- 可以手动在 Vercel Blob Dashboard 中删除文件
