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
    const outOfStockProducts = await prisma.product.count({ where: { stock: { lte: 0 }, status: { not: 'DELETED' } } });
    const reviewsCount = await prisma.review.count();
    const productsCount = await prisma.product.count({ where: { status: { not: 'DELETED' } } });

    // 3. Thống kê theo trạng thái đơn hàng
    const pendingOrders = await prisma.order.count({ where: { status: 'PENDING' } });
    const shippingOrders = await prisma.order.count({ where: { status: 'SHIPPING' } });
    const deliveredOrdersCount = deliveredOrders.length;
    const cancelledOrders = await prisma.order.count({ where: { status: 'CANCELLED' } });

    // 4. Đơn hàng gần nhất (5 đơn)
    const recentOrders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { items: true }
    });

    // 5. Đánh giá gần nhất (5 review)
    const recentReviews = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { user: true, product: true }
    });

    // 6. Sản phẩm sắp hết hàng (stock <= 5 và > 0)
    const lowStockProducts = await prisma.product.findMany({
      where: { stock: { gt: 0, lte: 5 }, status: { not: 'DELETED' } },
      orderBy: { stock: 'asc' },
      take: 5
    });

    // 7. Doanh thu hôm nay
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDelivered = await prisma.order.findMany({
      where: { status: 'DELIVERED', updatedAt: { gte: today } }
    });
    const todayRevenue = todayDelivered.reduce((sum, order) => sum + order.totalAmount, 0);

    return NextResponse.json({
      revenue,
      todayRevenue,
      orders: ordersCount,
      customers: customersCount,
      outOfStockProducts,
      reviewsCount,
      productsCount,
      ordersByStatus: {
        pending: pendingOrders,
        shipping: shippingOrders,
        delivered: deliveredOrdersCount,
        cancelled: cancelledOrders
      },
      recentOrders,
      recentReviews,
      lowStockProducts
    });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi lấy thống kê Dashboard' }, { status: 500 });
  }
}