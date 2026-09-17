import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET() {
  try {
    // Lấy toàn bộ đơn hàng, sắp xếp mới nhất lên đầu, bao gồm cả chi tiết sản phẩm (items)
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { items: true } 
    });
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi lấy danh sách đơn hàng' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, paymentStatus } = body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    // Cập nhật trạng thái đơn hàng hoặc thanh toán trong Database
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, data: updatedOrder });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi cập nhật đơn hàng' }, { status: 500 });
  }
}