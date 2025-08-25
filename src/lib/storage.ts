/**
 * 存储服务模块
 * 处理文件上传和获取
 */

/**
 * 上传文件到存储服务
 * @param buffer 文件数据
 * @param fileName 文件名
 * @param contentType 文件类型
 * @param folder 存储文件夹
 * @returns 上传结果
 */
export async function uploadFile(
  buffer: Buffer,
  fileName: string,
  contentType: string,
  folder: string = 'products'
): Promise<{ url: string; fileName: string }> {
  try {
    // 构建FormData对象
    const formData = new FormData();
    
    // 将Buffer转换为Blob
    const blob = new Blob([buffer], { type: contentType });
    formData.append('file', blob, fileName);
    formData.append('folder', folder);
    
    // 调用上传API
    const response = await fetch('/api/storage/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || '上传失败');
    }
    
    return await response.json();
  } catch (error) {
    console.error('上传文件失败:', error);
    throw error;
  }
}

/**
 * 获取文件URL
 * @param path 文件路径
 * @returns 完整的文件URL
 */
export function getFileUrl(path: string | null | undefined): string {
  if (!path) {
    return '/assets/default-product.png';
  }
  
  // 如果已经是完整URL，直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // 否则拼接为相对路径
  return `/uploads/${path}`;
}
