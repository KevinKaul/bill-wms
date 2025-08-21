import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/storage';
import { requireAuth } from '../../utils/auth';

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    await requireAuth(request);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: { message: '请选择要上传的文件' } },
        { status: 400 }
      );
    }

    // 验证文件类型（只允许图片）
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: { message: '只支持 JPEG、PNG、WebP 和 GIF 格式的图片' } },
        { status: 400 }
      );
    }

    // 验证文件大小（最大5MB）
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: { message: '文件大小不能超过 5MB' } },
        { status: 400 }
      );
    }

    // 转换文件为Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // 上传到存储服务
    const result = await uploadFile(
      buffer,
      file.name,
      file.type,
      folder || 'products'
    );

    return NextResponse.json(result);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('File upload error:', error);

    const message = error instanceof Error ? error.message : '文件上传失败';
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}
