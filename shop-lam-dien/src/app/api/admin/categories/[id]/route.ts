import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

const generateSlug = (text: string) => {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
};

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { name, slug, status, headerTab } = await request.json();

    let parentId = null;

    // Xử lý tự động gán Đầu mục gốc (NAM, NỮ...)
    if (headerTab) {
      let rootCat = await prisma.category.findFirst({
        where: { name: headerTab, isHeaderMenu: true }
      });

      if (!rootCat) {
        rootCat = await prisma.category.create({
          data: { name: headerTab, slug: generateSlug(headerTab), isHeaderMenu: true, status: 'ACTIVE' }
        });
      }
      parentId = rootCat.id;
    }

    const checkSlug = slug || generateSlug(name);
    
    // Kiểm tra xem slug mới có bị trùng với danh mục KHÁC không
    const existing = await prisma.category.findFirst({
      where: { slug: checkSlug, id: { not: id } }
    });

    if (existing) {
      return NextResponse.json({ error: 'Đường dẫn (Slug) đã tồn tại ở danh mục khác' }, { status: 400 });
    }

    const category = await prisma.category.update({
      where: { id },
      data: { name, slug: checkSlug, status, parentId, isHeaderMenu: false }
    });
    
    return NextResponse.json({ success: true, data: category });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Lỗi cập nhật danh mục' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Không thể xóa danh mục đang chứa sản phẩm!' }, { status: 400 });
  }
}
