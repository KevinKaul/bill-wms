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

// 从Excel文件中提取图片（使用ExcelJS）
async function extractImagesFromExcelJS(file: File): Promise<Map<string, Buffer>> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(arrayBuffer) as any);

    const imageMap = new Map<string, Buffer>();

    // 获取所有媒体文件（图片）
    const media = workbook.model.media;
    console.log(`找到 ${media?.length || 0} 个媒体文件`);

    // 遍历所有工作表
    workbook.worksheets.forEach((worksheet, sheetIndex) => {
      try {
        // 方法1: 尝试使用worksheet.getImages()获取精确位置
        const images = worksheet.getImages();
        
        if (images.length > 0) {
          // 如果找到图片，使用精确的位置信息
          images.forEach((image: any) => {
            try {
              const range = image.range;
              if (range && range.tl) {
                const exactRow = range.tl.row;
                const rowIndex = Math.floor(exactRow);
                
                // 只处理前两行的图片（产品封面）
                if (rowIndex <= 1) {
                  const imageId = image.imageId;
                  const imageData = workbook.model.media?.find((m: any) => m.index === imageId);
                  
                  if (imageData && imageData.buffer) {
                    const buffer = Buffer.from(new Uint8Array(imageData.buffer));
                    if (!imageMap.has(worksheet.name)) {
                      imageMap.set(worksheet.name, buffer);
                      console.log(`工作表 "${worksheet.name}" 封面图片已映射（方法1：精确位置）`);
                    }
                  }
                }
              }
            } catch (err) {
              console.error(`处理工作表 "${worksheet.name}" 的图片时出错:`, err);
            }
          });
        } else {
          // 方法2: 备用方法 - 按sheet顺序从media数组匹配
          // 适用于worksheet.getImages()返回空的情况
          if (media && media.length > sheetIndex) {
            const mediaItem = media[sheetIndex];
            if (mediaItem && mediaItem.buffer) {
              const buffer = Buffer.from(new Uint8Array(mediaItem.buffer));
              imageMap.set(worksheet.name, buffer);
              console.log(`工作表 "${worksheet.name}" 封面图片已映射（方法2：顺序匹配）`);
            }
          }
        }
      } catch (err) {
        console.error(`处理工作表 "${worksheet.name}" 时出错:`, err);
      }
    });

    console.log(`成功映射 ${imageMap.size} 个工作表的封面图片`);
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

    // 获取文件URL
    const contentType = request.headers.get('content-type') || '';
    let file: File | null = null;
    let fileUrl: string | null = null;

    if (contentType.includes('application/json')) {
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

    // 只支持Excel文件
    const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                    file.type === 'application/vnd.ms-excel' ||
                    file.name.endsWith('.xlsx') ||
                    file.name.endsWith('.xls');

    if (!isExcel) {
      return NextResponse.json(
        { error: '组合产品导入仅支持Excel文件（.xlsx、.xls）' },
        { status: 400 }
      );
    }

    // 处理Excel文件
    const arrayBuffer = await file.arrayBuffer();
    
    // 先用ExcelJS提取图片
    const imageMap = await extractImagesFromExcelJS(file);
    console.log(`提取到 ${imageMap.size} 张图片`);

    // 再用XLSX读取数据
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { 
      type: 'array',
      codepage: 65001, // UTF-8编码
      cellText: false,
      cellFormula: false,
      cellStyles: false,
    });

    let successCount = 0;
    let failedCount = 0;
    const errors: ImportError[] = [];

    // 遍历所有工作表，每个Sheet对应一个组合产品
    for (const sheetName of workbook.SheetNames) {
      try {
        console.log(`处理工作表: ${sheetName}`);
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: '',
          raw: false,
        }) as string[][];

        if (data.length < 2) {
          errors.push({
            row: 0,
            message: `工作表 "${sheetName}" 数据不足，至少需要表头和一行数据`,
          });
          failedCount++;
          continue;
        }

        // 解析产品基本信息（第一行数据）
        const productRow = data[1]; // 第二行是产品信息
        
        // 列结构：第1列=封面(图片), 第2列=SKU, 第3列=产品名称, 第4列=产品描述
        const sku = productRow[1] ? String(productRow[1]).trim() : '';
        const name = productRow[2] ? String(productRow[2]).trim() : '';
        const description = productRow[3] ? String(productRow[3]).trim() : '';

        // 验证必填字段
        if (!sku) {
          errors.push({
            row: 2,
            message: `工作表 "${sheetName}": SKU为必填项`,
          });
          failedCount++;
          continue;
        }

        if (!name) {
          errors.push({
            row: 2,
            message: `工作表 "${sheetName}": 产品名称为必填项`,
          });
          failedCount++;
          continue;
        }

        // 检查SKU是否已存在
        const existingProduct = await prisma.product.findFirst({
          where: {
            sku,
            deletedAt: null,
          },
        });

        if (existingProduct) {
          errors.push({
            row: 2,
            message: `工作表 "${sheetName}": SKU "${sku}" 已存在，跳过此产品`,
          });
          failedCount++;
          continue;
        }

        // 处理图片上传（如果有）
        let imageUrl: string | null = null;
        if (imageMap.has(sheetName)) {
          const imageBuffer = imageMap.get(sheetName)!;
          imageUrl = await uploadProductImage(imageBuffer, sku);
        }

        // 解析BOM数据（从第4行开始，跳过空行）
        const bomItems: Array<{ componentSku: string; quantity: number }> = [];
        
        // 查找BOM数据开始的行（通常在第4行或第5行）
        let bomStartRow = 3; // 从第4行开始（索引3）
        
        // 跳过空行，找到BOM表头
        while (bomStartRow < data.length && !data[bomStartRow][0]) {
          bomStartRow++;
        }
        
        // 如果找到了BOM表头，继续解析BOM数据
        if (bomStartRow < data.length) {
          // 跳过BOM表头行
          bomStartRow++;
          
          for (let i = bomStartRow; i < data.length; i++) {
            const bomRow = data[i];
            
            // 跳过空行
            if (!bomRow[0] && !bomRow[1]) continue;
            
            const componentSku = bomRow[0] ? String(bomRow[0]).trim() : '';
            const quantityStr = bomRow[1] ? String(bomRow[1]).trim() : '';
            
            if (!componentSku || !quantityStr) continue;
            
            const quantity = parseFloat(quantityStr);
            if (isNaN(quantity) || quantity <= 0) {
              errors.push({
                row: i + 1,
                message: `工作表 "${sheetName}": BOM数量必须为正数`,
              });
              continue;
            }
            
            bomItems.push({ componentSku, quantity });
          }
        }

        // 验证BOM项（组合产品必须至少有一个BOM项）
        if (bomItems.length === 0) {
          errors.push({
            row: 2,
            message: `工作表 "${sheetName}": 组合产品必须至少包含一个原材料`,
          });
          failedCount++;
          continue;
        }

        // 查找所有BOM中的原材料
        const componentSkus = bomItems.map(item => item.componentSku);
        const components = await prisma.product.findMany({
          where: {
            sku: { in: componentSkus },
            type: 'RAW_MATERIAL',
            deletedAt: null,
          },
        });

        // 验证所有原材料是否存在
        const foundSkus = new Set(components.map(c => c.sku));
        const missingSkus = componentSkus.filter(sku => !foundSkus.has(sku));
        
        if (missingSkus.length > 0) {
          errors.push({
            row: 2,
            message: `工作表 "${sheetName}": 以下原材料SKU不存在或不是原材料类型: ${missingSkus.join(', ')}`,
          });
          failedCount++;
          continue;
        }

        // 创建SKU到产品ID的映射
        const skuToIdMap = new Map(components.map(c => [c.sku, c.id]));

        // 计算指导单价（基于BOM成本）
        let guidancePrice = 0;
        for (const bomItem of bomItems) {
          const component = components.find(c => c.sku === bomItem.componentSku);
          if (component && component.referencePurchasePrice) {
            guidancePrice += Number(component.referencePurchasePrice) * bomItem.quantity;
          }
        }

        // 使用事务创建产品和BOM项
        await prisma.$transaction(async (tx) => {
          // 创建组合产品
          const product = await tx.product.create({
            data: {
              sku,
              name,
              type: 'FINISHED_PRODUCT',
              description: description || null,
              image: imageUrl || null,
              guidancePrice: guidancePrice > 0 ? guidancePrice : null,
              referencePurchasePrice: null,
              status: 'active',
            },
          });

          // 去重：同一个原料只保留一条记录，合并数量
          const bomMap = new Map<string, number>();
          for (const bomItem of bomItems) {
            const existing = bomMap.get(bomItem.componentSku) || 0;
            bomMap.set(bomItem.componentSku, existing + bomItem.quantity);
          }

          // 创建BOM项
          const bomItemsData = Array.from(bomMap.entries()).map(([componentSku, quantity]) => ({
            productId: product.id,
            componentId: skuToIdMap.get(componentSku)!,
            quantity,
          }));

          await tx.bOMItem.createMany({
            data: bomItemsData,
          });

          console.log(`成功创建组合产品: ${sku}, BOM项数: ${bomItemsData.length}`);
        });

        successCount++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        errors.push({
          row: 0,
          message: `工作表 "${sheetName}": ${errorMessage}`,
        });
        failedCount++;
        console.error(`处理工作表 "${sheetName}" 失败:`, error);
      }
    }

    return NextResponse.json({
      success: successCount,
      failed: failedCount,
      errors: errors.slice(0, 10), // 只返回前10个错误
    });
  } catch (error) {
    console.error('Finished product import error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Import failed',
      },
      { status: 500 }
    );
  }
}
