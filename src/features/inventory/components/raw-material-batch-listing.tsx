'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getRawMaterialBatches, type RawMaterialBatch } from '@/lib/purchase-inbound';
import { Package, Search, Filter, Download, Eye } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format-utils';

interface RawMaterialBatchListingProps {
  className?: string;
}

export function RawMaterialBatchListing({ className }: RawMaterialBatchListingProps) {
  const [batches, setBatches] = useState<RawMaterialBatch[]>([]);
  const [filteredBatches, setFilteredBatches] = useState<RawMaterialBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [materialFilter, setMaterialFilter] = useState('all');

  // 获取批次数据
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setLoading(true);
        const batchData = getRawMaterialBatches();
        setBatches(batchData);
        setFilteredBatches(batchData);
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
        batch.materialSku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.sourceReference.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 供应商筛选
    if (supplierFilter !== 'all') {
      filtered = filtered.filter(batch => batch.supplierId === supplierFilter);
    }

    // 原材料筛选
    if (materialFilter !== 'all') {
      filtered = filtered.filter(batch => batch.materialId === materialFilter);
    }

    setFilteredBatches(filtered);
  }, [batches, searchTerm, supplierFilter, materialFilter]);

  // 获取唯一的供应商和原材料列表
  const uniqueSuppliers = Array.from(new Set(batches.map(b => ({ id: b.supplierId, name: b.supplierName }))));
  const uniqueMaterials = Array.from(new Set(batches.map(b => ({ id: b.materialId, name: b.materialName, sku: b.materialSku }))));

  // 统计信息
  const totalBatches = filteredBatches.length;
  const totalQuantity = filteredBatches.reduce((sum, batch) => sum + batch.quantity, 0);
  const totalValue = filteredBatches.reduce((sum, batch) => sum + batch.totalCost, 0);

  const handleViewBatch = (batchId: string) => {
    // TODO: 实现批次详情查看
    window.open(`/dashboard/inventory/batch/raw-material/${batchId}`, '_blank');
  };

  const handleExportData = () => {
    // TODO: 实现数据导出
    const csvContent = generateBatchCSV(filteredBatches);
    downloadCSV(csvContent, 'raw-material-batches.csv');
  };

  const generateBatchCSV = (data: RawMaterialBatch[]) => {
    const headers = ['批次号', '原材料SKU', '原材料名称', '库存数量', '单位成本', '总成本', '供应商', '来源单号', '入库日期', '存储位置'];
    const rows = data.map(batch => [
      batch.batchNumber,
      batch.materialSku,
      batch.materialName,
      batch.quantity.toString(),
      batch.unitCost.toString(),
      batch.totalCost.toString(),
      batch.supplierName,
      batch.sourceReference,
      formatDate(batch.inboundDate),
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">加载批次数据中...</p>
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
            <CardTitle className="text-sm font-medium">批次总数</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBatches}</div>
            <p className="text-xs text-muted-foreground">
              原材料批次
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">库存总量</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuantity.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              所有原材料
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">库存总值</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              成本价值
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
            按批次号、SKU、原材料名称或采购单号搜索
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索批次号、SKU、原材料名称..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="选择供应商" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有供应商</SelectItem>
                {uniqueSuppliers.map(supplier => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={materialFilter} onValueChange={setMaterialFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="选择原材料" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有原材料</SelectItem>
                {uniqueMaterials.map(material => (
                  <SelectItem key={material.id} value={material.id}>
                    {material.sku} - {material.name}
                  </SelectItem>
                ))}
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
          <CardTitle>原材料批次列表</CardTitle>
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
                  <TableHead>原材料</TableHead>
                  <TableHead className="text-right">库存数量</TableHead>
                  <TableHead className="text-right">单位成本</TableHead>
                  <TableHead className="text-right">总成本</TableHead>
                  <TableHead>供应商</TableHead>
                  <TableHead>来源单号</TableHead>
                  <TableHead>入库日期</TableHead>
                  <TableHead>存储位置</TableHead>
                  <TableHead className="text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBatches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <div className="text-center">
                        <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {batches.length === 0 ? '暂无批次数据' : '没有符合条件的批次'}
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
                          <div className="font-medium">{batch.materialName}</div>
                          <div className="text-sm text-muted-foreground">{batch.materialSku}</div>
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
                        <div className="text-sm">{batch.supplierName}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{batch.sourceReference}</Badge>
                      </TableCell>
                      <TableCell>
                        {formatDate(batch.inboundDate)}
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
