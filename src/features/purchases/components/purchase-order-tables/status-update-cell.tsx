'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { STATUS_COLORS } from '@/constants/purchase';
import { PurchaseOrderTableItem } from '@/types/purchase';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';

interface StatusUpdateCellProps {
  data: PurchaseOrderTableItem;
  statusType: 'payment' | 'delivery';
  onUpdate?: () => void;
}

export function StatusUpdateCell({ data, statusType, onUpdate }: StatusUpdateCellProps) {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    newStatus: string;
  }>({
    open: false,
    title: '',
    description: '',
    newStatus: ''
  });

  const currentStatus = statusType === 'payment' ? data.paymentStatus : data.deliveryStatus;

  // 获取下一个状态
  const getNextStatus = (current: string, type: 'payment' | 'delivery') => {
    // 打印当前状态值，用于调试
    console.log(`[状态切换] 当前状态值: ${current}`);
    
    if (type === 'payment') {
      switch (current) {
        case 'UNPAID': return 'PAID';
        case 'PAID': return 'UNPAID';
        // 兼容小写状态值
        case 'unpaid': return 'PAID';
        case 'paid': return 'UNPAID';
        default: return 'PAID';
      }
    } else {
      switch (current) {
        case 'NOT_DELIVERED': return 'DELIVERED';
        case 'DELIVERED': return 'NOT_DELIVERED';
        // 兼容小写状态值
        case 'not_delivered': return 'DELIVERED';
        case 'delivered': return 'NOT_DELIVERED';
        // 兼容旧的状态值
        case 'pending': return 'DELIVERED';
        default: return 'DELIVERED';
      }
    }
  };

  const getStatusLabel = (status: string, type: 'payment' | 'delivery') => {
    if (type === 'payment') {
      const labels = {
        'UNPAID': '未付款',
        'PAID': '已付款'
      };
      return labels[status as keyof typeof labels] || status;
    } else {
      const labels = {
        'NOT_DELIVERED': '待发货',
        'DELIVERED': '已到货'
      };
      return labels[status as keyof typeof labels] || status;
    }
  };

  // 获取状态变更的影响描述
  const getStatusChangeImpact = (fromStatus: string, toStatus: string, type: 'payment' | 'delivery') => {
    if (type === 'payment') {
      const impacts = {
        'UNPAID_to_PAID': '• 标记为已付款\n• 完成供应商结算\n• 更新财务记录',
        'PAID_to_UNPAID': '• 重置付款状态\n• 需要重新处理付款'
      };
      const key = `${fromStatus}_to_${toStatus}`;
      return impacts[key as keyof typeof impacts] || '• 更新付款状态';
    } else {
      const impacts = {
        'NOT_DELIVERED_to_DELIVERED': '• 标记为已到货\n• 自动触发库存入库\n• 生成原材料批次记录\n• 计算实际入库成本\n• 更新库存数量',
        'DELIVERED_to_NOT_DELIVERED': '• 重置到货状态\n• 可能需要调整库存记录'
      };
      const key = `${fromStatus}_to_${toStatus}`;
      return impacts[key as keyof typeof impacts] || '• 更新到货状态';
    }
  };

  // 检查状态是否会发生实际变化
  const willStatusChange = (current: string, next: string) => {
    return current !== next;
  };

  const handleStatusClick = () => {
    // 打印当前状态值，用于调试
    console.log(`[状态更新] 当前${statusType === 'payment' ? '付款状态' : '到货状态'}: ${currentStatus}`);
    
    const nextStatus = getNextStatus(currentStatus, statusType);
    console.log(`[状态更新] 下一状态: ${nextStatus}`);
    
    const statusTypeLabel = statusType === 'payment' ? '付款状态' : '到货状态';
    
    // 检查状态是否会发生变化，如果不会变化则不显示确认对话框
    if (!willStatusChange(currentStatus, nextStatus)) {
      toast.info(`${statusTypeLabel}已经是${getStatusLabel(currentStatus, statusType)}，无需更改`);
      return;
    }
    
    const currentLabel = getStatusLabel(currentStatus, statusType);
    const nextLabel = getStatusLabel(nextStatus, statusType);
    const impact = getStatusChangeImpact(currentStatus, nextStatus, statusType);

    const description = `确认将采购单 ${data.orderNumber} 的${statusTypeLabel}从"${currentLabel}"更改为"${nextLabel}"吗？

此操作将产生以下影响：
${impact}

${statusType === 'delivery' && nextStatus === 'DELIVERED' ? 
  '\n⚠️ 重要提醒：标记为“已到货”将自动触发库存入库操作，该操作不可撤销！' : ''}`;

    setConfirmDialog({
      open: true,
      title: `更改${statusTypeLabel}`,
      description,
      newStatus: nextStatus
    });
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      // 打印将要发送的状态值，用于调试
      console.log(`[状态更新] 发送状态更新请求，新状态: ${confirmDialog.newStatus}`);
      
      // 确保发送到API的状态值格式正确
      const updateData = statusType === 'payment' 
        ? { payment_status: confirmDialog.newStatus }
        : { delivery_status: confirmDialog.newStatus };

      const response = await fetch(`/api/v1/purchase/orders/${data.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error('更新状态失败');
      }

      const statusTypeLabel = statusType === 'payment' ? '付款状态' : '到货状态';
      const newLabel = getStatusLabel(confirmDialog.newStatus, statusType);
      
      // 根据状态变更类型显示不同的成功消息
      let successMessage = `${statusTypeLabel}已更新为"${newLabel}"`;
      
      if (statusType === 'delivery' && confirmDialog.newStatus === 'DELIVERED') {
        successMessage = `${statusTypeLabel}已更新为"${newLabel}"，库存入库操作已自动执行`;
      } else if (statusType === 'payment' && confirmDialog.newStatus === 'PAID') {
        successMessage = `${statusTypeLabel}已更新为"${newLabel}"，供应商结算状态已更新`;
      }
      
      toast.success(successMessage);
      
      setConfirmDialog({ open: false, title: '', description: '', newStatus: '' });
      onUpdate?.();
    } catch (error) {
      console.error('Update status error:', error);
      toast.error('更新状态失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-1"
        onClick={handleStatusClick}
        disabled={loading}
      >
        <Badge className={STATUS_COLORS[currentStatus as keyof typeof STATUS_COLORS]}>
          {getStatusLabel(currentStatus, statusType)}
        </Badge>
      </Button>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={handleConfirm}
        loading={loading}
      />
    </>
  );
}
