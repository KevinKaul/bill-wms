import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

/**
 * 客户端上传处理路由
 * 生成上传 token 并处理上传完成回调
 */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname: string) => {
        // 验证用户身份
        const { userId } = await auth();
        if (!userId) {
          throw new Error('未授权访问');
        }

        // 验证文件路径和类型
        const validExtensions = ['.xlsx', '.xls', '.csv'];
        const hasValidExtension = validExtensions.some(ext => 
          pathname.toLowerCase().endsWith(ext)
        );

        if (!hasValidExtension) {
          throw new Error('请上传Excel或CSV文件（.xlsx、.xls 或 .csv）');
        }

        // 返回允许的配置
        return {
          allowedContentTypes: [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv',
            'application/csv',
          ],
          tokenPayload: JSON.stringify({
            userId,
            uploadedAt: new Date().toISOString(),
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // 上传完成回调
        console.log('文件上传完成:', {
          blob,
          tokenPayload,
        });

        // 这里可以做一些后续处理，比如记录到数据库
        // 但对于导入功能，我们只需要返回 URL 即可
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('客户端上传处理失败:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
