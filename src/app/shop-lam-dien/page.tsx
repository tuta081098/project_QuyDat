"use client";

import React, { useState } from "react";
import { 
  Search, ShoppingCart, User, Menu, ChevronRight, 
  ChevronDown, Star, Leaf, ShieldCheck, Smile, 
  MapPin, Phone, Mail
} from "lucide-react";
import Link from "next/link";

// --- MOCK DATA ---
const CATEGORIES = [
  { name: "Giày Chạy Bộ", img: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=200" },
  { name: "Giày Leo Núi", img: "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&q=80&w=200" },
  { name: "Giày Đi Chơi", img: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=200" },
  { name: "Phụ Kiện", img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=200" },
];

const PRODUCTS = [
  { id: 1, name: "Giày Hiking Lam Điền - Jade", price: "230.000 VND", img: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=400" },
  { id: 2, name: "Giày Hiking Lam Điền - Sand", price: "230.000 VND", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400" },
  { id: 3, name: "Giày Chạy Trail Lam Điền - Black", price: "150.000 VND", img: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80&w=400" },
  { id: 4, name: "Giày Leo Núi Cao Cấp - Forest", price: "320.000 VND", img: "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?auto=format&fit=crop&q=80&w=400" },
  { id: 5, name: "Giày Đi Chơi - Minimalist", price: "188.000 VND", img: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&q=80&w=400" },
  { id: 6, name: "Giày Thể Thao Đa Năng - Stone", price: "159.000 VND", img: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=400" },
];

export default function ShopLamDienPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">
      
      {/* 1. HEADER */}
      <header className="sticky top-0 z-50 bg-white border-b border-teal-100 shadow-sm">
        {/* Top bar (Header compact theo Figma) */}
        <div className="bg-teal-900 text-white text-xs py-1.5 px-4 text-center tracking-wide">
          GIAO HÀNG MIỄN PHÍ CHO ĐƠN HÀNG TỪ 500K - MÃ: FREESHIP
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            
            {/* Logo thay bằng ảnh logo-1.png */}
            <div className="flex-shrink-0 flex items-center cursor-pointer">
              <img 
                src="/images/logo-1.png" 
                alt="Logo Giày Lam Điền" 
                className="h-16 md:h-20 w-auto object-contain"
                onError={(e) => {
                  // Fallback phòng trường hợp bạn chưa tạo thư mục hoặc copy sai tên ảnh
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement?.classList.add('fallback-logo-active');
                }}
              />
              {/* Đoạn text này chỉ hiện ra nếu ảnh bị lỗi (chưa kịp copy ảnh) */}
              <div className="hidden fallback-logo-active:flex flex-col ml-2">
                <span className="font-black text-2xl text-teal-900 leading-none tracking-tight">GIÀY LAM ĐIỀN</span>
                <span className="text-[10px] uppercase font-bold text-teal-600 tracking-[0.2em]">Bước chân tự nhiên</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex space-x-8">
              {['NAM', 'NỮ', 'TRẺ EM', 'PHỤ KIỆN', 'BỘ SƯU TẬP', 'GIẢM GIÁ'].map((item) => (
                <Link key={item} href="#" className="text-sm font-bold text-slate-700 hover:text-teal-700 transition-colors">
                  {item}
                </Link>
              ))}
            </nav>

            {/* Icons & Search */}
            <div className="flex items-center gap-4">
              <div className="hidden md:flex relative">
                <input 
                  type="text" 
                  placeholder="Tìm kiếm..." 
                  className="w-48 pl-4 pr-10 py-2 border border-slate-200 rounded-full text-sm focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 bg-slate-50"
                />
                <button className="absolute right-1 top-1 w-8 h-8 bg-teal-800 rounded-full flex items-center justify-center text-white hover:bg-teal-900 transition-colors">
                  <Search className="w-4 h-4" />
                </button>
              </div>
              
              <button className="text-slate-600 hover:text-teal-800 transition-colors"><User className="w-6 h-6" /></button>
              <button className="text-slate-600 hover:text-teal-800 transition-colors relative">
                <ShoppingCart className="w-6 h-6" />
                <span className="absolute -top-1.5 -right-1.5 bg-teal-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">6</span>
              </button>
              <button className="lg:hidden text-slate-600" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-100 p-4 space-y-3 shadow-md">
            {['NAM', 'NỮ', 'TRẺ EM', 'PHỤ KIỆN', 'BỘ SƯU TẬP', 'GIẢM GIÁ'].map((item) => (
              <Link key={item} href="#" className="block text-sm font-bold text-slate-700 hover:text-teal-700">{item}</Link>
            ))}
          </div>
        )}
      </header>

      {/* 2. HERO BANNER */}
      <section className="relative h-[400px] md:h-[500px] lg:h-[600px] w-full bg-slate-900 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-65">
          <img 
            src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2000" 
            alt="Hiking Mountains" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-10">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-8 uppercase tracking-tight leading-tight drop-shadow-lg">
            CHINH PHỤC MỌI CUNG <br />
            ĐƯỜNG - MUA NGAY!
          </h1>
          <button className="bg-white text-teal-900 font-black px-10 py-3.5 hover:bg-teal-50 transition-all transform hover:scale-105 shadow-xl uppercase tracking-widest text-sm">
            KHÁM PHÁ
          </button>
        </div>
      </section>

      {/* 3. CATEGORIES (Danh mục sản phẩm) */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-black text-slate-900 mb-10 uppercase tracking-wider">DANH MỤC SẢN PHẨM</h2>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {CATEGORIES.map((cat, idx) => (
              <div key={idx} className="flex flex-col items-center cursor-pointer group">
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden bg-slate-100 border-4 border-transparent group-hover:border-teal-600 transition-all mb-4 relative flex items-center justify-center">
                  <img src={cat.img} alt={cat.name} className="w-4/5 h-4/5 object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
                </div>
                <span className="text-sm font-bold text-slate-800 group-hover:text-teal-700 uppercase">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. MAIN SHOP AREA (SIDEBAR + PRODUCT GRID) */}
      <section className="py-12 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-black text-slate-900 mb-10 text-center uppercase tracking-wider">SẢN PHẨM MỚI NHẤT</h2>
          
          <div className="flex flex-col lg:flex-row gap-10">
            
            {/* SIDEBAR LỌC (Filter) */}
            <aside className="w-full lg:w-64 flex-shrink-0">
              <div className="bg-white p-6 rounded-none border border-slate-200 shadow-sm sticky top-28">
                
                {/* Filter Category */}
                <div className="mb-6 border-b border-slate-200 pb-6">
                  <h3 className="font-bold text-slate-800 mb-4 flex justify-between items-center cursor-pointer uppercase text-sm">
                    Category <ChevronDown className="w-4 h-4 text-slate-400" />
                  </h3>
                  <div className="space-y-3">
                    {['Giày chạy bộ', 'Giày leo núi', 'Giày đi chơi', 'Phụ kiện'].map(item => (
                      <label key={item} className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer" />
                        <span className="text-sm text-slate-600 group-hover:text-teal-800">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Filter Size */}
                <div className="mb-6 border-b border-slate-200 pb-6">
                  <h3 className="font-bold text-slate-800 mb-4 flex justify-between items-center cursor-pointer uppercase text-sm">
                    Size <ChevronDown className="w-4 h-4 text-slate-400" />
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {['35', '36', '37', '38', '39', '40', '41', '42'].map(size => (
                      <button key={size} className="w-10 h-10 border border-slate-200 text-sm font-bold text-slate-600 hover:border-teal-600 hover:text-teal-700 focus:bg-teal-50 focus:border-teal-600 transition-colors">
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter Price */}
                <div>
                  <h3 className="font-bold text-slate-800 mb-4 flex justify-between items-center uppercase text-sm">Giá</h3>
                  <input type="range" min="100000" max="2000000" className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600" />
                  <div className="flex justify-between text-xs text-slate-500 mt-3 font-medium">
                    <span>10.000 VND</span>
                    <span>2.000.000 VND</span>
                  </div>
                </div>
              </div>
            </aside>

            {/* LƯỚI SẢN PHẨM */}
            <div className="flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {PRODUCTS.map((prod) => (
                  <div key={prod.id} className="bg-white border border-slate-200 overflow-hidden hover:shadow-lg transition-all group flex flex-col relative">
                    
                    {/* Badge Mới */}
                    <span className="absolute top-3 left-3 bg-teal-600 text-white text-[10px] font-bold px-3 py-1 uppercase tracking-wider z-10">MỚI</span>
                    
                    {/* Hình ảnh */}
                    <div className="relative h-64 bg-slate-100 p-6 flex items-center justify-center overflow-hidden">
                      <img src={prod.img} alt={prod.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    
                    {/* Thông tin */}
                    <div className="p-5 flex flex-col flex-1 text-center">
                      <h3 className="font-bold text-slate-800 mb-2 leading-snug line-clamp-2 text-sm">{prod.name}</h3>
                      <p className="text-slate-900 font-black mb-5 text-lg">{prod.price}</p>
                      
                      <div className="mt-auto flex flex-col gap-2">
                        <button className="w-full py-3 bg-teal-800 hover:bg-teal-900 text-white text-sm font-bold uppercase transition-colors">
                          THÊM VÀO GIỎ
                        </button>
                        <button className="w-full py-2.5 bg-white text-slate-800 hover:bg-slate-100 text-xs font-bold uppercase transition-colors">
                          XEM NHANH
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Phân trang */}
              <div className="flex justify-center mt-12 gap-2">
                <button className="w-10 h-10 bg-teal-800 text-white font-bold flex items-center justify-center">1</button>
                <button className="w-10 h-10 bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 flex items-center justify-center">2</button>
                <button className="w-10 h-10 bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 flex items-center justify-center">3</button>
                <button className="w-10 h-10 bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 flex items-center justify-center"><ChevronRight className="w-5 h-5"/></button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. TẠI SAO CHỌN GIÀY LAM ĐIỀN */}
      <section className="bg-white py-16 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-black text-slate-900 mb-12 text-center uppercase tracking-wider">TẠI SAO CHỌN GIÀY LAM ĐIỀN?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-20 h-20 mx-auto text-teal-700 flex items-center justify-center mb-6">
                <Leaf className="w-12 h-12" strokeWidth={1.5} />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-3 uppercase">Liệu liệu tự nhiên</h3>
              <p className="text-sm text-slate-500 leading-relaxed px-4">Sử dụng nguyên liệu tái chế, thân thiện với thiên nhiên, an toàn cho da.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-20 h-20 mx-auto text-teal-700 flex items-center justify-center mb-6">
                <ShieldCheck className="w-12 h-12" strokeWidth={1.5} />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-3 uppercase">Bền bỉ bên bạn</h3>
              <p className="text-sm text-slate-500 leading-relaxed px-4">Đế cao su nguyên khối chống mài mòn, bám đường cực tốt trên mọi địa hình.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-20 h-20 mx-auto text-teal-700 flex items-center justify-center mb-6">
                <Smile className="w-12 h-12" strokeWidth={1.5} />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-3 uppercase">Thoải mái mãi</h3>
              <p className="text-sm text-slate-500 leading-relaxed px-4">Lớp đệm CloudFoam độc quyền ôm trọn bàn chân, giảm mỏi khi di chuyển.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Ý KIẾN KHÁCH HÀNG */}
      <section className="py-16 bg-slate-50 max-w-7xl mx-auto px-4 w-full">
        <h2 className="text-2xl font-black text-slate-900 mb-12 text-center uppercase tracking-wider">Ý KIẾN KHÁCH HÀNG</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { name: "Hải Trần", quote: "Đôi giày đi êm nhất tôi từng mua. Đi trek 15km mà không hề đau chân." },
            { name: "Minh Nguyễn", quote: "Thiết kế đẹp, màu xanh Jade rất sang. Đóng gói bảo vệ môi trường 10 điểm." },
            { name: "Linh Đan", quote: "Giá quá tốt so với chất lượng. Sẽ tiếp tục ủng hộ hàng Việt Nam như Lam Điền." },
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-8 border border-slate-100 flex flex-col items-center text-center shadow-sm">
              <div className="w-16 h-16 bg-slate-200 rounded-full overflow-hidden mb-4">
                <img src={`https://i.pravatar.cc/150?img=${idx + 10}`} alt="avatar" />
              </div>
              <div className="flex items-center gap-1 mb-4">
                {[1,2,3,4,5].map(star => <Star key={star} className="w-4 h-4 fill-teal-600 text-teal-600" />)}
              </div>
              <p className="text-sm text-slate-600 italic mb-6 leading-relaxed">"{item.quote}"</p>
              <span className="font-bold text-slate-900 text-sm uppercase">{item.name}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-2 mt-8">
          <div className="w-2 h-2 rounded-full bg-teal-600"></div>
          <div className="w-2 h-2 rounded-full bg-slate-300"></div>
          <div className="w-2 h-2 rounded-full bg-slate-300"></div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="bg-teal-900 text-teal-50 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-sm">VỀ CHÚNG TỐI</h4>
            <p className="text-sm text-teal-100/70 leading-relaxed pr-4">
              Chúng tôi tạo ra những đôi giày sinh ra để cùng bạn khám phá thế giới, nâng niu từng bước chân thuận theo tự nhiên nhất.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-sm">CHÍNH SÁCH</h4>
            <ul className="space-y-3 text-sm text-teal-100/70">
              <li><Link href="#" className="hover:text-white transition-colors">Chính sách bảo hành</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Đổi trả & Hoàn tiền</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Điều khoản dịch vụ</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Bảo mật thông tin</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-sm">HỖ TRỢ</h4>
            <ul className="space-y-3 text-sm text-teal-100/70">
              <li><Link href="#" className="hover:text-white transition-colors">Hướng dẫn chọn size</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Câu hỏi thường gặp</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Tra cứu đơn hàng</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Liên hệ bộ phận CSKH</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-sm">LIÊN HỆ</h4>
            <ul className="space-y-4 text-sm text-teal-100/70">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 shrink-0 text-teal-400" />
                <span>228 Đ. Cầu Giấy, Quan Hoa, Cầu Giấy, Hà Nội</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 shrink-0 text-teal-400" />
                <span>Hotline: 1900 1000</span>
              </li>
            </ul>
            <div className="flex gap-4 mt-6">
              {/* <Link href="#" className="w-8 h-8 rounded-full bg-teal-800 flex items-center justify-center hover:bg-white hover:text-teal-900 transition-colors"><Facebook className="w-4 h-4" /></Link> */}
              {/* <Link href="#" className="w-8 h-8 rounded-full bg-teal-800 flex items-center justify-center hover:bg-white hover:text-teal-900 transition-colors"><Instagram className="w-4 h-4" /></Link> */}
              {/* <Link href="#" className="w-8 h-8 rounded-full bg-teal-800 flex items-center justify-center hover:bg-white hover:text-teal-900 transition-colors"><Twitter className="w-4 h-4" /></Link> */}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pt-8 border-t border-teal-800 text-center text-xs text-teal-400/60 uppercase">
          <p>© 2026 GIAY LAM DIEN - BƯỚC CHÂN TỰ NHIÊN. ALL RIGHTS RESERVED.</p>
        </div>
      </footer>

    </div>
  );
}