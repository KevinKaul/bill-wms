# 数据库设置说明

## 1. 环境变量配置

请在项目根目录创建 `.env` 文件，并添加以下配置：

```env
# 数据库连接
DATABASE_URL="postgresql://username:password@localhost:5432/bill_wms?schema=public"

# 认证配置 (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/auth/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/auth/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard/overview"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard/overview"
```

## 2. 数据库迁移

配置好数据库连接后，运行以下命令创建数据库表：

```bash
# 生成并应用数据库迁移
npx prisma migrate dev --name init

# 如果需要重置数据库
npx prisma migrate reset
```

## 3. 数据库结构说明

根据需求文档，已创建以下数据表：

### 核心业务表
- **products** - 产品管理（原材料和成品）
- **bom_items** - BOM产品构成表
- **suppliers** - 供应商管理
- **purchase_orders** - 采购单主表
- **purchase_order_items** - 采购单明细表
- **process_orders** - 加工单表
- **material_usages** - 物料使用记录（FIFO领料）

### 库存管理表
- **raw_material_batches** - 原材料批次库存
- **finished_product_batches** - 成品批次库存

### 系统管理表
- **operation_logs** - 操作日志记录

## 4. 主要功能特性

✅ **产品管理** - 支持原材料和组合产品分类管理
✅ **BOM管理** - 产品构成和成本自动计算
✅ **采购管理** - 完整的采购流程和状态跟踪
✅ **库存管理** - 基于批次的FIFO库存管理
✅ **加工管理** - 生产加工和成本核算
✅ **供应商管理** - 统一的供应商结算中心
✅ **操作日志** - 完整的操作审计跟踪

## 5. 数据库连接配置

### PostgreSQL 本地安装
```bash
# macOS 使用 Homebrew
brew install postgresql
brew services start postgresql

# 创建数据库
createdb bill_wms
```

### 使用 Docker
```bash
docker run --name bill-wms-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=bill_wms -p 5432:5432 -d postgres:15
```

### 云数据库推荐
- **Neon** - 免费的 PostgreSQL 云服务
- **Supabase** - 开源的 Firebase 替代方案
- **PlanetScale** - MySQL 兼容的云数据库

## 6. 开发工具

```bash
# 查看数据库结构
npx prisma studio

# 生成 Prisma Client
npx prisma generate

# 验证 schema
npx prisma validate
```
