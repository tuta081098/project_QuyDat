import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: { 
        customer: true,
        items: { include: { product: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi lấy danh sách đơn hàng' }, { status: 500 });
  }
}