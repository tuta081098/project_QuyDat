import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name, phone, address } = body;

    // 1. Kiểm tra ID người dùng
    if (!id) {
      return NextResponse.json({ error: 'Không tìm thấy ID người dùng' }, { status: 400 });
    }

    // 2. Cập nhật thông tin trong Database
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        phone,
        address
      },
      // Chỉ trả về các trường cần thiết, tuyệt đối không trả về password
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        image: true,
      }
    });

    return NextResponse.json({ success: true, data: updatedUser });
    
  } catch (error) {
    console.error("Lỗi cập nhật Profile:", error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi cập nhật thông tin' }, { status: 500 });
  }
}