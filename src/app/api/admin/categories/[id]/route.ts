import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

// CẬP NHẬT DANH MỤC
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { name, slug, status } = await request.json();
    
    // Kiểm tra xem slug mới có bị trùng với danh mục khác không
    const existing = await prisma.category.findFirst({
      where: { slug, id: { not: id } }
    });
    if (existing) {
      return NextResponse.json({ error: 'Đường dẫn (Slug) đã tồn tại ở danh mục khác' }, { status: 400 });
    }

    const category = await prisma.category.update({
      where: { id },
      data: { name, slug, status }
    });
    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi cập nhật danh mục' }, { status: 500 });
  }
}

// XÓA DANH MỤC
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.category.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2014' || error.code === 'P2003') {
       return NextResponse.json({ error: 'Không thể xóa danh mục đang chứa sản phẩm!' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Lỗi xóa danh mục' }, { status: 500 });
  }
}