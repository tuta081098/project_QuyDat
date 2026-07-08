"use client";

import { useState, useEffect } from "react";
import {
  Search, ShoppingCart, User, Menu, ChevronRight,
  ChevronDown, Star, Leaf, ShieldCheck, Smile,
  MapPin, Phone, Mail, Loader2
} from "lucide-react";
import Link from "next/link";

export default function ShopLamDienPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // --- STATES LƯU TRỮ DỮ LIỆU THẬT ---
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Bộ lọc Client-side phục vụ trải nghiệm người dùng nhanh
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // --- FETCH DỮ LIỆU ĐỒNG BỘ TỪ BACKEND ADMIN ---
  useEffect(() => {
    const loadShopData = async () => {
      setIsLoading(true);
      try {
        // Gọi đồng thời cả 2 API để tối ưu thời gian tải trang
        const [catRes, prodRes] = await Promise.all([
          fetch("/api/admin/categories"),
          fetch("/api/admin/products")
        ]);

        if (catRes.ok) {
          const catData = await catRes.json();
          // Chỉ hiển thị các danh mục có trạng thái ACTIVE
          setCategories(catData.filter((c: any) => c.status === "ACTIVE"));
        }

        if (prodRes.ok) {
          const prodData = await prodRes.json();
          // Chỉ hiển thị sản phẩm hoạt động, bỏ qua các sản phẩm đã xóa mềm (DELETED)
          setProducts(prodData.filter((p: any) => p.status !== "DELETED"));
        }
      } catch (error) {
        console.error("Lỗi đồng bộ dữ liệu Shop:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadShopData();
  }, []);

  // Hàm hỗ trợ format tiền tệ VNĐ chuẩn chỉnh
  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  // --- LOGIC LỌC SẢN PHẨM THEO DANH MỤC & TÌM KIẾM ---
  const filteredProducts = products.filter(prod => {
    const matchesCategory = selectedCategory ? prod.categoryId === selectedCategory : true;
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">

      {/* 1. HEADER */}
      <header className="sticky top-0 z-50 bg-white border-b border-emerald-100 shadow-sm">
        {/* Top bar */}
        <div className="bg-emerald-900 text-white text-xs py-1.5 px-4 text-center">
          Giảm 20% cho đơn hàng đầu tiên - Mã: LAMDIEN20
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => { setSelectedCategory(""); setSearchQuery(""); }}>
              <img
                src="/images/logo-1.png"
                alt="Logo Giày Lam Điền"
                className="h-16 md:h-20 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement?.classList.add('fallback-logo-active');
                }}
              />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex space-x-8">
              {['NAM', 'NỮ', 'TRẺ EM', 'PHỤ KIỆN', 'BỘ SƯU TẬP', 'GIẢM GIÁ'].map((item) => (
                <Link key={item} href="#" className="text-sm font-bold text-slate-700 hover:text-emerald-700 transition-colors">
                  {item}
                </Link>
              ))}
            </nav>

            {/* Icons & Search */}
            <div className="flex items-center gap-4">
              <div className="hidden md:flex relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm sản phẩm..."
                  className="w-48 pl-4 pr-10 py-2 border border-slate-200 rounded-full text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <button className="absolute right-1 top-1 w-8 h-8 bg-emerald-800 rounded-full flex items-center justify-center text-white hover:bg-emerald-900 transition-colors">
                  <Search className="w-4 h-4" />
                </button>
              </div>

              <button className="text-slate-600 hover:text-emerald-800"><User className="w-6 h-6" /></button>
              <button className="text-slate-600 hover:text-emerald-800 relative">
                <ShoppingCart className="w-6 h-6" />
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">2</span>
              </button>
              <button className="lg:hidden text-slate-600" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-100 p-4 space-y-3">
            {['NAM', 'NỮ', 'TRẺ EM', 'PHỤ KIỆN', 'BỘ SƯU TẬP', 'GIẢM GIÁ'].map((item) => (
              <Link key={item} href="#" className="block text-sm font-bold text-slate-700 hover:text-emerald-700">{item}</Link>
            ))}
          </div>
        )}
      </header>

      {/* 2. HERO BANNER */}
      <section className="relative h-[400px] md:h-[500px] lg:h-[600px] w-full bg-slate-900 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-60">
          <img
            src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2000"
            alt="Hiking Mountains"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 uppercase tracking-tight leading-tight drop-shadow-lg">
            Chinh phục mọi cung đường<br />
            <span className="text-emerald-400">Mua ngay!</span>
          </h1>
          <button className="bg-white text-emerald-900 font-black px-8 py-3.5 rounded-full hover:bg-emerald-50 transition-all transform hover:scale-105 shadow-xl uppercase tracking-widest text-sm">
            Khám phá bộ sưu tập
          </button>
        </div>
      </section>

      {/* 3. CATEGORIES (Đọc tự động từ DB) */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-black text-emerald-900 mb-8 uppercase tracking-wider">Danh mục sản phẩm</h2>
          <div className="flex flex-wrap justify-center gap-6 md:gap-12">
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-emerald-700 mx-auto" />
            ) : (
              categories.map((cat) => (
                <div 
                  key={cat.id} 
                  onClick={() => setSelectedCategory(selectedCategory === cat.id ? "" : cat.id)}
                  className={`flex flex-col items-center cursor-pointer group p-2 rounded-xl transition-all ${selectedCategory === cat.id ? 'bg-emerald-100/60' : ''}`}
                >
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-white border-4 border-white shadow-md group-hover:border-emerald-500 transition-all mb-3 relative">
                    <img 
                      src={cat.image || "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=200"} 
                      alt={cat.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-700 group-hover:text-emerald-700 uppercase">{cat.name}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 4. MAIN SHOP AREA (SIDEBAR + DYNAMIC PRODUCT GRID) */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-black text-emerald-900 mb-10 text-center uppercase tracking-wider">
          {selectedCategory ? `Sản phẩm thuộc nhóm` : "Sản phẩm mới nhất"}
        </h2>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* Lọc sản phẩm (Sidebar) */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm sticky top-24">

              {/* Filter Category (Đồng bộ Checkbox theo DB) */}
              <div className="mb-6 border-b border-slate-100 pb-6">
                <h3 className="font-bold text-slate-800 mb-4 flex justify-between items-center">
                  Category
                </h3>
                <div className="space-y-2.5">
                  {categories.map(cat => (
                    <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={selectedCategory === cat.id}
                        onChange={() => setSelectedCategory(selectedCategory === cat.id ? "" : cat.id)}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" 
                      />
                      <span className={`text-sm group-hover:text-emerald-700 ${selectedCategory === cat.id ? 'text-emerald-700 font-bold' : 'text-slate-600'}`}>{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filter Size */}
              <div className="mb-6 border-b border-slate-100 pb-6">
                <h3 className="font-bold text-slate-800 mb-4 flex justify-between items-center cursor-pointer">
                  Size <ChevronDown className="w-4 h-4 text-slate-400" />
                </h3>
                <div className="flex flex-wrap gap-2">
                  {['35', '36', '37', '38', '39', '40', '41', '42'].map(size => (
                    <button key={size} className="w-10 h-10 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 hover:border-emerald-500 hover:text-emerald-700 focus:bg-emerald-50 focus:border-emerald-600 transition-colors">
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter Price */}
              <div>
                <h3 className="font-bold text-slate-800 mb-4 flex justify-between items-center">Giá</h3>
                <input type="range" min="100000" max="2000000" className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                <div className="flex justify-between text-xs text-slate-500 mt-2 font-medium">
                  <span>100.000 ₫</span>
                  <span>2.000.000 ₫</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Lưới sản phẩm xử lý trực tiếp từ dữ liệu Admin quản trị */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex justify-center items-center h-48"><Loader2 className="w-8 h-8 animate-spin text-emerald-700" /></div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 text-slate-400 font-bold italic border-2 border-dashed border-slate-200 rounded-2xl">Không tìm thấy sản phẩm nào phù hợp điều kiện lọc.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((prod) => (
                  <div key={prod.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all group group-hover:border-emerald-300 flex flex-col">
                    {/* Image */}
                    <div className="relative h-64 overflow-hidden bg-slate-50 p-6 flex items-center justify-center">
                      <img 
                        src={prod.image || "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=400"} 
                        alt={prod.name} 
                        className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" 
                      />
                      {prod.stock === 0 && (
                        <span className="absolute inset-0 bg-black/40 backdrop-blur-[1px] text-white text-xs font-black uppercase tracking-widest flex items-center justify-center">Hết Hàng</span>
                      )}
                      {prod.stock > 0 && (
                        <span className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Mới</span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map(star => <Star key={star} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}
                        <span className="text-[10px] text-slate-400 ml-1">(5.0)</span>
                      </div>
                      <h3 className="font-bold text-slate-800 mb-1 leading-snug line-clamp-2 min-h-[40px]">{prod.name}</h3>
                      <p className="text-emerald-700 font-black mb-4 text-lg">{formatVND(prod.price)}</p>

                      <div className="mt-auto flex flex-col gap-2">
                        <button 
                          disabled={prod.stock === 0}
                          className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-300 text-white text-sm font-bold rounded-xl transition-colors"
                        >
                          {prod.stock === 0 ? "Tạm hết hàng" : "Thêm vào giỏ"}
                        </button>
                        <button className="w-full py-2 border border-slate-200 hover:border-slate-300 text-slate-600 text-xs font-bold rounded-xl transition-colors">
                          Xem nhanh
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Phân trang (Mockup) */}
            {!isLoading && filteredProducts.length > 0 && (
              <div className="flex justify-center mt-12 gap-2">
                <button className="w-10 h-10 rounded-xl bg-emerald-800 text-white font-bold flex items-center justify-center">1</button>
                <button className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 flex items-center justify-center">2</button>
                <button className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 flex items-center justify-center"><ChevronRight className="w-5 h-5" /></button>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* 5. FEATURES / WHY CHOOSE US */}
      <section className="bg-emerald-50/50 py-16 border-y border-emerald-100">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-black text-emerald-900 mb-10 text-center uppercase tracking-wider">Tại sao chọn giày Lam Điền?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center bg-white p-8 rounded-3xl shadow-sm border border-emerald-50">
              <div className="w-16 h-16 mx-auto bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mb-5">
                <Leaf className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg text-emerald-900 mb-2">Vật liệu tự nhiên</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Sử dụng nguyên liệu tái chế, thân thiện với môi trường, an toàn cho da và thiên nhiên.</p>
            </div>
            <div className="text-center bg-white p-8 rounded-3xl shadow-sm border border-emerald-50">
              <div className="w-16 h-16 mx-auto bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mb-5">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg text-emerald-900 mb-2">Bền bỉ thách thức thời gian</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Đế cao su nguyên khối chống mài mòn, bám đường cực tốt trên mọi địa hình hiểm trở.</p>
            </div>
            <div className="text-center bg-white p-8 rounded-3xl shadow-sm border border-emerald-50">
              <div className="w-16 h-16 mx-auto bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mb-5">
                <Smile className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg text-emerald-900 mb-2">Thoải mái tối đa</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Lớp đệm CloudFoam độc quyền ôm trọn lòng bàn chân, giảm mỏi khi di chuyển đường dài.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TESTIMONIALS */}
      <section className="py-16 max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-black text-emerald-900 mb-10 text-center uppercase tracking-wider">Ý kiến khách hàng</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: "Hải Trần", quote: "Đôi giày đi êm nhất tôi từng mua. Đi trek 15km mà không hề đau chân." },
            { name: "Minh Nguyễn", quote: "Thiết kế đẹp, màu xanh Jade rất sang. Đóng gói bảo vệ môi trường 10 điểm." },
            { name: "Linh Đan", quote: "Giá quá tốt so với chất lượng. Sẽ tiếp tục ủng hộ hàng Việt Nam như Lam Điền." },
          ].map((item, idx) => (
            <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 relative">
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map(star => <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="text-sm text-slate-600 italic mb-4">"{item.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-300 rounded-full overflow-hidden">
                  <img src={`https://i.pravatar.cc/150?img=${idx + 10}`} alt="avatar" />
                </div>
                <span className="font-bold text-emerald-900 text-sm">{item.name}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="bg-emerald-950 text-emerald-100 pt-16 pb-8 border-t-[8px] border-emerald-500">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div className="space-y-4">
            <h3 className="text-xl font-black text-white italic tracking-tight">LĐ. GIÀY LAM ĐIỀN</h3>
            <p className="text-sm text-emerald-200/80 leading-relaxed">
              Chúng tôi tạo ra những đôi giày sinh ra để cùng bạn khám phá thế giới, nâng niu từng bước chân thuận theo tự nhiên nhất.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-sm">Về chúng tôi</h4>
            <ul className="space-y-2 text-sm text-emerald-200/80">
              <li><Link href="#" className="hover:text-white transition-colors">Câu chuyện thương hiệu</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Trách nhiệm môi trường</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Hệ thống cửa hàng</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-sm">Hỗ trợ</h4>
            <ul className="space-y-2 text-sm text-emerald-200/80">
              <li><Link href="#" className="hover:text-white transition-colors">Chính sách bảo hành</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Đổi trả & Hoàn tiền</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Hướng dẫn chọn size</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-sm">Liên hệ</h4>
            <ul className="space-y-3 text-sm text-emerald-200/80">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 shrink-0 text-emerald-500" />
                <span>228 Đ. Cầu Giấy, Quan Hoa, Cầu Giấy, Hà Nội</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Hotline: 1900 1000</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 pt-8 border-t border-emerald-900/50 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-emerald-400/60">
          <p>© 2026 GIAY LAM DIEN - BƯỚC CHÂN TỰ NHIÊN. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}