import { prisma } from '@/src/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Chạy song song các query để tối ưu tốc độ
    const [
      totalRevenueAggr,
      newOrdersCount,
      customersCount,
      reviewsCount
    ] = await Promise.all([
      prisma.order.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { totalAmount: true }
      }),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.customer.count(),
      prisma.review.count({ where: { rating: 5 } })
    ]);

    const totalRevenue = totalRevenueAggr._sum.totalAmount || 0;

    return NextResponse.json({
      revenue: totalRevenue,
      orders: newOrdersCount,
      customers: customersCount,
      fiveStarReviews: reviewsCount
    });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi Server' }, { status: 500 });
  }
}