import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET() {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        product: true,
        customer: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(reviews);
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi lấy danh sách đánh giá' }, { status: 500 });
  }
}