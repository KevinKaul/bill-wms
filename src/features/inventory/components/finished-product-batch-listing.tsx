'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, Search, Filter, Download, Eye, Factory } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format-utils';

// 成品批次接口
interface FinishedProductBatch {
  batchId: string;
  batchNumber: string;
  productId: string;
  productSku: string;
  productName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  sourceType: 'production';
  sourceReference: string; // 加工单号
  productionDate: string;
  location?: string;
  qualityStatus: 'pending' | 'passed' | 'failed';
}

// 模拟成品批次数据
const mockFinishedProductBatches: FinishedProductBatch[] = [
  {
    batchId: 'FP_BATCH001',
    batchNumber: 'FP20241201001',
    productId: '101',
    productSku: 'PROD001',
    productName: '成品A',
    quantity: 50,
    unitCost: 25.80,
    totalCost: 1290.00,
    sourceType: 'production',
    sourceReference: 'PRO20241201001',
    productionDate: '2024-12-01T16:00:00Z',
    location: 'FG-A01-01',
    qualityStatus: 'passed'
  },
  {
    batchId: 'FP_BATCH002',
    batchNumber: 'FP20241205001',
    productId: '102',
    productSku: 'PROD002',
    productName: '成品B',
    quantity: 30,
    unitCost: 42.50,
    totalCost: 1275.00,
    sourceType: 'production',
    sourceReference: 'PRO20241205001',
    productionDate: '2024-12-05T10:30:00Z',
    location: 'FG-A02-01',
    qualityStatus: 'passed'
  },
  {
    batchId: 'FP_BATCH003',
    batchNumber: 'FP20241210001',
    productId: '101',
    productSku: 'PROD001',
    productName: '成品A',
    quantity: 45,
    unitCost: 26.20,
    totalCost: 1179.00,
    sourceType: 'production',
    sourceReference: 'PRO20241210001',
    productionDate: '2024-12-10T14:15:00Z',
    location: 'FG-A01-02',
    qualityStatus: 'pending'
  }
];

interface FinishedProductBatchListingProps {
  className?: string;
}

export function FinishedProductBatchListing({ className }: FinishedProductBatchListingProps) {
  const [batches, setBatches] = useState<FinishedProductBatch[]>([]);
  const [filteredBatches, setFilteredBatches] = useState<FinishedProductBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [productFilter, setProductFilter] = useState('all');
  const [qualityFilter, setQualityFilter] = useState('all');

  // 获取批次数据
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setLoading(true);
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500));
        setBatches(mockFinishedProductBatches);
        setFilteredBatches(mockFinishedProductBatches);
      } catch (error) {
        // 获取批次数据失败，使用空数组
      } finally {
        setLoading(false);
      }
    };

    fetchBatches();
  }, []);

  // 筛选逻辑
  useEffect(() => {
    let filtered = batches;

    // 搜索筛选
    if (searchTerm) {
      filtered = filtered.filter(batch => 
        batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.productSku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.sourceReference.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 产品筛选
    if (productFilter !== 'all') {
      filtered = filtered.filter(batch => batch.productId === productFilter);
    }

    // 质量状态筛选
    if (qualityFilter !== 'all') {
      filtered = filtered.filter(batch => batch.qualityStatus === qualityFilter);
    }

    setFilteredBatches(filtered);
  }, [batches, searchTerm, productFilter, qualityFilter]);

  // 获取唯一的产品列表
  const uniqueProducts = Array.from(new Set(batches.map(b => ({ id: b.productId, name: b.productName, sku: b.productSku }))));

  // 统计信息
  const totalBatches = filteredBatches.length;
  const totalQuantity = filteredBatches.reduce((sum, batch) => sum + batch.quantity, 0);
  const totalValue = filteredBatches.reduce((sum, batch) => sum + batch.totalCost, 0);

  const handleViewBatch = (batchId: string) => {
    window.open(`/dashboard/inventory/batch/finished-product/${batchId}`, '_blank');
  };

  const handleExportData = () => {
    const csvContent = generateBatchCSV(filteredBatches);
    downloadCSV(csvContent, 'finished-product-batches.csv');
  };

  const generateBatchCSV = (data: FinishedProductBatch[]) => {
    const headers = ['批次号', '产品SKU', '产品名称', '数量', '单位成本', '总成本', '加工单号', '生产日期', '质量状态', '存储位置'];
    const rows = data.map(batch => [
      batch.batchNumber,
      batch.productSku,
      batch.productName,
      batch.quantity.toString(),
      batch.unitCost.toString(),
      batch.totalCost.toString(),
      batch.sourceReference,
      formatDate(batch.productionDate),
      getQualityStatusText(batch.qualityStatus),
      batch.location || '未分配'
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getQualityStatusText = (status: string) => {
    const statusMap = {
      'pending': '待检验',
      'passed': '合格',
      'failed': '不合格'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getQualityStatusBadge = (status: string) => {
    const variants = {
      'pending': 'secondary' as const,
      'passed': 'default' as const,
      'failed': 'destructive' as const
    };
    return variants[status as keyof typeof variants] || 'secondary';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Factory className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">加载成品批次数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">成品批次总数</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBatches}</div>
            <p className="text-xs text-muted-foreground">
              成品批次
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">成品总量</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuantity.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              所有成品
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">成品总值</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              生产成本
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 筛选和搜索 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            筛选和搜索
          </CardTitle>
          <CardDescription>
            按批次号、SKU、产品名称或加工单号搜索
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索批次号、SKU、产品名称..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="选择产品" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有产品</SelectItem>
                {uniqueProducts.map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.sku} - {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={qualityFilter} onValueChange={setQualityFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="质量状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有状态</SelectItem>
                <SelectItem value="pending">待检验</SelectItem>
                <SelectItem value="passed">合格</SelectItem>
                <SelectItem value="failed">不合格</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={handleExportData}>
              <Download className="h-4 w-4 mr-2" />
              导出
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 批次列表 */}
      <Card>
        <CardHeader>
          <CardTitle>成品批次列表</CardTitle>
          <CardDescription>
            显示 {filteredBatches.length} 个批次，共 {totalBatches} 个
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>批次号</TableHead>
                  <TableHead>产品</TableHead>
                  <TableHead className="text-right">数量</TableHead>
                  <TableHead className="text-right">单位成本</TableHead>
                  <TableHead className="text-right">总成本</TableHead>
                  <TableHead>加工单号</TableHead>
                  <TableHead>生产日期</TableHead>
                  <TableHead>质量状态</TableHead>
                  <TableHead>存储位置</TableHead>
                  <TableHead className="text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBatches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <div className="text-center">
                        <Factory className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {batches.length === 0 ? '暂无成品批次数据' : '没有符合条件的批次'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBatches.map((batch) => (
                    <TableRow key={batch.batchId}>
                      <TableCell className="font-medium">
                        <Badge variant="outline">{batch.batchNumber}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{batch.productName}</div>
                          <div className="text-sm text-muted-foreground">{batch.productSku}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {batch.quantity.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(batch.unitCost)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(batch.totalCost)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{batch.sourceReference}</Badge>
                      </TableCell>
                      <TableCell>
                        {formatDate(batch.productionDate)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getQualityStatusBadge(batch.qualityStatus)}>
                          {getQualityStatusText(batch.qualityStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{batch.location || '未分配'}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewBatch(batch.batchId)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
