import { prisma } from '@/src/lib/prisma';
import { NextResponse } from 'next/server';

// LẤY DANH SÁCH DANH MỤC
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: 'desc' },
      // Lấy kèm số lượng sản phẩm trong mỗi danh mục
      include: {
        _count: {
          select: { products: true }
        }
      }
    });
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi lấy danh mục' }, { status: 500 });
  }
}

// THÊM MỚI DANH MỤC
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, slug, status } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Tên và Slug không được để trống' }, { status: 400 });
    }

    // Kiểm tra trùng Slug
    const existingCategory = await prisma.category.findUnique({ where: { slug } });
    if (existingCategory) {
      return NextResponse.json({ error: 'Đường dẫn (Slug) đã tồn tại' }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: { name, slug, status: status || 'ACTIVE' }
    });

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi tạo danh mục' }, { status: 500 });
  }
}