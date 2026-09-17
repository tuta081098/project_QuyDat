import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

// Chú ý: Đổi kiểu dữ liệu của params thành Promise<{ id: string }>
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // BỔ SUNG AWAIT Ở ĐÂY
    const { id } = await params; 
    
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

      stock = normalizedVariants.reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0);

      // Tổng hợp sizes từ tất cả biến thể màu
      const allVariantSizes = normalizedVariants.flatMap((v: any) => Array.isArray(v.sizes) ? v.sizes : (v.sizes ? v.sizes.split(',').map((s: string) => s.trim()).filter(Boolean) : []));
      if (allVariantSizes.length > 0) {
        computedSizes = Array.from(new Set(allVariantSizes));
      }
    }

    const product = await prisma.product.update({
      where: { id },
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
    return NextResponse.json({ error: 'Lỗi cập nhật sản phẩm' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // BỔ SUNG AWAIT Ở ĐÂY
    const { id } = await params;

    await prisma.product.update({ 
      where: { id },
      data: { status: 'DELETED' }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Lỗi xóa sản phẩm' }, { status: 500 });
  }
}