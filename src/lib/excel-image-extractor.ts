import * as XLSX from 'xlsx';

/**
 * 从Excel文件中提取图片
 * @param file Excel文件
 * @returns 包含图片数据的Map，key为行号，value为图片Buffer数组
 */
export async function extractImagesFromExcel(file: File): Promise<Map<number, Buffer[]>> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(new Uint8Array(arrayBuffer), { 
    sheets: 0,
    cellFormula: false,
    cellStyles: false,
  });

  const imageMap = new Map<number, Buffer[]>();

  // 获取第一个工作表
  // 从workbook中提取图片
  // xlsx库将图片存储在workbook.media中
  if ((workbook as any).media && (workbook as any).media.length > 0) {
    const media = (workbook as any).media;
    
    // 遍历所有媒体文件
    for (let i = 0; i < media.length; i++) {
      const mediaItem = media[i];
      
      if (mediaItem && mediaItem.data) {
        // 将图片数据转换为Buffer
        const imageBuffer = Buffer.from(mediaItem.data);
        
        // 尝试从drawing关系中找到图片所在的行
        // 这是一个简化的实现，实际的行号需要从Excel的内部结构中解析
        if (!imageMap.has(0)) {
          imageMap.set(0, []);
        }
        imageMap.get(0)!.push(imageBuffer);
      }
    }
  }

  return imageMap;
}

/**
 * 获取图片的MIME类型
 * @param buffer 图片Buffer
 * @returns MIME类型
 */
export function getImageMimeType(buffer: Buffer): string {
  // 检查文件签名（magic number）
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'image/png';
  }
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return 'image/gif';
  }
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
    return 'image/webp';
  }
  
  // 默认为JPEG
  return 'image/jpeg';
}

/**
 * 获取图片文件扩展名
 * @param mimeType MIME类型
 * @returns 文件扩展名
 */
export function getImageExtension(mimeType: string): string {
  const extensionMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
  };
  return extensionMap[mimeType] || 'jpg';
}
