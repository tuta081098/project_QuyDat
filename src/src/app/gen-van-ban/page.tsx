import GenVanBanClient from "../../components/gen-van-ban/gen-van-ban-client";

export const metadata = {
  title: 'Tạo Văn Bản - Quản lý Quỹ đất',
  description: 'Công cụ kết xuất và tạo văn bản tự động',
};

export default function GenVanBanPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <GenVanBanClient />
    </div>
  );
}