import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

interface ImportError {
  row: number;
  message: string;
}

// 简单的CSV解析函数
function parseCSV(content: string): string[][] {
  const lines = content.split('\n');
  const rows: string[][] = [];
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    const row: string[] = [];
    let current = '';
    let insideQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    row.push(current.trim());
    rows.push(row);
  }
  
  return rows;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // 读取文件内容
    const content = await file.text();
    const rows = parseCSV(content);

    // 跳过表头行
    const dataRows = rows.slice(1);

    let successCount = 0;
    let failedCount = 0;
    const errors: ImportError[] = [];

    // 处理每一行数据
    for (let i = 0; i < dataRows.length; i++) {
      const rowIndex = i + 2; // 加2因为跳过了表头和0索引
      const row = dataRows[i];

      try {
        // 提取字段
        const sku = row[0]?.toString().trim();
        const name = row[1]?.toString().trim();
        const type = row[2]?.toString().trim();
        const referencePurchasePrice = row[3] ? parseFloat(row[3]) : undefined;
        const guidancePrice = row[4] ? parseFloat(row[4]) : undefined;
        const description = row[5]?.toString().trim();

        // 验证必填字段
        if (!sku || !name) {
          errors.push({
            row: rowIndex,
            message: 'SKU和产品名称为必填项',
          });
          failedCount++;
          continue;
        }

        // 验证产品类型
        const validTypes = ['原材料', '组合产品'];
        if (!type || !validTypes.includes(type)) {
          errors.push({
            row: rowIndex,
            message: '产品类型必须为"原材料"或"组合产品"',
          });
          failedCount++;
          continue;
        }

        // 转换类型
        const productType = type === '原材料' ? 'RAW_MATERIAL' : 'FINISHED_PRODUCT';

        // 检查SKU是否已存在
        const existingProduct = await prisma.product.findUnique({
          where: { sku },
        });

        if (existingProduct) {
          errors.push({
            row: rowIndex,
            message: `SKU "${sku}" 已存在，跳过此行`,
          });
          failedCount++;
          continue;
        }

        // 创建产品
        await prisma.product.create({
          data: {
            sku,
            name,
            type: productType,
            description: description || null,
            referencePurchasePrice:
              productType === 'RAW_MATERIAL' && referencePurchasePrice
                ? referencePurchasePrice
                : null,
            guidancePrice:
              productType === 'FINISHED_PRODUCT' && guidancePrice
                ? guidancePrice
                : null,
            status: 'active',
          },
        });

        successCount++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '未知错误';
        errors.push({
          row: rowIndex,
          message: errorMessage,
        });
        failedCount++;
      }
    }

    return NextResponse.json({
      success: successCount,
      failed: failedCount,
      errors: errors.slice(0, 10), // 只返回前10个错误
    });
  } catch (error) {
    console.error('Product import error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Import failed',
      },
      { status: 500 }
    );
  }
}
