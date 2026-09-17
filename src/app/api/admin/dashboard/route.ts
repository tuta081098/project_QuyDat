import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET() {
  try {
    // 1. Lấy toàn bộ đơn hàng kèm items để tính toán đầy đủ chỉ số
    const allOrders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { items: true }
    });

    const deliveredOrders = allOrders.filter(o => o.status === 'DELIVERED');
    const revenue = deliveredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const paidOrders = allOrders.filter(o => o.paymentStatus === 'PAID');

    // 2. Thống kê chung
    const ordersCount = allOrders.length;
    const customersCount = await prisma.user.count({ where: { role: 'USER' } });
    const outOfStockProducts = await prisma.product.count({ where: { stock: { lte: 0 }, status: { not: 'DELETED' } } });
    const reviewsCount = await prisma.review.count();
    const productsCount = await prisma.product.count({ where: { status: { not: 'DELETED' } } });

    // 3. Thống kê theo trạng thái đơn hàng
    const pendingOrders = allOrders.filter(o => o.status === 'PENDING').length;
    const shippingOrders = allOrders.filter(o => o.status === 'SHIPPING').length;
    const deliveredOrdersCount = deliveredOrders.length;
    const cancelledOrders = allOrders.filter(o => o.status === 'CANCELLED').length;

    // 4. Doanh thu hôm nay
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = allOrders.filter(o => new Date(o.createdAt) >= today);
    const todayDelivered = deliveredOrders.filter(o => new Date(o.updatedAt || o.createdAt) >= today);
    const todayRevenue = todayDelivered.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    // 5. Thống kê 7 ngày qua cho biểu đồ trực quan
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);

      const dayOrders = allOrders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= d && orderDate < nextD;
      });
      const dayDelivered = dayOrders.filter(o => o.status === 'DELIVERED');
      const dayRevenue = dayDelivered.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      last7Days.push({
        date: d.toISOString().split('T')[0],
        dayName: i === 0 ? 'Hôm nay' : `${dayNames[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`,
        revenue: dayRevenue,
        ordersCount: dayOrders.length
      });
    }

    // 6. Thống kê phương thức thanh toán
    const qrOrders = allOrders.filter(o => o.paymentMethod === 'QR');
    const codOrders = allOrders.filter(o => o.paymentMethod !== 'QR');
    const paymentStats = {
      qrCount: qrOrders.length,
      qrRevenue: qrOrders.filter(o => o.status === 'DELIVERED').reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      codCount: codOrders.length,
      codRevenue: codOrders.filter(o => o.status === 'DELIVERED').reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      paidCount: paidOrders.length,
      unpaidCount: allOrders.length - paidOrders.length
    };

    // 7. Top 5 sản phẩm bán chạy nhất
    const productSalesMap = new Map<string, { productName: string, totalQty: number, totalRevenue: number, image?: string }>();
    for (const order of allOrders) {
      if (order.status !== 'CANCELLED') {
        for (const item of (order.items || [])) {
          const key = item.productId || item.productName;
          const current = productSalesMap.get(key) || {
            productName: item.productName,
            totalQty: 0,
            totalRevenue: 0,
            image: item.image || undefined
          };
          current.totalQty += item.quantity || 1;
          current.totalRevenue += (item.price || 0) * (item.quantity || 1);
          if (item.image && !current.image) current.image = item.image;
          productSalesMap.set(key, current);
        }
      }
    }
    const topSellingProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 5);

    // 8. Đơn hàng gần nhất (6 đơn)
    const recentOrders = allOrders.slice(0, 6);

    // 9. Đánh giá gần nhất (5 review)
    const recentReviews = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { user: true, product: true }
    });

    // 10. Sản phẩm sắp hết hàng (stock <= 5 và > 0)
    const lowStockProducts = await prisma.product.findMany({
      where: { stock: { gt: 0, lte: 5 }, status: { not: 'DELETED' } },
      orderBy: { stock: 'asc' },
      take: 5
    });

    // 11. Chỉ số KPIs nâng cao
    const kpis = {
      aov: deliveredOrdersCount > 0 ? Math.round(revenue / deliveredOrdersCount) : 0,
      deliverySuccessRate: ordersCount > 0 ? Math.round((deliveredOrdersCount / ordersCount) * 100) : 0,
      paidRate: ordersCount > 0 ? Math.round((paidOrders.length / ordersCount) * 100) : 0
    };

    return NextResponse.json({
      revenue,
      todayRevenue,
      todayOrdersCount: todayOrders.length,
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
      last7Days,
      paymentStats,
      topSellingProducts,
      kpis,
      recentOrders,
      recentReviews,
      lowStockProducts
    });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi lấy thống kê Dashboard' }, { status: 500 });
  }
}