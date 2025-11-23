'use client';

import { useState } from 'react';
import { DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { STATUS_COLORS, STATUS_LABELS } from '@/constants/purchase';
import { PaymentRecordDialog } from '../payment-record-dialog';
import { PurchaseOrderTableItem } from '@/types/purchase';

interface PaymentStatusCellProps {
  data: PurchaseOrderTableItem;
  onUpdate?: () => void;
}

export function PaymentStatusCell({ data, onUpdate }: PaymentStatusCellProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const paymentStatus = data.paymentStatus as keyof typeof STATUS_LABELS;
  const paidAmount = data.paidAmount || 0;
  const totalAmount = data.totalAmount || 0;
  const remainingAmount = totalAmount - paidAmount;

  // 只要不是草稿或已取消状态，且未完全付款，就可以添加付款记录
  const canAddPayment = 
    data.status !== 'draft' && 
    data.status !== 'cancelled' && 
    paymentStatus !== 'PAID';

  const handleSuccess = () => {
    onUpdate?.();
  };

  return (
    <div className="flex flex-col gap-1">
      <Badge className={STATUS_COLORS[paymentStatus]}>
        {STATUS_LABELS[paymentStatus]}
      </Badge>
      
      {paymentStatus !== 'UNPAID' && (
        <div className="text-xs text-muted-foreground">
          已付: ¥{paidAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
        </div>
      )}
      
      {paymentStatus === 'PARTIAL_PAID' && (
        <div className="text-xs text-orange-600">
          待付: ¥{remainingAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
        </div>
      )}

      {canAddPayment && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => setDialogOpen(true)}
        >
          <DollarSign className="h-3 w-3 mr-1" />
          添加付款
        </Button>
      )}

      <PaymentRecordDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        purchaseOrderId={data.id}
        totalAmount={totalAmount}
        paidAmount={paidAmount}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
