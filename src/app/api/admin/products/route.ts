import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      // BỔ SUNG ĐIỀU KIỆN NÀY: CHỈ LẤY SẢN PHẨM KHÁC "DELETED"
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

    const product = await prisma.product.create({
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
    console.error(error);
    return NextResponse.json({ error: 'Lỗi thêm sản phẩm' }, { status: 500 });
  }
}