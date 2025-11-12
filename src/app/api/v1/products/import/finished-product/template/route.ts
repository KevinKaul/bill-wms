import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 返回组合产品导入模板的下载链接
    return NextResponse.json({
      downloadUrl: '/templates/组合产品导入模板.xlsx',
    });
  } catch (error) {
    console.error('Template download error:', error);
    return NextResponse.json(
      { error: 'Failed to get template' },
      { status: 500 }
    );
  }
}
