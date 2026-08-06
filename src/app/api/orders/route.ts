import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerName, customerEmail, customerPhone, address, totalAmount, paymentMethod, paymentStatus, items } = body;

    const order = await prisma.$transaction(async (tx) => {
      // 1. Tạo đơn hàng (Đã bổ sung paymentStatus)
      const newOrder = await tx.order.create({
        data: {
          customerName, customerEmail, customerPhone, address, totalAmount, paymentMethod, paymentStatus,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              productName: item.name,
              price: item.price,
              quantity: item.quantity,
              size: item.size
            }))
          }
        }
      });

      // 2. Trừ số lượng tồn kho
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        });
      }

      return newOrder;
    });

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Lỗi tạo đơn hàng hoặc sản phẩm đã hết hàng' }, { status: 500 });
  }
}