import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

const generateSlug = (text: string) => {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
};

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, slug, price, discountPrice, stock, categoryId, sizes, image, status, description } = body;

    const productSlug = slug || generateSlug(name);

    // Kiểm tra trùng lặp đường dẫn với sản phẩm KHÁC
    const existingProduct = await prisma.product.findFirst({
      where: { slug: productSlug, id: { not: id } }
    });

    if (existingProduct) {
      return NextResponse.json({ error: 'Đường dẫn này đã tồn tại ở sản phẩm khác.' }, { status: 400 });
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name, 
        slug: productSlug, 
        price: Number(price) || 0,
        discountPrice: discountPrice ? Number(discountPrice) : null,
        stock: Number(stock) || 0, 
        image: image || "", 
        categoryId, 
        status: status || 'ACTIVE', 
        sizes: Array.isArray(sizes) ? sizes : [] ,
        description: description || ""
      }
    });
    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    console.error("Lỗi cập nhật SP:", error);
    return NextResponse.json({ error: error.message || 'Lỗi cập nhật sản phẩm' }, { status: 500 });
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
    return NextResponse.json({ error: 'Lỗi xóa sản phẩm' }, { status: 500 });
  }
}