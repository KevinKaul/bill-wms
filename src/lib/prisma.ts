import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

// 添加 Prisma 客户端配置，增加事务超时时间
const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // log: process.env.NEXT_PUBLIC_NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // 添加事务超时配置
    transactionOptions: {
      maxWait: 10000, // 最大等待时间，毫秒
      timeout: 30000, // 事务超时时间，毫秒
    },
  });

export default prisma;
if (process.env.NEXT_PUBLIC_NODE_ENV === "development")
  globalForPrisma.prisma = prisma;
