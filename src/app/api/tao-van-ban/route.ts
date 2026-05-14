import { prisma } from '@/src/lib/prisma';
import { NextResponse } from 'next/server';

// ĐỌC: Lấy toàn bộ danh sách mẫu và lịch sử
export async function GET() {
  try {
    const templates = await prisma.docTemplate.findMany({
      include: { histories: { orderBy: { createdAt: 'desc' } } },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(templates);
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi Server' }, { status: 500 });
  }
}

// LƯU: Lưu mẫu mới hoặc Lưu lịch sử xuất file
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'CREATE_TEMPLATE') {
      const { name, fileBase64, keys } = body;
      const template = await prisma.docTemplate.create({
        data: { name, fileBase64, keys },
        include: { histories: true }
      });
      return NextResponse.json(template);
    }

    if (action === 'SAVE_HISTORY') {
      const { templateId, excelName, recordCount, dataSnapshot } = body;
      const history = await prisma.docHistory.create({
        data: { templateId, excelName, recordCount, dataSnapshot }
      });
      return NextResponse.json(history);
    }

    return NextResponse.json({ error: 'Action không hợp lệ' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi Server' }, { status: 500 });
  }
}

// XÓA: Xóa mẫu
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (id) {
      await prisma.docTemplate.delete({ where: { id } });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi Server' }, { status: 500 });
  }
}