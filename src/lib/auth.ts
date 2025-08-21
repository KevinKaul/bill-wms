import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

/**
 * 验证用户认证状态
 * @param req Next.js请求对象
 * @returns 用户ID，如果未认证则抛出错误
 */
export async function requireAuth(req?: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('UNAUTHORIZED');
  }

  return userId;
}

/**
 * 获取当前用户信息（可选认证）
 * @returns 用户ID或null
 */
export async function getCurrentUser() {
  const { userId } = await auth();
  return userId;
}
