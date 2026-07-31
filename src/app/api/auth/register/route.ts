import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { name, email, phone, password } = await request.json();

    // 1. Validate dữ liệu đầu vào
    if (!email || !password || !name || !phone) {
      return NextResponse.json({ error: 'Vui lòng điền đầy đủ thông tin' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' }, { status: 400 });
    }

    // 2. Kiểm tra email đã tồn tại chưa
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Email này đã được đăng ký' }, { status: 400 });
    }

    // 3. Mã hóa mật khẩu (Hash)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Lưu User vào DB
    const user = await prisma.user.create({
      data: {
        name, email, phone, password: hashedPassword,
        role: 'USER', status: 'ACTIVE'
      }
    });

    // 5. Loại bỏ password trước khi trả về Client
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ success: true, data: userWithoutPassword });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Lỗi server' }, { status: 500 });
  }
}