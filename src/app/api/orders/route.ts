import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerName, customerEmail, customerPhone, address, note, shippingDetails, userId, totalAmount, paymentMethod, paymentStatus, items } = body;

    const order = await prisma.$transaction(async (tx) => {
      // 1. Tạo đơn hàng (Đã bổ sung paymentStatus + color + image + note + shippingDetails)
      const newOrder = await tx.order.create({
        data: {
          customerName,
          customerEmail,
          customerPhone,
          address,
          note: note || null,
          shippingDetails: shippingDetails || null,
          userId: userId || null,
          totalAmount,
          paymentMethod,
          paymentStatus,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              productName: item.name,
              price: item.price,
              quantity: item.quantity,
              size: item.size,
              color: item.color || null,
              image: item.image || null
            }))
          }
        } as any
      });

      // 2. Trừ số lượng tồn kho (theo biến thể màu nếu có)
      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) continue;

        // Nếu sản phẩm có colorVariants và item có chọn màu
        if (item.color && product.colorVariants && Array.isArray(product.colorVariants)) {
          const variants = product.colorVariants as any[];
          const updatedVariants = variants.map((v: any) => {
            if (v.colorName === item.color) {
              let updatedStock = Math.max(0, (v.stock || 0) - item.quantity);
              let updatedSizeStocks = v.sizeStocks;

              // Nếu biến thể có quản lý số lượng theo từng size
              if (item.size && v.sizeStocks && typeof v.sizeStocks === 'object') {
                const curStock = Number(v.sizeStocks[item.size]) || 0;
                updatedSizeStocks = {
                  ...v.sizeStocks,
                  [item.size]: Math.max(0, curStock - item.quantity)
                };
                // Tính lại tổng tồn kho của màu từ các size
                updatedStock = Object.values(updatedSizeStocks).reduce((sum: number, s: any) => sum + (Number(s) || 0), 0);
              }

              return {
                ...v,
                stock: updatedStock,
                sizeStocks: updatedSizeStocks
              };
            }
            return v;
          });
          // Tính lại tổng stock
          const newTotalStock = updatedVariants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
          await tx.product.update({
            where: { id: item.productId },
            data: { 
              colorVariants: updatedVariants,
              stock: newTotalStock
            }
          });
        } else {
          // Fallback: trừ stock trực tiếp (sản phẩm cũ không có biến thể)
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } }
          });
        }
      }

      return newOrder;
    });

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Lỗi tạo đơn hàng hoặc sản phẩm đã hết hàng' }, { status: 500 });
  }
}