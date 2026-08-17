import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rating, comment, productId, userId } = body;

    if (!rating || !productId || !userId) {
      return NextResponse.json({ error: 'Thiếu thông tin đánh giá' }, { status: 400 });
    }

    // 1. Lấy thông tin user để lấy email và phone
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'Người dùng không tồn tại' }, { status: 404 });
    }

    // 2. Kiểm tra xem người dùng đã mua sản phẩm này và đơn hàng đã giao (DELIVERED) chưa
    const deliveredOrders = await prisma.order.findMany({
      where: {
        status: 'DELIVERED',
        OR: [
          { customerEmail: user.email || undefined },
          { customerPhone: user.phone || undefined }
        ]
      },
      include: { items: true }
    });

    // Lọc ra các đơn hàng có chứa productId
    const hasBoughtProduct = deliveredOrders.some(order => 
      order.items.some(item => item.productId === productId)
    );

    if (!hasBoughtProduct) {
      return NextResponse.json({ error: 'Bạn chỉ có thể đánh giá sản phẩm sau khi đã mua và nhận hàng' }, { status: 403 });
    }

    // 3. Tạo đánh giá
    const review = await prisma.review.create({
      data: {
        rating: Number(rating),
        comment,
        productId,
        userId
      },
      include: {
        user: true
      }
    });

    return NextResponse.json({ success: true, data: review });
  } catch (error) {
    console.error("Lỗi tạo đánh giá:", error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi tạo đánh giá' }, { status: 500 });
  }
}
