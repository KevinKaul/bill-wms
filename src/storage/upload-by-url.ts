import { promises as fsPromises } from 'fs';
import path from 'path';
import { uploadFile } from './index';

/**
 * 通过远程url下载并上传到R2，返回R2的url和key
 * @param url 远程文件url
 * @param filename 存储到R2的文件名（带后缀）
 * @param folder 可选，R2存储文件夹
 */
export async function uploadByUrl(
  url: string,
  filename: string,
  folder?: string
): Promise<{ url: string; key: string }> {
  // 下载远程内容
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch file from url: ${url}`);
  }
  // 获取内容类型
  const contentType =
    res.headers.get('content-type') || 'application/octet-stream';
  // 读取为Buffer
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  // 上传到R2
  const result = await uploadFile(buffer, filename, contentType, folder);
  return result;
}

/**
 * 下载文件到本地并返回本地文件路径
 * @param url 文件URL
 * @param prefix 文件名前缀（可选）
 * @returns 本地文件路径
 */
export async function downloadFileToLocal(
  url: string,
  prefix?: string
): Promise<string> {
  try {
    // 视频下载到本地
    const response = await fetch(url);
    const buffer = Buffer.from(await response.arrayBuffer());

    // 保存到本地
    const localDir = path.join(process.cwd(), 'tmp', 'downloads');
    await fsPromises.mkdir(localDir, { recursive: true });

    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname;
    const fileName = path.basename(pathname).replace('/', '');
    const localFilePath = path.join(
      localDir,
      prefix ? `${prefix}_${fileName}` : fileName
    );

    await fsPromises.writeFile(localFilePath, buffer);
    console.log(`文件已保存到本地: ${localFilePath}`);

    return localFilePath;
  } catch (error) {
    console.error('下载文件失败:', error);
    throw error;
  }
}
