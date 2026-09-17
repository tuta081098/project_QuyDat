import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      // CHỈ LẤY SẢN PHẨM KHÁC "DELETED"
      where: { 
        status: { not: 'DELETED' } 
      },
      include: { 
        category: { include: { parent: true } },
        reviews: { include: { user: true }, orderBy: { createdAt: 'desc' } }
      },
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
    const { name, slug, categoryId, status, image, images, sizes, description, colorVariants } = body;

    const finalImages: string[] = Array.isArray(images)
      ? images.filter(Boolean)
      : (image ? [image] : []);
    const primaryImage = finalImages[0] || image || "";

    // Tính giá và tồn kho tổng hợp từ các biến thể màu
    let price = 0;
    let discountPrice: number | null = null;
    let stock = 0;
    let computedSizes = sizes || [];

    let normalizedVariants = colorVariants;
    if (colorVariants && Array.isArray(colorVariants) && colorVariants.length > 0) {
      // Giá = giá của biến thể đầu tiên
      price = colorVariants[0].price || 0;
      discountPrice = colorVariants[0].discountPrice || null;

      // Chuẩn hóa tồn kho từng variant nếu có sizeStocks
      normalizedVariants = colorVariants.map((v: any) => {
        if (v.sizeStocks && typeof v.sizeStocks === 'object' && Object.keys(v.sizeStocks).length > 0) {
          const totalSizeStock = Object.values(v.sizeStocks).reduce((sum: number, cur: any) => sum + (Number(cur) || 0), 0);
          return { ...v, stock: totalSizeStock };
        }
        return v;
      });

      // Tồn kho = tổng tất cả biến thể
      stock = normalizedVariants.reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0);
      
      // Tổng hợp sizes từ tất cả biến thể màu
      const allVariantSizes = normalizedVariants.flatMap((v: any) => Array.isArray(v.sizes) ? v.sizes : (v.sizes ? v.sizes.split(',').map((s: string) => s.trim()).filter(Boolean) : []));
      if (allVariantSizes.length > 0) {
        computedSizes = Array.from(new Set(allVariantSizes));
      }
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        price,
        discountPrice,
        stock,
        categoryId,
        status,
        image: primaryImage,
        images: finalImages,
        sizes: computedSizes,
        description,
        colorVariants: normalizedVariants || []
      } as any
    });
    return NextResponse.json(product);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Lỗi thêm sản phẩm' }, { status: 500 });
  }
}