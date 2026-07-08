import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        orders: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(customers);
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi lấy danh sách khách hàng' }, { status: 500 });
  }
}