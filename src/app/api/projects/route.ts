import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/src/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Xử lý chuyển đổi chuỗi ngày tháng thành đối tượng Date của Prisma
    const deadlineDate = body.deadline ? new Date(body.deadline) : null;

    // Tạo dự án mới kèm bảng chi tiết và deadline
    const newProject = await prisma.project.create({
      data: {
        name: body.name,
        code: body.code || "",
        totalLots: 0,
        deadline: deadlineDate, // Lưu deadline vào DB
        details: {
          create: {
            tienDoDuAn: body.tienDoDuAn,
            chiTiet: body.chiTiet,
            donViDoDac: body.donViDoDac,
            canBoGPMB: body.canBoGPMB,
            mo: body.mo,
            ghiChu: body.ghiChu,
          }
        },
        histories: {
          create: { note: "Khởi tạo dự án mới" }
        }
      }
    });

    revalidatePath('/');
    return NextResponse.json(newProject);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Lỗi tạo dự án' }, { status: 500 });
  }
}