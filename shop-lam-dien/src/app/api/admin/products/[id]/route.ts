import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; 
    
    const body = await request.json();
    const { name, slug, price, discountPrice, stock, categoryId, status, image, sizes, description } = body;

    const numPrice = typeof price === 'number' ? Math.round(price) : Math.round(Number(String(price || '').replace(/\D/g, '')) || 0);
    const numDiscount = (discountPrice !== null && discountPrice !== undefined && discountPrice !== '') 
      ? (typeof discountPrice === 'number' ? Math.round(discountPrice) : Math.round(Number(String(discountPrice).replace(/\D/g, '')) || 0))
      : null;
    const numStock = typeof stock === 'number' ? Math.round(stock) : Math.round(Number(String(stock || '').replace(/\D/g, '')) || 0);

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        slug,
        price: numPrice,
        discountPrice: numDiscount,
        stock: numStock,
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
