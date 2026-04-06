import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/src/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const body = await request.json();
    const resolvedParams = await params; 
    const projectId = resolvedParams.id;

    // Lấy ngày deadline gửi lên từ form (dùng chung cho cả 2 nhánh)
    const deadlineDate = body.deadline ? new Date(body.deadline) : null; 

    // NHÁNH 1: CẬP NHẬT THÔNG TIN CHI TIẾT
    if (body.action === "UPDATE_DETAILS") {
      await prisma.projectDetail.upsert({
        where: { projectId: projectId },
        update: { tienDoDuAn: body.tienDoDuAn, chiTiet: body.chiTiet, donViDoDac: body.donViDoDac, canBoGPMB: body.canBoGPMB, mo: body.mo, ghiChu: body.ghiChu },
        create: { projectId: projectId, tienDoDuAn: body.tienDoDuAn, chiTiet: body.chiTiet, donViDoDac: body.donViDoDac, canBoGPMB: body.canBoGPMB, mo: body.mo, ghiChu: body.ghiChu }
      });
      
      await prisma.project.update({ where: { id: projectId }, data: { deadline: deadlineDate } });
      await prisma.projectHistory.create({ data: { projectId, note: "Cập nhật thông tin chi tiết & hạn chót" } });

      revalidatePath('/');
      return NextResponse.json({ success: true });
    }

    // NHÁNH 2: CẬP NHẬT TIẾN ĐỘ SỐ LÔ
    const oldProject = await prisma.project.findUnique({ where: { id: projectId } });
    if (!oldProject) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });

    const calculatedTotalLots = body.chuaBanHanhCount + body.chuaKiemKeCount + body.xacNhanCount + body.duThaoCount + body.thamDinhCount + body.pheDuyetCount;
    
    const changes: string[] = [];
    if (oldProject.totalLots !== calculatedTotalLots) changes.push(`Tổng lô: ${oldProject.totalLots} ➡️ ${calculatedTotalLots}`);
    if (oldProject.chuaBanHanhCount !== body.chuaBanHanhCount) changes.push(`C.Ban hành: ${oldProject.chuaBanHanhCount} ➡️ ${body.chuaBanHanhCount}`);
    if (oldProject.chuaKiemKeCount !== body.chuaKiemKeCount) changes.push(`C.Kiểm kê: ${oldProject.chuaKiemKeCount} ➡️ ${body.chuaKiemKeCount}`);
    if (oldProject.xacNhanCount !== body.xacNhanCount) changes.push(`Xác nhận: ${oldProject.xacNhanCount} ➡️ ${body.xacNhanCount}`);
    if (oldProject.duThaoCount !== body.duThaoCount) changes.push(`Dự thảo: ${oldProject.duThaoCount} ➡️ ${body.duThaoCount}`);
    if (oldProject.thamDinhCount !== body.thamDinhCount) changes.push(`Thẩm định: ${oldProject.thamDinhCount} ➡️ ${body.thamDinhCount}`);
    if (oldProject.pheDuyetCount !== body.pheDuyetCount) changes.push(`Phê duyệt: ${oldProject.pheDuyetCount} ➡️ ${body.pheDuyetCount}`);
    
    // So sánh thời gian thay đổi (Nếu khác nhau thì ghi log)
    if (oldProject.deadline?.getTime() !== deadlineDate?.getTime()) {
      changes.push(`Hạn chót cập nhật: ${deadlineDate ? deadlineDate.toLocaleDateString('vi-VN') : 'Xóa hạn'}`);
    }

    const isCompleted = body.pheDuyetCount === calculatedTotalLots && calculatedTotalLots > 0;
    
    const updatedProject = await prisma.$transaction([
      prisma.project.update({
        where: { id: projectId },
        data: {
          totalLots: calculatedTotalLots, 
          status: isCompleted ? "COMPLETED" : "ACTIVE",
          deadline: deadlineDate, // Cập nhật luôn deadline cùng tiến độ
          chuaBanHanhCount: body.chuaBanHanhCount, chuaKiemKeCount: body.chuaKiemKeCount,
          xacNhanCount: body.xacNhanCount, duThaoCount: body.duThaoCount,
          thamDinhCount: body.thamDinhCount, pheDuyetCount: body.pheDuyetCount,
        },
      }),
      ...(changes.length > 0 ? [prisma.projectHistory.create({ data: { projectId, note: changes.join(" | ") } })] : [])
    ]);

    revalidatePath('/'); 
    return NextResponse.json(updatedProject[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Lỗi cập nhật' }, { status: 500 });
  }
}