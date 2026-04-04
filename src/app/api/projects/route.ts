import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/src/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Tạo dự án mới kèm luôn bảng chi tiết
    const newProject = await prisma.project.create({
      data: {
        name: body.name,
        code: body.code || "",
        totalLots: 0, // Mới tạo thì chưa có lô nào
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