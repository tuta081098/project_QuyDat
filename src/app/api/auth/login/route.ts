import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // 1. Kiểm tra đầu vào
    if (!email || !password) {
      return NextResponse.json({ error: 'Vui lòng nhập email và mật khẩu' }, { status: 400 });
    }

    // 2. Tìm User trong Database
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json({ error: 'Tài khoản không tồn tại' }, { status: 401 });
    }

    // 3. Kiểm tra nếu tài khoản này không có mật khẩu (Đăng ký qua Google)
    if (!user.password) {
      return NextResponse.json({ error: 'Tài khoản này được đăng ký qua Google. Vui lòng bấm nút "Đăng nhập bằng Google".' }, { status: 400 });
    }

    // 4. So sánh mật khẩu 
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Mật khẩu không chính xác' }, { status: 401 });
    }

    // 5. Kiểm tra trạng thái tài khoản
    if (user.status === 'BANNED') {
      return NextResponse.json({ error: 'Tài khoản của bạn đã bị khóa' }, { status: 403 });
    }

    // Xóa password trước khi trả về client để bảo mật
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      data: userWithoutPassword
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Lỗi máy chủ nội bộ' }, { status: 500 });
  }
}