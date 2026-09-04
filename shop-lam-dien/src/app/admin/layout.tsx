import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop Lam Điền - Quản trị Admin",
  description: "Hệ thống quản trị Shop Giày Dép Lam Điền",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
