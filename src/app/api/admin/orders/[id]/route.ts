import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status } = await request.json();
    const order = await prisma.order.update({
      where: { id },
      data: { status }
    });
    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi cập nhật trạng thái đơn hàng' }, { status: 500 });
  }
}