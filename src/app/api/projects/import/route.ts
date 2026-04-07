import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/src/lib/prisma';

export async function POST(request: Request) {
  try {
    const projectsData = await request.json();

    if (!Array.isArray(projectsData) || projectsData.length === 0) {
      return NextResponse.json({ error: 'Dữ liệu trống hoặc không hợp lệ' }, { status: 400 });
    }

    let successCount = 0;

    // Dùng vòng lặp để insert từng dự án kèm theo bảng Chi tiết và Lịch sử
    for (const row of projectsData) {
      // Bỏ qua những dòng trống không có tên Dự án
      if (!row["Dự án"] || String(row["Dự án"]).trim() === "") continue;

      await prisma.project.create({
        data: {
          name: String(row["Dự án"]).trim(),
          totalLots: 0, // Mặc định khi mới import
          details: {
            create: {
              tienDoDuAn: row["Tiến độ dự án"] ? String(row["Tiến độ dự án"]) : "Đấu giá",
              chiTiet: row["Chi Tiết"] ? String(row["Chi Tiết"]) : "Chưa nhận mốc",
              donViDoDac: row["Đơn vị đo đạc"] ? String(row["Đơn vị đo đạc"]) : "",
              canBoGPMB: row["Cán bộ GPMB"] ? String(row["Cán bộ GPMB"]) : "",
              mo: row["Mộ"] ? String(row["Mộ"]) : "",
              ghiChu: row["Ghi chú"] ? String(row["Ghi chú"]) : ""
            }
          },
          histories: {
            create: { note: "Import dữ liệu khởi tạo từ file Excel" }
          }
        }
      });
      successCount++;
    }

    revalidatePath('/');
    return NextResponse.json({ success: true, count: successCount });
  } catch (error) {
    console.error('Lỗi Import Excel:', error);
    return NextResponse.json({ error: 'Đã xảy ra lỗi khi lưu vào Database' }, { status: 500 });
  }
}