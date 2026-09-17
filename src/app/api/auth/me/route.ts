import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

// API Lấy thông tin mới nhất của User (Bao gồm SĐT, Địa chỉ, Sổ địa chỉ giao hàng, Giỏ hàng)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

    const user: any = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, phone: true, address: true, role: true, cartData: true, addresses: true } as any
    });

    if (!user) {
      return NextResponse.json({ error: 'Không tìm thấy tài khoản' }, { status: 404 });
    }

    // Nếu chưa có mảng addresses nhưng có address/phone đơn lẻ, tự động khởi tạo địa chỉ mặc định đầu tiên
    let addresses = Array.isArray(user.addresses) ? user.addresses : [];
    if (addresses.length === 0 && (user.address || user.phone)) {
      addresses = [{
        id: `addr_${Date.now()}`,
        recipientName: user.name || '',
        recipientPhone: user.phone || '',
        address: user.address || '',
        label: 'Nhà riêng',
        isDefault: true
      }];
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        ...user,
        addresses
      } 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

// API Cập nhật thông tin Profile, Sổ địa chỉ & Đồng bộ Giỏ hàng
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name, phone, address, cartData, addresses } = body;

    if (!id) return NextResponse.json({ error: 'Không tìm thấy ID người dùng' }, { status: 400 });

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (cartData !== undefined) updateData.cartData = cartData; // Lưu giỏ hàng

    // Nếu cập nhật danh sách địa chỉ giao hàng
    if (addresses !== undefined && Array.isArray(addresses)) {
      // Đảm bảo có ít nhất 1 địa chỉ là mặc định nếu danh sách không rỗng
      let hasDefault = addresses.some((a: any) => a.isDefault);
      const normalizedAddresses = addresses.map((a: any, idx: number) => {
        if (!hasDefault && idx === 0) return { ...a, isDefault: true };
        return a;
      });

      updateData.addresses = normalizedAddresses;

      // Đồng bộ địa chỉ mặc định vào trường address và phone chính của User
      const defaultAddr = normalizedAddresses.find((a: any) => a.isDefault) || normalizedAddresses[0];
      if (defaultAddr) {
        if (defaultAddr.address) updateData.address = defaultAddr.address;
        if (defaultAddr.recipientPhone) updateData.phone = defaultAddr.recipientPhone;
      }
    }

    const updatedUser: any = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, phone: true, address: true, role: true, cartData: true, addresses: true } as any
    });

    return NextResponse.json({ 
      success: true, 
      data: {
        ...updatedUser,
        addresses: Array.isArray(updatedUser.addresses) ? updatedUser.addresses : (updateData.addresses || [])
      } 
    });
  } catch (error) {
    console.error("Lỗi cập nhật Profile:", error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi cập nhật thông tin' }, { status: 500 });
  }
}