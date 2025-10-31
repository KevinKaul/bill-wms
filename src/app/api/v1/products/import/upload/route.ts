import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

/**
 * 上传导入文件到Vercel Blob存储
 * 第一步：客户端上传文件，获取文件URL
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

    // 获取上传的文件
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: '未找到上传文件',
          },
        },
        { status: 400 }
      );
    }

    // 验证文件类型
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/csv',
    ];

    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

    if (!validTypes.includes(file.type) && !hasValidExtension) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_FILE_TYPE',
            message: '请上传Excel或CSV文件（.xlsx、.xls 或 .csv）',
          },
        },
        { status: 400 }
      );
    }

    // 验证文件大小（最大50MB）
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: '文件大小不能超过50MB',
          },
        },
        { status: 400 }
      );
    }

    // 生成唯一的文件名
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const extension = fileName.substring(fileName.lastIndexOf('.'));
    const blobFileName = `product-imports/${userId}/${timestamp}-${randomStr}${extension}`;

    // 上传到Vercel Blob
    const blob = await put(blobFileName, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    console.log('文件上传成功:', {
      url: blob.url,
      size: file.size,
      fileName: file.name,
    });

    return NextResponse.json({
      success: true,
      data: {
        url: blob.url,
        fileName: file.name,
        size: file.size,
      },
    });

  } catch (error) {
    console.error('文件上传失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: error instanceof Error ? error.message : '文件上传失败',
        },
      },
      { status: 500 }
    );
  }
}
