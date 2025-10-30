import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 返回静态模板文件的下载URL
    return NextResponse.json({
      downloadUrl: '/templates/产品导入模板.xlsx',
      message: '模板文件已准备好，点击下载'
    });
  } catch (error) {
    console.error('Template generation error:', error);
    return NextResponse.json(
      { error: 'Failed to get template' },
      { status: 500 }
    );
  }
}
