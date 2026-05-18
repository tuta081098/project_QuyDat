import { prisma } from '@/src/lib/prisma';
import { NextResponse } from 'next/server';

// Lấy IP từ Request của Next.js
const getClientIp = (request: Request) => {
  return request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown IP';
};

export async function GET() {
  try {
    const templates = await prisma.docTemplate.findMany({
      where: { status: 'ACTIVE' },
      include: { histories: { orderBy: { createdAt: 'desc' } } },
      orderBy: { updatedAt: 'desc' }
    });
    return NextResponse.json(templates);
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi Server' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;
    const clientIp = getClientIp(request);

    if (action === 'CREATE_TEMPLATE') {
      const { name, fileBase64, keys } = body;
      const template = await prisma.docTemplate.create({
        data: { 
          name, 
          fileBase64, 
          keys,
          status: 'ACTIVE',
          updatedIp: clientIp 
        },
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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const clientIp = getClientIp(request);

    if (id) {
      // XÓA MỀM: Chỉ cập nhật trạng thái thành DELETED và lưu lại IP người xóa
      await prisma.docTemplate.update({
        where: { id },
        data: { 
          status: 'DELETED',
          updatedIp: clientIp 
        }
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi Server' }, { status: 500 });
  }
}