import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; // Phải await params ở Next.js mới
    const body = await request.json();
    const { name, slug, price, stock, image, categoryId, status } = body;

    const product = await prisma.product.update({
      where: { id },
      data: { name, slug, price: Number(price), stock: Number(stock), image, categoryId, status }
    });
    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi cập nhật sản phẩm' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Xóa mềm sản phẩm để giữ toàn vẹn dữ liệu đơn hàng cũ
    await prisma.product.update({
      where: { id },
      data: { status: 'DELETED' }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi xóa sản phẩm' }, { status: 500 });
  }
}