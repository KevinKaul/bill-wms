import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { uploadFile } from '@/storage';
import { getImageMimeType, getImageExtension } from '@/lib/excel-image-extractor';

interface ImportError {
  row: number;
  message: string;
}

// 改进的CSV解析函数，更好地处理编码
function parseCSV(content: string): string[][] {
  // 清理BOM标记
  const cleanContent = content.replace(/^\uFEFF/, '');
  const lines = cleanContent.split(/\r?\n/);
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

// 检测文件编码的函数
function detectEncoding(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  
  // 检测BOM
  if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
    return 'utf-8';
  }
  
  // 简单的中文检测，如果有高位字节可能是GBK
  let hasHighBytes = false;
  for (let i = 0; i < Math.min(bytes.length, 1000); i++) {
    if (bytes[i] > 127) {
      hasHighBytes = true;
      break;
    }
  }
  
  return hasHighBytes ? 'gbk' : 'utf-8';
}

// 从Excel文件中提取图片（使用ExcelJS）
async function extractImagesFromExcelJS(file: File): Promise<Map<number, Buffer>> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(arrayBuffer) as any);

    const imageMap = new Map<number, Buffer>();

    // 获取第一个工作表
    const worksheet = workbook.worksheets[0];
    if (!worksheet) return imageMap;

    // 从workbook.media中提取图片
    const media = (workbook as any).media;
    if (media && media.length > 0) {
      media.forEach((mediaItem: any, index: number) => {
        if (mediaItem && mediaItem.buffer) {
          imageMap.set(index, mediaItem.buffer);
        }
      });
    }

    return imageMap;
  } catch (error) {
    console.error('Failed to extract images with ExcelJS:', error);
    return new Map();
  }
}

// 上传图片到存储服务
async function uploadProductImage(imageBuffer: Buffer, sku: string): Promise<string | null> {
  try {
    const mimeType = getImageMimeType(imageBuffer);
    const extension = getImageExtension(mimeType);
    const fileName = `${sku}-${Date.now()}.${extension}`;
    
    const result = await uploadFile(
      imageBuffer,
      fileName,
      mimeType,
      `${process.env.NODE_ENV}/products`
    );
    
    return result.url || null;
  } catch (error) {
    console.error('Failed to upload product image:', error);
    return null;
  }
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

    // 支持两种方式：
    // 1. 直接上传文件（小文件，兼容性）
    // 2. 通过URL下载文件（大文件，避免413错误）
    const contentType = request.headers.get('content-type') || '';
    let file: File | null = null;
    let fileUrl: string | null = null;

    if (contentType.includes('multipart/form-data')) {
      // 方式1：直接上传
      const formData = await request.formData();
      file = formData.get('file') as File;
    } else if (contentType.includes('application/json')) {
      // 方式2：通过URL下载
      const body = await request.json();
      fileUrl = body.fileUrl;
      
      if (!fileUrl) {
        return NextResponse.json(
          { error: 'No file URL provided' },
          { status: 400 }
        );
      }

      // 从 URL 下载文件
      console.log('从 URL 下载文件:', fileUrl);
      const fileResponse = await fetch(fileUrl);
      if (!fileResponse.ok) {
        throw new Error('下载文件失败');
      }

      const blob = await fileResponse.blob();
      const fileName = fileUrl.split('/').pop() || 'import.xlsx';
      file = new File([blob], fileName, { type: blob.type });
      console.log('文件下载成功:', { name: file.name, size: file.size });
    }

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // 判断文件类型
    const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                    file.type === 'application/vnd.ms-excel' ||
                    file.name.endsWith('.xlsx') ||
                    file.name.endsWith('.xls');

    let rows: string[][] = [];
    let imageMap = new Map<number, Buffer>();

    if (isExcel) {
      // 处理Excel文件 - 使用ExcelJS提取图片
      const arrayBuffer = await file.arrayBuffer();
      
      // 先用ExcelJS提取图片
      imageMap = await extractImagesFromExcelJS(file);
      console.log(`提取到 ${imageMap.size} 张图片`);

      // 再用XLSX读取数据，指定编码选项
      const workbook = XLSX.read(new Uint8Array(arrayBuffer), { 
        type: 'array',
        codepage: 65001, // UTF-8编码
        cellText: false,
        cellFormula: false,
        cellStyles: false,
      });

      // 读取第一个工作表的数据
      const sheetName = workbook.SheetNames[0];
      if (sheetName) {
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: '', // 空单元格默认值
          raw: false, // 不使用原始值，确保字符串格式
        });
        rows = data as string[][];
      }
    } else {
      // 处理CSV文件，自动检测编码
      const arrayBuffer = await file.arrayBuffer();
      const encoding = detectEncoding(arrayBuffer);
      
      let content: string;
      try {
        if (encoding === 'gbk') {
          // 使用GBK解码器
          const decoder = new TextDecoder('gbk');
          content = decoder.decode(arrayBuffer);
        } else {
          // 使用UTF-8解码器
          const decoder = new TextDecoder('utf-8');
          content = decoder.decode(arrayBuffer);
        }
      } catch (error) {
        console.error('编码解析失败:', error);
        // 如果都失败，尝试默认方式
        content = await file.text();
      }
      
      rows = parseCSV(content);
    }

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
        // 新的列结构：第1列=封面(图片), 第2列=商品名称, 第3列=SKU, 第4列=单价, 第5列=产品描述
        // XLSX读取时会保留空列，所以实际的列索引是：
        // row[0] = 图片列（空）
        // row[1] = 商品名称
        // row[2] = SKU
        // row[3] = 单价
        // row[4] = 产品描述
        // 确保字符串正确处理，避免乱码
        const name = row[1] ? String(row[1]).trim() : '';
        const sku = row[2] ? String(row[2]).trim() : '';
        const unitPrice = row[3] ? parseFloat(String(row[3])) : undefined;
        const description = row[4] ? String(row[4]).trim() : '';
        

        // 验证必填字段
        if (!sku) {
          errors.push({
            row: rowIndex,
            message: 'SKU为必填项',
          });
          failedCount++;
          continue;
        }

        if (!name) {
          errors.push({
            row: rowIndex,
            message: '商品名称为必填项',
          });
          failedCount++;
          continue;
        }

        // 默认所有导入的产品都是原材料
        // 组合产品需要手动创建
        const productType = 'RAW_MATERIAL';

        // 检查SKU是否已存在（只检查未删除的产品）
        const existingProduct = await prisma.product.findFirst({
          where: {
            sku,
            deletedAt: null,
          },
        });

        if (existingProduct) {
          errors.push({
            row: rowIndex,
            message: `SKU "${sku}" 已存在，跳过此行`,
          });
          failedCount++;
          continue;
        }

        // 处理图片上传（第一列是封面图片）
        let imageUrl: string | null = null;
        if (imageMap.has(i)) {
          const imageBuffer = imageMap.get(i)!;
          imageUrl = await uploadProductImage(imageBuffer, sku);
        }

        // 创建产品（默认都是原材料）
        await prisma.product.create({
          data: {
            sku,
            name,
            type: productType,
            description: description || null,
            image: imageUrl || null,
            // 原材料使用参考采购价
            referencePurchasePrice: unitPrice || null,
            guidancePrice: null,
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
