import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json({ error: 'Vui lòng cung cấp số điện thoại' }, { status: 400 });
    }

    // Tìm tất cả đơn hàng khớp với số điện thoại, sắp xếp mới nhất lên đầu
    const orders = await prisma.order.findMany({
      where: { customerPhone: phone },
      orderBy: { createdAt: 'desc' },
      include: { items: true } // Lấy cả chi tiết sản phẩm trong đơn
    });

    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error("Lỗi tra cứu đơn hàng:", error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi tra cứu đơn hàng' }, { status: 500 });
  }
}