import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) return NextResponse.json({ error: 'Vui lòng nhập email và mật khẩu' }, { status: 400 });

    // 1. Tìm user qua Email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Email không tồn tại trong hệ thống' }, { status: 404 });
    }

    // 2. Kiểm tra trạng thái tài khoản
    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Tài khoản của bạn đã bị khóa' }, { status: 403 });
    }

    // 3. So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Mật khẩu không chính xác' }, { status: 401 });
    }

    // 4. Tạo token phiên ngẫu nhiên (Session) hỗ trợ lưu đăng nhập nhiều thiết bị
    const sessionToken = crypto.randomBytes(32).toString('hex');
    await prisma.user.update({
      where: { id: user.id },
      data: { sessionToken }
    });

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ 
      success: true, 
      data: { ...userWithoutPassword, token: sessionToken } 
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'Lỗi server xử lý đăng nhập' }, { status: 500 });
  }
}