import { NextResponse } from "next/server";
import { createToken } from "@/src/lib/auth";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // Đối chiếu trực tiếp với biến môi trường lưu tại Server
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
      const token = await createToken({ username });

      const response = NextResponse.json({ success: true, message: "Đăng nhập thành công" });

      // Thiết lập Cookie HttpOnly - Khóa tuyệt đối không cho JS Client tiếp cận
      response.cookies.set("admin_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 1 ngày
        path: "/",
      });

      return response;
    }

    return NextResponse.json({ success: false, message: "Tài khoản hoặc mật khẩu không chính xác" }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Lỗi hệ thống" }, { status: 500 });
  }
}
