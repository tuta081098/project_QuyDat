"use client";

import { useState, useEffect } from "react";
import {
  Search, ShoppingCart, User, Menu, Star, MapPin, Phone, Mail, Loader2, X, Check, Truck, Ruler, LogOut, CheckCircle2, AlertCircle, ChevronRight, ChevronDown
} from "lucide-react";
import Link from "next/link";

const HEADER_TABS = ['NAM', 'NỮ', 'TRẺ EM', 'PHỤ KIỆN', 'BỘ SƯU TẬP', 'GIẢM GIÁ'];
const ALL_SIZES = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44'];

export default function ShopLamDienPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeHeaderTab, setActiveHeaderTab] = useState<string>("NAM");
  const [activeSubCategory, setActiveSubCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [priceRange, setPriceRange] = useState<number>(5000000); 

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // --- POPUP & MODALS ---
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [popupSize, setPopupSize] = useState<string>("");
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- AUTH & USER STATE ---
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authForm, setAuthForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [authError, setAuthError] = useState<string>("");
  
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "", address: "" });

  // --- TOAST NOTIFICATION STATE ---
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error', visible: boolean }>({ message: "", type: "success", visible: false });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  useEffect(() => {
    const loadShopData = async () => {
      setIsLoading(true);
      try {
        const [catRes, prodRes] = await Promise.all([ fetch("/api/admin/categories"), fetch("/api/admin/products") ]);
        if (catRes.ok) setCategories((await catRes.json()).filter((c: any) => c.status === "ACTIVE"));
        if (prodRes.ok) setProducts((await prodRes.json()).filter((p: any) => p.status !== "DELETED"));
        
        const savedUser = localStorage.getItem("lamdien_user");
        if (savedUser) setCurrentUser(JSON.parse(savedUser));
      } catch (error) { console.error(error); } finally { setIsLoading(false); }
    };
    loadShopData();
  }, []);

  const formatVND = (num: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);

  // --- LOGIC AUTH VỚI TOAST ---
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(""); 
    
    const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();
      
      if (!res.ok) {
        setAuthError(data.error);
        return;
      }
      
      localStorage.setItem("lamdien_user", JSON.stringify(data.data));
      setCurrentUser(data.data);
      setIsAuthModalOpen(false);
      setAuthForm({ name: "", email: "", phone: "", password: "" }); 
      showToast(isLoginMode ? "Đăng nhập thành công!" : "Đăng ký thành công!", "success");
    } catch (err) {
      setAuthError("Lỗi kết nối đến máy chủ.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("lamdien_user");
    setCurrentUser(null);
    setIsProfileModalOpen(false);
    showToast("Đã đăng xuất tài khoản.", "success");
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentUser.id, ...profileForm })
      });
      const data = await res.json();
      
      if (res.ok) {
        const updatedUser = { ...currentUser, ...data.data };
        localStorage.setItem("lamdien_user", JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
        setIsProfileModalOpen(false);
        showToast("Cập nhật thông tin thành công!", "success");
      } else {
        showToast(data.error || "Cập nhật thất bại", "error");
      }
    } catch (err) {
      showToast("Lỗi kết nối.", "error");
    }
  };

  const openProfile = () => {
    setProfileForm({ name: currentUser.name, phone: currentUser.phone || "", address: currentUser.address || "" });
    setIsProfileModalOpen(true);
  };

  // --- ÁNH XẠ DANH MỤC & SALE ---
  const matchedRootCat = categories.find(c => c.name.toUpperCase() === activeHeaderTab && !c.parentId);
  const currentSubCats = matchedRootCat ? categories.filter(c => c.parentId === matchedRootCat.id) : [];

  const filteredProducts = products.filter(prod => {
    let matchesCategory = false;
    if (activeHeaderTab === "GIẢM GIÁ") {
      matchesCategory = prod.discountPrice && prod.discountPrice > 0;
    } else {
      if (matchedRootCat) {
        if (activeSubCategory) matchesCategory = prod.categoryId === activeSubCategory;
        else matchesCategory = [matchedRootCat.id, ...currentSubCats.map(c => c.id)].includes(prod.categoryId);
      }
    }
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSize = selectedSize ? prod.sizes && prod.sizes.includes(selectedSize) : true;
    const actualPrice = prod.discountPrice || prod.price;
    const matchesPrice = actualPrice <= priceRange;

    return matchesCategory && matchesSearch && matchesSize && matchesPrice;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-teal-200">
      
      {/* TOAST NOTIFICATION NỔI GÓC DƯỚI PHẢI */}
      {toast.visible && (
        <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl animate-in slide-in-from-right-8 fade-in text-sm font-bold text-white ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5"/> : <AlertCircle className="w-5 h-5"/>}
          {toast.message}
        </div>
      )}

      {/* HEADER TỐI ƯU */}
      <header className="bg-white sticky top-0 z-40 border-b border-slate-100 shadow-sm transition-all">
        <div className="bg-teal-950 text-white text-[11px] py-1.5 text-center font-bold tracking-widest uppercase">
          Miễn phí vận chuyển toàn quốc cho đơn hàng từ 500k
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex justify-between items-center">
          
          <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => { setActiveHeaderTab("NAM"); setActiveSubCategory(""); setSearchQuery(""); }}>
            <img src="/images/logo-1.png" alt="Lam Điền" className="h-16 w-auto object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.add('fallback-logo-active'); }} />
          </div>
          
          <nav className="hidden lg:flex space-x-1 items-center">
            {HEADER_TABS.map((item) => (
              <button key={item} onClick={() => { setActiveHeaderTab(item); setActiveSubCategory(""); }} className={`px-4 py-2 text-sm font-black uppercase tracking-wide rounded-full transition-all duration-300 ${activeHeaderTab === item ? 'bg-teal-50 text-teal-700' : item === 'GIẢM GIÁ' ? 'text-red-500 hover:bg-red-50' : 'text-slate-600 hover:bg-slate-50 hover:text-teal-700'}`}>
                {item}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4 text-slate-600">
            <div className="flex items-center relative">
              {isSearchOpen ? (
                <div className="flex items-center bg-slate-100 rounded-full px-4 py-2 animate-in fade-in zoom-in-95 duration-200 w-48 md:w-64">
                  <Search className="w-4 h-4 text-slate-400 mr-2" />
                  <input autoFocus type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tìm sản phẩm..." className="w-full outline-none text-sm bg-transparent font-medium" />
                  <X className="w-4 h-4 cursor-pointer text-slate-400 hover:text-red-500 ml-2" onClick={() => { setIsSearchOpen(false); setSearchQuery(""); }} />
                </div>
              ) : (
                <button onClick={() => setIsSearchOpen(true)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><Search className="w-5 h-5" /></button>
              )}
            </div>

            {currentUser ? (
              <div className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-slate-100 rounded-full transition-colors" onClick={openProfile} title="Tài khoản">
                <div className="w-8 h-8 bg-teal-100 text-teal-800 rounded-full flex items-center justify-center font-black text-sm border border-teal-200">{currentUser.name.charAt(0)}</div>
              </div>
            ) : (
              <button onClick={() => setIsAuthModalOpen(true)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><User className="w-5 h-5" /></button>
            )}

            <button className="p-2 hover:bg-slate-100 rounded-full transition-colors relative">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute top-0 right-0 bg-teal-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold shadow-sm">0</span>
            </button>
            
            <button className="lg:hidden p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}><Menu className="w-6 h-6" /></button>
          </div>
        </div>
        
        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white p-4 space-y-2 shadow-lg absolute w-full left-0 animate-in slide-in-from-top-2">
            {HEADER_TABS.map((item) => (
              <button key={item} onClick={() => { setActiveHeaderTab(item); setActiveSubCategory(""); setIsMobileMenuOpen(false); }} className={`block w-full text-left font-black uppercase tracking-wide py-3 px-4 rounded-xl ${activeHeaderTab === item ? 'bg-teal-50 text-teal-700' : 'text-slate-600'}`}>
                {item}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* HERO BANNER TỐI ƯU */}
      <section className="relative h-[250px] md:h-[320px] w-full bg-slate-900 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&q=80&w=2000" alt="Banner" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-slate-900/40"></div>
        </div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight leading-tight drop-shadow-lg">
            Khám phá <span className={activeHeaderTab === 'GIẢM GIÁ' ? 'text-red-400' : 'text-teal-400'}>{activeHeaderTab}</span>
          </h1>
          <p className="mt-3 text-slate-300 text-sm md:text-base font-medium max-w-lg mx-auto">Thiết kế tinh tế, chất liệu tự nhiên, nâng niu từng bước chân của bạn.</p>
        </div>
      </section>

      {/* SHOP BỘ LỌC VÀ LƯỚI SẢN PHẨM */}
      <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col lg:flex-row gap-8">
        
        {/* SIDEBAR TỐI ƯU */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 sticky top-28 shadow-sm">
            {activeHeaderTab !== "GIẢM GIÁ" && (
              <div className="mb-8">
                <h3 className="font-black text-slate-900 uppercase text-sm mb-4 tracking-wider flex items-center gap-2">Phân Loại</h3>
                {matchedRootCat ? (
                  <div className="flex flex-col gap-2">
                    <button onClick={() => setActiveSubCategory("")} className={`text-left px-3 py-2 rounded-lg text-sm font-bold transition-colors ${activeSubCategory === "" ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Tất cả</button>
                    {currentSubCats.map(subCat => (
                      <button key={subCat.id} onClick={() => setActiveSubCategory(subCat.id)} className={`text-left px-3 py-2 rounded-lg text-sm font-bold transition-colors flex justify-between items-center ${activeSubCategory === subCat.id ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                        {subCat.name}
                        {activeSubCategory === subCat.id && <ChevronRight className="w-4 h-4"/>}
                      </button>
                    ))}
                  </div>
                ) : <p className="text-xs text-slate-400 italic">Đang cập nhật.</p>}
              </div>
            )}
            
            <div className="mb-8">
              <h3 className="font-black text-slate-900 uppercase text-sm mb-4 tracking-wider">Kích cỡ</h3>
              <div className="flex flex-wrap gap-2">
                {ALL_SIZES.map(size => (
                  <button key={size} onClick={() => setSelectedSize(selectedSize === size ? "" : size)} className={`w-11 h-11 flex items-center justify-center rounded-xl text-sm font-bold transition-all border ${selectedSize === size ? 'bg-teal-600 text-white border-teal-600 shadow-md scale-105' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>{size}</button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-black text-slate-900 uppercase text-sm mb-4 tracking-wider flex justify-between items-center">Khoảng giá <span className="text-teal-600 text-xs">{formatVND(priceRange)}</span></h3>
              <input type="range" min="100000" max="5000000" step="100000" value={priceRange} onChange={(e) => setPriceRange(Number(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600" />
            </div>
          </div>
        </aside>

        {/* LƯỚI SẢN PHẨM HIỆN ĐẠI */}
        <main className="flex-1">
          <div className="flex justify-between items-end mb-6 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                {searchQuery ? `Tìm kiếm: "${searchQuery}"` : activeHeaderTab === "GIẢM GIÁ" ? "SIÊU SALE ĐANG DIỄN RA" : (activeSubCategory ? categories.find(c => c.id === activeSubCategory)?.name : `TẤT CẢ ${activeHeaderTab}`)}
              </h2>
              <p className="text-sm font-semibold text-slate-500 mt-1">{filteredProducts.length} sản phẩm phù hợp</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-24 bg-white border border-dashed border-slate-200 rounded-2xl">
              <Search className="w-12 h-12 mx-auto text-slate-300 mb-4"/>
              <p className="text-slate-600 font-bold mb-4">Không tìm thấy sản phẩm nào phù hợp.</p>
              <button onClick={() => { setActiveSubCategory(""); setSelectedSize(""); setPriceRange(5000000); setSearchQuery(""); setIsSearchOpen(false); }} className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-800 transition-colors">Xóa bộ lọc</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((prod) => {
                const isSale = prod.discountPrice && prod.discountPrice > 0;
                const percentOff = isSale ? Math.round(((prod.price - prod.discountPrice) / prod.price) * 100) : 0;

                return (
                  <div key={prod.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col relative">
                    
                    <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                      {isSale && <span className="bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase shadow-sm">-{percentOff}%</span>}
                      <span className="bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase shadow-sm">MỚI</span>
                    </div>

                    {prod.stock === 0 && (
                      <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-20 flex items-center justify-center">
                        <span className="bg-slate-900 text-white font-black px-4 py-1.5 rounded-full uppercase tracking-widest text-xs shadow-lg">HẾT HÀNG</span>
                      </div>
                    )}

                    <div className="aspect-[4/3] bg-slate-50 flex justify-center items-center cursor-pointer p-6 relative overflow-hidden" onClick={() => setSelectedProduct(prod)}>
                      <img src={prod.image || "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=400"} alt={prod.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-bold text-slate-800 text-sm mb-1 group-hover:text-teal-700 transition-colors line-clamp-2 cursor-pointer" onClick={() => setSelectedProduct(prod)}>{prod.name}</h3>
                      
                      {isSale ? (
                        <div className="flex items-end gap-2 mt-2 mb-4">
                          <span className="text-red-600 font-black text-lg leading-none">{formatVND(prod.discountPrice)}</span>
                          <span className="text-slate-400 line-through text-xs font-bold mb-0.5">{formatVND(prod.price)}</span>
                        </div>
                      ) : (
                        <div className="text-slate-900 font-black text-lg mt-2 mb-4">{formatVND(prod.price)}</div>
                      )}

                      <div className="mt-auto">
                        <button disabled={prod.stock === 0} className="w-full py-3 bg-slate-900 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-bold uppercase rounded-xl transition-colors">
                          Thêm Giỏ Hàng
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* MODAL: CHI TIẾT SẢN PHẨM */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row shadow-2xl relative">
            <button onClick={() => { setSelectedProduct(null); setPopupSize(""); }} className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full z-10 transition-colors"><X className="w-5 h-5 text-slate-600" /></button>
            
            <div className="w-full md:w-1/2 bg-slate-50 min-h-[300px] flex items-center justify-center p-8 border-r border-slate-100">
               <img src={selectedProduct.image || "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=600"} alt={selectedProduct.name} className="w-full h-auto object-contain mix-blend-multiply drop-shadow-xl hover:scale-105 transition-transform duration-500" />
            </div>

            <div className="w-full md:w-1/2 p-8 lg:p-10 flex flex-col">
              <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2 py-1 rounded uppercase w-fit mb-3">{selectedProduct.category?.name || "Lam Điền"}</span>
              <h2 className="text-2xl font-black text-slate-900 mb-3 leading-tight">{selectedProduct.name}</h2>
              
              {selectedProduct.discountPrice && selectedProduct.discountPrice > 0 ? (
                <div className="flex items-end gap-3 mb-6">
                  <span className="text-3xl font-black text-red-600 leading-none">{formatVND(selectedProduct.discountPrice)}</span>
                  <span className="text-base text-slate-400 line-through font-bold">{formatVND(selectedProduct.price)}</span>
                </div>
              ) : (
                <div className="text-3xl font-black text-slate-900 mb-6 leading-none">{formatVND(selectedProduct.price)}</div>
              )}

              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap mb-6 bg-slate-50 p-4 rounded-xl">
                {selectedProduct.description || "Chưa có mô tả chi tiết. Thiết kế biểu tượng của Lam Điền, kết hợp vật liệu bảo vệ môi trường."}
              </p>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-slate-800 text-sm">CHỌN SIZE:</span>
                  <span onClick={() => setIsSizeGuideOpen(true)} className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800 cursor-pointer font-bold"><Ruler className="w-3 h-3"/> Hướng dẫn chọn size</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.sizes && selectedProduct.sizes.length > 0 ? (
                    selectedProduct.sizes.map((s: string) => (
                      <button key={s} onClick={() => setPopupSize(s)} className={`w-12 h-12 flex items-center justify-center rounded-xl text-sm font-bold border-2 transition-all ${popupSize === s ? 'border-slate-900 bg-slate-900 text-white scale-105' : 'border-slate-200 text-slate-600 hover:border-slate-400'}`}>{s}</button>
                    ))
                  ) : <span className="text-sm text-slate-500 italic">Freesize</span>}
                </div>
              </div>

              <div className="mt-auto pt-4">
                 <button disabled={selectedProduct.stock === 0} onClick={() => { showToast("Đã thêm vào giỏ hàng!", "success"); setSelectedProduct(null); }} className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white py-4 rounded-xl font-black uppercase text-sm tracking-wider shadow-lg shadow-teal-600/30 active:scale-[0.98] transition-all">
                   {selectedProduct.stock === 0 ? "Tạm hết hàng" : "Thêm vào giỏ hàng"}
                 </button>
                 <div className="flex gap-4 mt-4 justify-center">
                    <span className="flex items-center gap-1 text-xs text-slate-500 font-semibold"><Check className="w-4 h-4 text-emerald-500"/> Sẵn {selectedProduct.stock} SP</span>
                    <span className="flex items-center gap-1 text-xs text-slate-500 font-semibold"><Truck className="w-4 h-4 text-teal-500"/> Freeship toàn quốc</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ĐĂNG KÝ / ĐĂNG NHẬP */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsAuthModalOpen(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-800"><X className="w-4 h-4"/></button>
            <div className="flex border-b border-slate-100">
              <button onClick={() => { setIsLoginMode(true); setAuthError(""); }} className={`flex-1 py-5 text-sm font-black uppercase tracking-wider ${isLoginMode ? 'text-teal-700 border-b-2 border-teal-700' : 'text-slate-400 bg-slate-50'}`}>Đăng Nhập</button>
              <button onClick={() => { setIsLoginMode(false); setAuthError(""); }} className={`flex-1 py-5 text-sm font-black uppercase tracking-wider ${!isLoginMode ? 'text-teal-700 border-b-2 border-teal-700' : 'text-slate-400 bg-slate-50'}`}>Đăng Ký</button>
            </div>
            <form onSubmit={handleAuthSubmit} className="p-8 space-y-4">
              {authError && <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-xl border border-red-100 flex items-center gap-2"><AlertCircle className="w-4 h-4"/> {authError}</div>}
              {!isLoginMode && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Họ và Tên</label>
                  <input type="text" required value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-teal-600 bg-slate-50 focus:bg-white font-semibold" placeholder="Nguyễn Văn A" />
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Email</label>
                <input type="email" required value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-teal-600 bg-slate-50 focus:bg-white font-semibold" placeholder="email@example.com" />
              </div>
              {!isLoginMode && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Số điện thoại</label>
                  <input type="tel" required value={authForm.phone} onChange={e => setAuthForm({...authForm, phone: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-teal-600 bg-slate-50 focus:bg-white font-semibold" placeholder="0912345678" />
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Mật khẩu</label>
                <input type="password" required value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-teal-600 bg-slate-50 focus:bg-white font-semibold" placeholder="••••••••" />
              </div>
              <button type="submit" className="w-full py-4 mt-6 bg-slate-900 hover:bg-teal-700 text-white font-black rounded-xl uppercase tracking-wider transition-colors shadow-lg shadow-slate-900/20">{isLoginMode ? "Đăng Nhập" : "Tạo Tài Khoản"}</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: HỒ SƠ KHÁCH HÀNG */}
      {isProfileModalOpen && currentUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
              <h2 className="font-black text-slate-800 uppercase flex items-center gap-2"><User className="w-5 h-5 text-teal-600"/> Quản lý Tài khoản</h2>
              <button onClick={() => setIsProfileModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-800"><X className="w-4 h-4"/></button>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Họ và Tên</label>
                <input type="text" required value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-teal-600 font-bold text-slate-800" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Email (Cố định)</label>
                <input type="email" disabled value={currentUser.email} className="w-full px-4 py-3 border border-slate-100 rounded-xl bg-slate-100 text-slate-400 font-medium cursor-not-allowed" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Số điện thoại</label>
                <input type="tel" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-teal-600 font-bold text-slate-800" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Địa chỉ giao hàng</label>
                <textarea rows={2} value={profileForm.address} onChange={e => setProfileForm({...profileForm, address: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-teal-600 font-bold text-slate-800" placeholder="Số nhà, tên đường, phường/xã..." />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={handleLogout} className="flex-1 py-3.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"><LogOut className="w-4 h-4"/> Đăng Xuất</button>
                <button type="submit" className="flex-[2] py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-teal-600/30"><Check className="w-4 h-4"/> Lưu Thông Tin</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BẢNG SIZE */}
      {isSizeGuideOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[160] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-black uppercase tracking-wider text-sm flex items-center gap-2"><Ruler className="w-4 h-4 text-teal-400"/> Bảng Quy Đổi Size</h3>
              <button onClick={() => setIsSizeGuideOpen(false)} className="p-1.5 hover:bg-slate-700 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">Đo chiều dài bàn chân từ gót đến ngón dài nhất để đối chiếu bảng dưới đây.</p>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-center text-sm">
                  <thead className="bg-slate-100 font-bold text-slate-700 uppercase text-xs">
                    <tr><th className="py-3">Size EU</th><th className="py-3 border-l border-slate-200">Size US</th><th className="py-3 border-l border-slate-200">Chiều dài (cm)</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50"><td className="py-2.5 font-black text-teal-700">39</td><td className="py-2.5 border-l border-slate-100">7.5</td><td className="py-2.5 border-l border-slate-100 text-slate-500">24.1 - 24.5</td></tr>
                    <tr className="hover:bg-slate-50 bg-teal-50/30"><td className="py-2.5 font-black text-teal-700">40</td><td className="py-2.5 border-l border-slate-100">8.5</td><td className="py-2.5 border-l border-slate-100 text-slate-500">24.6 - 25.0</td></tr>
                    <tr className="hover:bg-slate-50"><td className="py-2.5 font-black text-teal-700">41</td><td className="py-2.5 border-l border-slate-100">9.5</td><td className="py-2.5 border-l border-slate-100 text-slate-500">25.1 - 25.5</td></tr>
                    <tr className="hover:bg-slate-50"><td className="py-2.5 font-black text-teal-700">42</td><td className="py-2.5 border-l border-slate-100">10.0</td><td className="py-2.5 border-l border-slate-100 text-slate-500">25.6 - 26.0</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-300 pt-16 pb-8 border-t-[6px] border-teal-500 mt-12">
         <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm mb-12">
           <div className="md:col-span-2">
             <img src="/images/logo-1.png" alt="Lam Điền" className="h-12 w-auto mb-4 grayscale brightness-200" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
             <p className="max-w-xs text-slate-400 leading-relaxed">Lam Điền - Bước chân tự nhiên. Chúng tôi mang đến những đôi giày chất lượng cao, thân thiện với môi trường, đồng hành cùng bạn trên mọi nẻo đường.</p>
           </div>
           <div>
             <h4 className="font-black text-white uppercase tracking-wider mb-5">Chính sách</h4>
             <ul className="space-y-3 font-medium text-slate-400">
               <li><Link href="#" className="hover:text-teal-400 transition-colors">Giao hàng toàn quốc</Link></li>
               <li><Link href="#" className="hover:text-teal-400 transition-colors">Đổi trả trong 7 ngày</Link></li>
               <li><Link href="#" className="hover:text-teal-400 transition-colors">Bảo hành trọn đời</Link></li>
             </ul>
           </div>
           <div>
             <h4 className="font-black text-white uppercase tracking-wider mb-5">Liên hệ</h4>
             <ul className="space-y-3 font-medium text-slate-400">
               <li className="flex items-center gap-3"><Phone className="w-4 h-4 text-teal-500"/> 1900 1000</li>
               <li className="flex items-start gap-3"><MapPin className="w-4 h-4 text-teal-500 shrink-0"/> 228 Đ. Cầu Giấy, Quan Hoa, Cầu Giấy, Hà Nội</li>
             </ul>
           </div>
         </div>
         <div className="max-w-7xl mx-auto px-4 pt-8 border-t border-slate-800 text-center text-xs font-bold text-slate-600 uppercase tracking-widest">
           © 2026 GIAY LAM DIEN. TẤT CẢ BẢN QUYỀN ĐƯỢC BẢO LƯU.
         </div>
      </footer>
    </div>
  );
}