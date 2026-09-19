import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { 
        status: { not: 'DELETED' } 
      },
      include: { 
        category: { include: { parent: true } },
        reviews: { include: { user: true }, orderBy: { createdAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi lấy danh sách sản phẩm' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, slug, price, discountPrice, stock, categoryId, status, image, sizes, description } = body;

    const numPrice = typeof price === 'number' ? Math.round(price) : Math.round(Number(String(price || '').replace(/\D/g, '')) || 0);
    const numDiscount = (discountPrice !== null && discountPrice !== undefined && discountPrice !== '') 
      ? (typeof discountPrice === 'number' ? Math.round(discountPrice) : Math.round(Number(String(discountPrice).replace(/\D/g, '')) || 0))
      : null;
    const numStock = typeof stock === 'number' ? Math.round(stock) : Math.round(Number(String(stock || '').replace(/\D/g, '')) || 0);

    const product = await prisma.product.create({
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
    console.error(error);
    return NextResponse.json({ error: 'Lỗi thêm sản phẩm' }, { status: 500 });
  }
}
