import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Create payment record schema
const createPaymentSchema = z.object({
  amount: z.number().positive('付款金额必须大于0'),
  payment_date: z.string().optional(),
  payment_method: z.string().optional(),
  remark: z.string().optional(),
});

// GET - Get payment records for a purchase order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { message: '未授权访问' } },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Get payment records
    const payments = await prisma.purchaseOrderPayment.findMany({
      where: {
        purchaseOrderId: id,
        deletedAt: null,
      },
      orderBy: {
        paymentDate: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        payments: payments.map(payment => ({
          id: payment.id,
          purchase_order_id: payment.purchaseOrderId,
          amount: Number(payment.amount),
          payment_date: payment.paymentDate.toISOString(),
          payment_method: payment.paymentMethod,
          remark: payment.remark,
          created_at: payment.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error('Get payment records error:', error);
    return NextResponse.json(
      { success: false, error: { message: '获取付款记录失败' } },
      { status: 500 }
    );
  }
}

// POST - Create a new payment record
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { message: '未授权访问' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Validate request body
    const validatedData = createPaymentSchema.parse(body);

    // Get purchase order
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id, deletedAt: null },
    });

    if (!purchaseOrder) {
      return NextResponse.json(
        { success: false, error: { message: '采购单不存在' } },
        { status: 404 }
      );
    }

    // Calculate new paid amount
    const currentPaidAmount = Number(purchaseOrder.paidAmount);
    const newPaidAmount = currentPaidAmount + validatedData.amount;
    const totalAmount = Number(purchaseOrder.totalAmount);

    // Validate payment amount
    if (newPaidAmount > totalAmount) {
      return NextResponse.json(
        { success: false, error: { message: '付款金额超过应付总额' } },
        { status: 400 }
      );
    }

    // Determine new payment status
    let newPaymentStatus: 'UNPAID' | 'PARTIAL_PAID' | 'PAID';
    if (newPaidAmount === 0) {
      newPaymentStatus = 'UNPAID';
    } else if (newPaidAmount < totalAmount) {
      newPaymentStatus = 'PARTIAL_PAID';
    } else {
      newPaymentStatus = 'PAID';
    }

    // Create payment record and update purchase order in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create payment record
      const payment = await tx.purchaseOrderPayment.create({
        data: {
          purchaseOrderId: id,
          amount: validatedData.amount,
          paymentDate: validatedData.payment_date
            ? new Date(validatedData.payment_date)
            : new Date(),
          paymentMethod: validatedData.payment_method,
          remark: validatedData.remark,
        },
      });

      // Update purchase order
      const updatedOrder = await tx.purchaseOrder.update({
        where: { id },
        data: {
          paidAmount: newPaidAmount,
          paymentStatus: newPaymentStatus,
        },
      });

      return { payment, updatedOrder };
    });

    return NextResponse.json({
      success: true,
      data: {
        payment: {
          id: result.payment.id,
          purchase_order_id: result.payment.purchaseOrderId,
          amount: Number(result.payment.amount),
          payment_date: result.payment.paymentDate.toISOString(),
          payment_method: result.payment.paymentMethod,
          remark: result.payment.remark,
        },
        purchase_order: {
          id: result.updatedOrder.id,
          paid_amount: Number(result.updatedOrder.paidAmount),
          payment_status: result.updatedOrder.paymentStatus,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: '数据验证失败', details: error.errors } },
        { status: 400 }
      );
    }

    console.error('Create payment record error:', error);
    return NextResponse.json(
      { success: false, error: { message: '创建付款记录失败' } },
      { status: 500 }
    );
  }
}
