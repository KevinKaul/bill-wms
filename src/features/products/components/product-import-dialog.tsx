'use client';

import { useState, useRef } from 'react';
import { upload } from '@vercel/blob/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IconUpload, IconDownload, IconAlertCircle, IconCircleCheckFilled } from '@tabler/icons-react';
import { toast } from 'sonner';

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    message: string;
  }>;
}

interface ProductImportDialogProps {
  onRefresh?: () => void;
}

export function ProductImportDialog({ onRefresh }: ProductImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [activeTab, setActiveTab] = useState<'raw-material' | 'finished-product'>('raw-material');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const finishedProductFileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = async (type: 'raw-material' | 'finished-product') => {
    try {
      const endpoint = type === 'raw-material' 
        ? '/api/v1/products/import/template'
        : '/api/v1/products/import/finished-product/template';
      
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to download template');
      
      const data = await response.json();
      const downloadUrl = data.downloadUrl;
      
      // 直接打开静态文件下载
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = type === 'raw-material' ? '原材料导入模板.xlsx' : '组合产品导入模板.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('模板下载成功');
    } catch (error) {
      toast.error('模板下载失败');
      console.error(error);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, type: 'raw-material' | 'finished-product') => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/csv',
    ];

    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

    if (!validTypes.includes(file.type) && !hasValidExtension) {
      toast.error('请上传Excel或CSV文件（.xlsx、.xls 或 .csv）');
      return;
    }

    setLoading(true);
    setProgress(0);
    setResult(null);

    try {
      // 第一步：使用客户端直接上传到 Blob 存储
      setProgress(10);
      
      // 生成唯一文件名
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const extension = file.name.substring(file.name.lastIndexOf('.'));
      const blobFileName = `product-imports/${timestamp}-${randomStr}${extension}`;

      // 使用 @vercel/blob/client 的 upload 方法
      const blob = await upload(blobFileName, file, {
        access: 'public',
        handleUploadUrl: '/api/v1/products/import/upload',
      });

      const fileUrl = blob.url;
      console.log('文件上传成功:', fileUrl);

      // 第二步：调用导入 API，传递文件 URL
      setProgress(30);
      
      // 模拟进度
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 5, 90));
      }, 500);

      const endpoint = type === 'raw-material'
        ? '/api/v1/products/import'
        : '/api/v1/products/import/finished-product';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileUrl }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '导入失败');
      }

      const data = await response.json();
      setResult(data);

      if (data.failed === 0) {
        toast.success(`成功导入 ${data.success} 个产品`);
      } else {
        toast.warning(
          `导入完成：成功 ${data.success} 个，失败 ${data.failed} 个`
        );
      }
      
      // 清理临时文件（异步，不阻塞主流程）
      // 注意：在本地开发环境 (localhost) 下，清理可能不会立即执行
      fetch('/api/v1/products/import/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl }),
      }).catch(err => console.warn('清理临时文件失败:', err));
      
      // 只要有成功导入的产品，就刷新页面
      // if (data.success > 0) {
      //   // 延迟一下再刷新，让用户看到成功提示
      //   setTimeout(() => {
      //     // 调用刷新回调
      //     if (onRefresh) {
      //       onRefresh();
      //     }
      //     // 关闭对话框
      //     setOpen(false);
      //     setResult(null);
      //     setProgress(0);
      //   }, 1000);
      // }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : '导入失败，请重试'
      );
      setProgress(0);
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setResult(null);
      setProgress(0);
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default" className="cursor-pointer text-xs md:text-sm">
          <IconUpload className="mr-2 h-4 w-4" />
          导入产品
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>导入产品</DialogTitle>
          <DialogDescription>
            选择导入类型并上传Excel文件批量导入产品信息
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="raw-material">导入原材料</TabsTrigger>
            <TabsTrigger value="finished-product">导入组合产品</TabsTrigger>
          </TabsList>

          <TabsContent value="raw-material" className="space-y-4 mt-4">
          {!result ? (
            <>
              {/* 下载模板 */}
              <div className="rounded-lg border border-dashed border-gray-300 p-4">
                <p className="mb-2 text-sm font-medium">第一步：下载模板</p>
                <p className="mb-3 text-xs text-gray-600">
                  下载产品导入模板，按照模板格式填写产品信息
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTemplate('raw-material')}
                  className="w-full"
                >
                  <IconDownload className="mr-2 h-4 w-4" />
                  下载模板
                </Button>
              </div>

              {/* 上传文件 */}
              <div className="rounded-lg border border-dashed border-gray-300 p-4">
                <p className="mb-2 text-sm font-medium">第二步：上传文件</p>
                <p className="mb-3 text-xs text-gray-600">
                  选择填写好的Excel或CSV文件进行导入
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => handleFileSelect(e, 'raw-material')}
                  disabled={loading}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="w-full"
                >
                  <IconUpload className="mr-2 h-4 w-4" />
                  {loading ? '导入中...' : '选择文件'}
                </Button>
              </div>

              {/* 进度条 */}
              {loading && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <div className="text-xs text-gray-600 text-center space-y-1">
                    <p className="font-medium">
                      {progress < 30 ? '步骤 1/2: 上传文件到云存储...' : '步骤 2/2: 处理导入数据...'}
                    </p>
                    <p>{progress}%</p>
                  </div>
                </div>
              )}

              {/* 提示信息 */}
              <Alert>
                <IconAlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>第1列：产品封面图片（可选）</li>
                    <li>第2列：商品名称（必填）</li>
                    <li>第3列：SKU（必填）</li>
                    <li>第4列：参考采购价（可选）</li>
                    <li>第5列：产品描述（可选）</li>
                    <li className="text-orange-600 font-medium">⚠️ 此模板仅用于导入原材料</li>
                    <li>重复的SKU将被跳过</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </>
          ) : (
            <>
              {/* 导入结果 - 原材料 */}
              <div className="space-y-3">
                {result.failed === 0 ? (
                  <Alert className="border-green-200 bg-green-50">
                    <IconCircleCheckFilled className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      导入成功！已导入 {result.success} 个产品
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <IconAlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      导入完成：成功 {result.success} 个，失败 {result.failed} 个
                    </AlertDescription>
                  </Alert>
                )}

                {/* 错误列表 */}
                {result.errors.length > 0 && (
                  <div className="rounded-lg bg-red-50 p-3">
                    <p className="mb-2 text-xs font-medium text-red-900">
                      错误详情：
                    </p>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {result.errors.map((error, index) => (
                        <p key={index} className="text-xs text-red-700">
                          第 {error.row} 行：{error.message}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          </TabsContent>

          <TabsContent value="finished-product" className="space-y-4 mt-4">
          {!result ? (
            <>
              {/* 下载模板 */}
              <div className="rounded-lg border border-dashed border-gray-300 p-4">
                <p className="mb-2 text-sm font-medium">第一步：下载模板</p>
                <p className="mb-3 text-xs text-gray-600">
                  下载组合产品导入模板，每个Sheet对应一个组合产品
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTemplate('finished-product')}
                  className="w-full"
                >
                  <IconDownload className="mr-2 h-4 w-4" />
                  下载模板
                </Button>
              </div>

              {/* 上传文件 */}
              <div className="rounded-lg border border-dashed border-gray-300 p-4">
                <p className="mb-2 text-sm font-medium">第二步：上传文件</p>
                <p className="mb-3 text-xs text-gray-600">
                  选择填写好的Excel文件进行导入
                </p>
                <input
                  ref={finishedProductFileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => handleFileSelect(e, 'finished-product')}
                  disabled={loading}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => finishedProductFileInputRef.current?.click()}
                  disabled={loading}
                  className="w-full"
                >
                  <IconUpload className="mr-2 h-4 w-4" />
                  {loading ? '导入中...' : '选择文件'}
                </Button>
              </div>

              {/* 进度条 */}
              {loading && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <div className="text-xs text-gray-600 text-center space-y-1">
                    <p className="font-medium">
                      {progress < 30 ? '步骤 1/2: 上传文件到云存储...' : '步骤 2/2: 处理导入数据...'}
                    </p>
                    <p>{progress}%</p>
                  </div>
                </div>
              )}

              {/* 提示信息 */}
              <Alert>
                <IconAlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>每个Sheet对应一个组合产品</li>
                    <li>必填列：SKU、产品名称、产品描述</li>
                    <li>第1列：产品封面图片（可选）</li>
                    <li>BOM结构：原材料SKU、需要数量</li>
                    <li>系统会自动关联BOM中的原材料</li>
                    <li>重复的SKU将被跳过</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </>
          ) : (
            <>
              {/* 导入结果 - 组合产品 */}
              <div className="space-y-3">
                {result.failed === 0 ? (
                  <Alert className="border-green-200 bg-green-50">
                    <IconCircleCheckFilled className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      导入成功！已导入 {result.success} 个产品
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <IconAlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      导入完成：成功 {result.success} 个，失败 {result.failed} 个
                    </AlertDescription>
                  </Alert>
                )}

                {/* 错误列表 */}
                {result.errors.length > 0 && (
                  <div className="rounded-lg bg-red-50 p-3">
                    <p className="mb-2 text-xs font-medium text-red-900">
                      错误详情：
                    </p>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {result.errors.map((error, index) => (
                        <p key={index} className="text-xs text-red-700">
                          第 {error.row} 行：{error.message}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          {result && (
            <Button
              variant="outline"
              onClick={() => setResult(null)}
              disabled={loading}
            >
              继续导入
            </Button>
          )}
          <Button 
            onClick={() => {
              setOpen(false);
              if (onRefresh) {
                onRefresh();
              }
            }}
            disabled={loading}
          >
            {result ? '完成' : '关闭'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
