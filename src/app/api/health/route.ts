import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '../utils/auth';

/**
 * GET /api/health - 健康检查接口
 */
export async function GET() {
  try {
    const userId = await getCurrentUser();

    // 测试数据库连接
    const productCount = await prisma.product.count();

    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      productCount,
      user: userId ? 'authenticated' : 'anonymous'
    };

    return NextResponse.json({
      success: true,
      data: healthData
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'HEALTH_CHECK_FAILED',
          message: '健康检查失败'
        }
      },
      { status: 500 }
    );
  }
}
