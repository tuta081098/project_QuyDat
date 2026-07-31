import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

const generateSlug = (text: string) => {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
};

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        parent: { select: { name: true } },
        _count: { select: { products: true } }
      }
    });
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi lấy danh mục' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, slug, status, headerTab } = body;

    let parentId = null;

    // Sửa lỗi MongoDB undefined null: Tìm kiếm theo isHeaderMenu thay vì parentId: null
    if (headerTab) {
      let rootCat = await prisma.category.findFirst({
        where: { 
          name: headerTab, 
          isHeaderMenu: true 
        }
      });

      if (!rootCat) {
        rootCat = await prisma.category.create({
          data: { 
            name: headerTab, 
            slug: generateSlug(headerTab), 
            isHeaderMenu: true, 
            status: 'ACTIVE' 
          }
        });
      }
      parentId = rootCat.id;
    }

    const category = await prisma.category.create({
      data: { 
        name, 
        slug: slug || generateSlug(name), 
        status: status || 'ACTIVE', 
        parentId, 
        isHeaderMenu: false 
      }
    });

    return NextResponse.json({ success: true, data: category });
  } catch (error: any) {
    console.error("Lỗi tạo danh mục:", error);
    // Bắt lỗi chi tiết ra log để dễ debug nếu còn lỗi khác
    return NextResponse.json({ error: error.message || 'Lỗi tạo danh mục' }, { status: 500 });
  }
}