import TaoVanBanClient from "@/src/components/tao-van-ban/tao-van-ban-client";


export const metadata = {
  title: 'Tạo Văn Bản - Quản lý Quỹ đất',
  description: 'Công cụ gán dữ liệu tự động vào file mẫu Word',
};

export default function DocumentGeneratorPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <TaoVanBanClient />
    </div>
  );
}