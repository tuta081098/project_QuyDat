import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop Lam Điền",
  description: "Thương hiệu giày dép Việt Nam chất lượng cao - Lam Điền Footwear & Lifestyle",
};

export default function ShopLamDienLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
