import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        parent: true,
        // CẬP NHẬT: Đếm số lượng sản phẩm, loại bỏ những sản phẩm đã xóa mềm
        _count: {
          select: {
            products: {
              where: {
                status: { not: 'DELETED' } 
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi lấy danh sách danh mục' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, slug, status, headerTab } = body;

    // Tìm Header Menu cha dựa trên tên (headerTab)
    let parentCategory = null;
    if (headerTab) {
      parentCategory = await prisma.category.findFirst({
        where: { name: headerTab, isHeaderMenu: true }
      });
      
      // Nếu chưa có thì tự động tạo Đầu mục gốc
      if (!parentCategory) {
         parentCategory = await prisma.category.create({
           data: { 
             name: headerTab, 
             slug: headerTab.toLowerCase().replace(/ /g, '-'), 
             isHeaderMenu: true 
           }
         });
      }
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        status,
        parentId: parentCategory ? parentCategory.id : null
      }
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Lỗi thêm danh mục' }, { status: 500 });
  }
}