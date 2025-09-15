'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Eye, Edit, Copy, Trash } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { AlertModal } from '@/components/modal/alert-modal';
import { SupplierTableItem } from '@/types/supplier';
import { createClientApi } from '@/lib/client-api';
import { useAuth } from '@clerk/nextjs';

interface CellActionProps {
  data: SupplierTableItem;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { getToken } = useAuth();
  const clientApi = createClientApi(getToken);

  const onConfirm = async () => {
    try {
      setLoading(true);
      const response = await clientApi.suppliers.deleteSupplier(data.id);
      
      if (response.success) {
        toast.success('供应商已删除');
        setOpen(false);
        // 刷新页面
        router.refresh();
      } else {
        toast.error(response.error?.message || '删除失败');
      }
    } catch (error) {
      console.error('删除供应商错误:', error);
      toast.error('删除失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const onCopy = () => {
    navigator.clipboard.writeText(data.code);
    toast.success('已复制供应商代号到剪贴板');
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        loading={loading}
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>打开菜单</span>
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>操作</DropdownMenuLabel>
          <DropdownMenuItem onClick={onCopy}>
            <Copy className='mr-2 h-4 w-4' /> 复制代号
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => router.push(`/dashboard/supplier/${data.id}`)}
          >
            <Eye className='mr-2 h-4 w-4' /> 查看详情
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push(`/dashboard/supplier/${data.id}/edit`)}
          >
            <Edit className='mr-2 h-4 w-4' /> 编辑
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setOpen(true)}
            className='text-red-600 focus:text-red-600'
          >
            <Trash className='mr-2 h-4 w-4' /> 删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
