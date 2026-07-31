import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

const generateSlug = (text: string) => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

export async function GET() {
  try {
    // 1. Chỉ lấy thông tin bảng Product, KHÔNG dùng include để tránh crash
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // 2. Lấy thông tin tất cả Categories hiện có
    const categories = await prisma.category.findMany({
      select: { 
        id: true, 
        name: true,
        parent: { select: { name: true } }
      }
    });

    // 3. Tự động map (ghép) category vào từng sản phẩm một cách an toàn
    const formattedProducts = products.map((product) => {
      const matchCat = categories.find(c => c.id === product.categoryId);
      return {
        ...product,
        // Nếu không tìm thấy category (bị xoá), trả về chuỗi cảnh báo an toàn
        category: matchCat ? matchCat : { name: "Danh mục đã xóa", parent: null }
      };
    });

    return NextResponse.json(formattedProducts);
  } catch (error: any) {
    console.error("Lỗi lấy danh sách sản phẩm:", error);
    return NextResponse.json({ error: 'Lỗi lấy danh sách sản phẩm' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, slug, price, discountPrice, stock, categoryId, sizes, image, status, description } = body;

    const productSlug = slug || generateSlug(name);

    const existingProduct = await prisma.product.findUnique({
      where: { slug: productSlug }
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: 'Sản phẩm hoặc đường dẫn này đã tồn tại. Vui lòng đổi tên khác!' },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
        data: {
          name,
          slug: productSlug,
          price: Number(price) || 0,
          discountPrice: discountPrice ? Number(discountPrice) : null, // MỚI
          stock: Number(stock) || 0,
          sizes: Array.isArray(sizes) ? sizes : [], 
          image: image || "",
          status: status || 'ACTIVE',
          categoryId,
          description: description || ""
        }
      });

    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    console.error("Lỗi tạo sản phẩm:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Sản phẩm này đã tồn tại trong hệ thống.' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Lỗi hệ thống khi tạo sản phẩm' }, { status: 500 });
  }
}