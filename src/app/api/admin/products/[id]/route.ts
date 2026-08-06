import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

// Chú ý: Đổi kiểu dữ liệu của params thành Promise<{ id: string }>
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // BỔ SUNG AWAIT Ở ĐÂY
    const { id } = await params; 
    
    const body = await request.json();
    const { name, slug, price, discountPrice, stock, categoryId, status, image, sizes, description } = body;

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        slug,
        price,
        discountPrice,
        stock,
        categoryId,
        status,
        image,
        sizes,
        description
      }
    });
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi cập nhật sản phẩm' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // BỔ SUNG AWAIT Ở ĐÂY
    const { id } = await params;

    await prisma.product.update({ 
      where: { id },
      data: { status: 'DELETED' }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Lỗi xóa sản phẩm' }, { status: 500 });
  }
}