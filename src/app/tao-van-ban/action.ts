"use server";

export async function verifyLogin(username: string, password: string) {
  if (username === "admin" && password === "admin123123") {
    return { success: true };
  }
  
  return { success: false, message: "Tài khoản hoặc mật khẩu không chính xác!" };
}