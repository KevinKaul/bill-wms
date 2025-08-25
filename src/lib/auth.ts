import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

/**
 * 验证用户认证状态
 * @param req Next.js请求对象（可选）
 * @returns 用户ID，如果未认证则抛出错误
 */
export async function requireAuth(req?: NextRequest) {
  try {
    // 首先尝试从Clerk的auth()方法获取认证信息
    const { userId } = await auth();

    if (userId) {
      return userId;
    }

    // 如果没有通过cookies获取到认证信息，尝试从Authorization header获取
    if (req) {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        // TODO: 验证token的逻辑
        // 由于Clerk会自动处理token验证，这里主要是为了支持不同的认证方式
        console.log("检测到Bearer token:", token.substring(0, 10) + "...");
      }
    }

    throw new Error("UNAUTHORIZED");
  } catch (error) {
    console.error("认证错误:", error);
    throw new Error("UNAUTHORIZED");
  }
}

/**
 * 获取当前用户信息（可选认证）
 * @returns 用户ID或null
 */
export async function getCurrentUser() {
  const user = await currentUser();
  return user;
}
