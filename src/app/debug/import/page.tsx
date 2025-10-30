'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ImportDebugPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/debug/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Debug upload error:', error);
      setResult({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>导入功能调试</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              disabled={loading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {loading && <div>处理中...</div>}

          {result && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">调试信息</h3>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(result.debugInfo, null, 2)}
                </pre>
              </div>

              {result.success && (
                <>
                  <div>
                    <h3 className="font-semibold">总行数: {result.totalRows}</h3>
                  </div>

                  <div>
                    <h3 className="font-semibold">示例数据</h3>
                    <div className="space-y-2">
                      {result.rawData?.map((item: any, index: number) => (
                        <div key={index} className="border p-2 rounded">
                          <div className="text-sm text-gray-600">第 {item.rowIndex + 1} 行</div>
                          <div className="text-xs text-gray-500">原始: {JSON.stringify(item.rawRow)}</div>
                          <div className="text-sm">
                            <div>名称: {item.processedData.name}</div>
                            <div>SKU: {item.processedData.sku}</div>
                            <div>单价: {item.processedData.unitPrice}</div>
                            <div>描述: {item.processedData.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {!result.success && (
                <div className="text-red-600">
                  错误: {result.error}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
