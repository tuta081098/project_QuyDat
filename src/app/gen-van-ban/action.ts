"use server";

// Code trong file này CHỈ chạy trên Server, hoàn toàn vô hình với trình duyệt (F12)
export async function verifyLogin(username: string, password: string) {
  // Hardcode tài khoản/mật khẩu
  if (username === "admin" && password === "admin123123") {
    return { success: true };
  }
  
  return { success: false, message: "Tài khoản hoặc mật khẩu không chính xác!" };
}