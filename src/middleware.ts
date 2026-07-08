import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Nếu đang vào trang đăng nhập, cho qua để không bị vòng lặp chuyển hướng
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Nếu truy cập vào các đường dẫn bắt đầu bằng /admin
  if (pathname.startsWith("/admin")) {
    const sessionCookie = request.cookies.get("admin_session")?.value;

    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    // Xác thực chữ ký mã hóa của Token
    const decodedPayload = await verifyToken(sessionCookie);
    if (!decodedPayload) {
      // Token giả mạo hoặc hết hạn -> Xóa cookie và bắt đăng nhập lại
      const response = NextResponse.redirect(new URL("/admin/login", request.url));
      response.cookies.delete("admin_session");
      return response;
    }
  }

  return NextResponse.next();
}

// Cấu hình chỉ quét qua phân hệ admin, bỏ qua các file tĩnh, ảnh, api public
export const config = {
  matcher: ["/admin/:path*"],
};