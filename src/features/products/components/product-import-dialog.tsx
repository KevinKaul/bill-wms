'use client';

import { useState, useRef } from 'react';
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

export function ProductImportDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/v1/products/import/template');
      if (!response.ok) throw new Error('Failed to download template');
      
      const data = await response.json();
      const downloadUrl = data.downloadUrl;
      
      // 直接打开静态文件下载
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = '产品导入模板.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('模板下载成功');
    } catch (error) {
      toast.error('模板下载失败');
      console.error(error);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      const formData = new FormData();
      formData.append('file', file);

      // 模拟进度
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/v1/products/import', {
        method: 'POST',
        body: formData,
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

  const handleClose = () => {
    setOpen(false);
    setResult(null);
    setProgress(0);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <IconUpload className="mr-2 h-4 w-4" />
          导入产品
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>导入产品</DialogTitle>
          <DialogDescription>
            上传Excel或CSV文件批量导入产品信息
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
                  onClick={downloadTemplate}
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
                  onChange={handleFileSelect}
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
                  <p className="text-xs text-gray-600 text-center">
                    {progress}%
                  </p>
                </div>
              )}

              {/* 提示信息 */}
              <Alert>
                <IconAlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>SKU和产品名称为必填项</li>
                    <li>产品类型：原材料 或 组合产品</li>
                    <li>价格字段为可选项</li>
                    <li>重复的SKU将被跳过</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </>
          ) : (
            <>
              {/* 导入结果 */}
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
        </div>

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
          <Button onClick={handleClose} disabled={loading}>
            {result ? '完成' : '关闭'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
