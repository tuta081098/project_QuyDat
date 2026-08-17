import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

// API Lấy thông tin mới nhất của User (Bao gồm SĐT, Địa chỉ, Giỏ hàng)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, phone: true, address: true, role: true, cartData: true }
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

// API Cập nhật thông tin Profile & Đồng bộ Giỏ hàng
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name, phone, address, cartData } = body;

    if (!id) return NextResponse.json({ error: 'Không tìm thấy ID người dùng' }, { status: 400 });

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (cartData !== undefined) updateData.cartData = cartData; // Lưu giỏ hàng

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, phone: true, address: true, role: true, cartData: true }
    });

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error("Lỗi cập nhật Profile:", error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi cập nhật thông tin' }, { status: 500 });
  }
}
