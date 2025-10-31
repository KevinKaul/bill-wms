import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';

/**
 * 清理导入后的临时文件
 * 可选：在导入成功后删除 Blob 存储中的临时文件以节省空间
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '未授权访问',
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fileUrl } = body;

    if (!fileUrl) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: '未提供文件URL',
          },
        },
        { status: 400 }
      );
    }

    // 删除 Blob 文件
    await del(fileUrl);

    console.log('临时文件已清理:', fileUrl);

    return NextResponse.json({
      success: true,
      message: '文件已清理',
    });

  } catch (error) {
    console.error('清理文件失败:', error);
    // 清理失败不影响主流程，只记录错误
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CLEANUP_ERROR',
          message: error instanceof Error ? error.message : '清理文件失败',
        },
      },
      { status: 500 }
    );
  }
}
