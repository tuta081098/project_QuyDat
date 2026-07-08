import { prisma } from '@/src/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const categoryId = searchParams.get('categoryId') || '';

        const where: any = {
            status: { not: 'DELETED' },
            name: { contains: search, mode: 'insensitive' }
        };
        if (categoryId) where.categoryId = categoryId;

        const products = await prisma.product.findMany({
            where,
            include: { category: true },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(products);
    } catch (error) {
        return NextResponse.json({ error: 'Lỗi lấy danh sách sản phẩm' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, slug, price, stock, image, categoryId, status } = body;

        if (!name || !slug || !price || !categoryId) {
            return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
        }

        const product = await prisma.product.create({
            data: { name, slug, price: Number(price), stock: Number(stock || 0), image, categoryId, status: status || 'ACTIVE' }
        });
        return NextResponse.json({ success: true, data: product });
    } catch (error) {
        return NextResponse.json({ error: 'Lỗi thêm sản phẩm' }, { status: 500 });
    }
}