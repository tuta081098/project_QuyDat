import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET() {
  try {
    // 1. Lấy doanh thu từ các đơn hàng ĐÃ GIAO (DELIVERED)
    const deliveredOrders = await prisma.order.findMany({ where: { status: 'DELIVERED' } });
    const revenue = deliveredOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    // 2. Thống kê chung
    const ordersCount = await prisma.order.count();
    const customersCount = await prisma.user.count({ where: { role: 'USER' } });
    const outOfStockProducts = await prisma.product.count({ where: { stock: { lte: 0 } } });

    return NextResponse.json({
      revenue,
      orders: ordersCount,
      customers: customersCount,
      outOfStockProducts
    });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi lấy thống kê Dashboard' }, { status: 500 });
  }
}