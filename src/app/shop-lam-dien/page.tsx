"use client";

import { useState, useEffect } from "react";
import {
  Search, ShoppingCart, User, Menu, Star, MapPin, Phone, Loader2, X, Check, Truck, Ruler, LogOut, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, Trash2
} from "lucide-react";
import Link from "next/link";
import { signIn, signOut, getSession } from "next-auth/react";

const HEADER_TABS = ['NAM', 'NỮ', 'TRẺ EM', 'PHỤ KIỆN', 'BỘ SƯU TẬP', 'GIẢM GIÁ'];
const ALL_SIZES = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44'];
const ITEMS_PER_PAGE = 8; 

export default function ShopLamDienPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- STATE LỌC & TÌM KIẾM ---
  const [activeHeaderTab, setActiveHeaderTab] = useState<string>("NAM");
  const [activeSubCategory, setActiveSubCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [priceRange, setPriceRange] = useState<number>(5000000); 
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // --- STATE PHÂN TRANG ---
  const [currentPage, setCurrentPage] = useState<number>(1);
  useEffect(() => { setCurrentPage(1); }, [activeHeaderTab, activeSubCategory, searchQuery, selectedSize, priceRange]);

  // --- POPUP SẢN PHẨM ---
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [popupSize, setPopupSize] = useState<string>("");
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  // --- AUTH STATE ---
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authForm, setAuthForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [authError, setAuthError] = useState<string>("");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "", address: "" });

  // --- CART & CHECKOUT STATE ---
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({ customerName: "", customerEmail: "", customerPhone: "", address: "", paymentMethod: "COD" });

  // --- TOAST NOTIFICATION ---
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
        
        // ĐỒNG BỘ SESSION GOOGLE VÀ LOCAL
        const session = await getSession();
        if (session && session.user) {
          const googleUser = {
            id: (session.user as any).id,
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
            role: "USER"
          };
          setCurrentUser(googleUser);
          localStorage.setItem("lamdien_user", JSON.stringify(googleUser));
        } else {
          const savedUser = localStorage.getItem("lamdien_user");
          if (savedUser) setCurrentUser(JSON.parse(savedUser));
        }

        const savedCart = localStorage.getItem("lamdien_cart");
        if (savedCart) setCart(JSON.parse(savedCart));

      } catch (error) { console.error(error); } finally { setIsLoading(false); }
    };
    loadShopData();
  }, []);

  const formatVND = (num: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);

  // --- LOGIC AUTH VÀ PROFILE ---
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(""); 
    
    if (!isLoginMode) {
      const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
      if (!phoneRegex.test(authForm.phone)) {
        return setAuthError("Số điện thoại không hợp lệ (Gồm 10 số, đầu số chuẩn VN).");
      }
    }

    try {
      const res = await fetch(isLoginMode ? '/api/auth/login' : '/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(authForm)
      });
      const data = await res.json();
      if (!res.ok) return setAuthError(data.error);
      
      localStorage.setItem("lamdien_user", JSON.stringify(data.data));
      setCurrentUser(data.data);
      setIsAuthModalOpen(false);
      setAuthForm({ name: "", email: "", phone: "", password: "" }); 
      showToast(isLoginMode ? "Đăng nhập thành công!" : "Đăng ký thành công!", "success");
    } catch (err) { setAuthError("Lỗi kết nối đến máy chủ."); }
  };

  const handleLogout = async () => { 
    localStorage.removeItem("lamdien_user"); 
    setCurrentUser(null); 
    setIsProfileModalOpen(false); 
    showToast("Đã đăng xuất.", "success"); 
    await signOut({ redirect: false }); 
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

  // --- LOGIC GIỎ HÀNG (KIỂM TRA TỒN KHO) ---
  const saveCart = (newCart: any[]) => { setCart(newCart); localStorage.setItem("lamdien_cart", JSON.stringify(newCart)); };

  const addToCart = (product: any, size: string) => {
    if (!size && product.sizes?.length > 0) return showToast("Vui lòng chọn Size!", "error");
    
    const actualPrice = product.discountPrice || product.price;
    const cartItemId = `${product.id}_${size || 'freesize'}`;
    const existingItem = cart.find(item => item.cartItemId === cartItemId);
    const currentQty = existingItem ? existingItem.quantity : 0;

    // Validate Tồn kho
    if (currentQty + 1 > product.stock) {
      return showToast(`Sản phẩm này chỉ còn ${product.stock} chiếc trong kho!`, "error");
    }

    let newCart = [...cart];
    if (existingItem) {
      newCart = newCart.map(item => item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item);
    } else {
      newCart.push({ cartItemId, productId: product.id, name: product.name, price: actualPrice, size: size || null, image: product.image, quantity: 1 });
    }
    
    saveCart(newCart);
    showToast("Đã thêm vào giỏ hàng!", "success");
    setIsCartOpen(true);
    setSelectedProduct(null);
  };

  const removeFromCart = (cartItemId: string) => { saveCart(cart.filter(item => item.cartItemId !== cartItemId)); };
  
  const updateQuantity = (cartItemId: string, delta: number) => {
    const itemToUpdate = cart.find(item => item.cartItemId === cartItemId);
    if (!itemToUpdate) return;
    
    const productData = products.find(p => p.id === itemToUpdate.productId);
    
    // Validate tồn kho khi tăng số lượng
    if (delta > 0 && productData && (itemToUpdate.quantity + delta > productData.stock)) {
      return showToast(`Chỉ còn ${productData.stock} sản phẩm trong kho!`, "error");
    }

    const newCart = cart.map(item => {
      if (item.cartItemId === cartItemId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    });
    saveCart(newCart);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // --- LOGIC ĐẶT HÀNG ---
  const openCheckout = () => {
    if (cart.length === 0) return showToast("Giỏ hàng đang trống!", "error");
    if (currentUser) {
      setCheckoutForm({ 
        customerName: currentUser.name, 
        customerEmail: currentUser.email, 
        customerPhone: currentUser.phone || "", 
        address: currentUser.address || "",
        paymentMethod: "COD"
      });
    } else {
      setCheckoutForm({ customerName: "", customerEmail: "", customerPhone: "", address: "", paymentMethod: "COD" });
    }
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate SĐT Đặt hàng
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phoneRegex.test(checkoutForm.customerPhone)) {
      return showToast("Số điện thoại không hợp lệ (Phải là 10 số chuẩn VN).", "error");
    }

    try {
      const orderData = { ...checkoutForm, totalAmount: cartTotal, items: cart };
      const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderData) });
      if (res.ok) {
        showToast("Đặt hàng thành công! Chúng tôi sẽ liên hệ sớm.", "success");
        saveCart([]); 
        setIsCheckoutOpen(false);
        // Load lại danh sách sản phẩm để cập nhật tồn kho mới nhất
        const prodRes = await fetch("/api/admin/products");
        if (prodRes.ok) setProducts((await prodRes.json()).filter((p: any) => p.status !== "DELETED"));
      } else {
        showToast("Có lỗi xảy ra hoặc sản phẩm vừa hết hàng.", "error");
      }
    } catch (err) { showToast("Lỗi kết nối.", "error"); }
  };

  // --- ÁNH XẠ DANH MỤC & PHÂN TRANG ---
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

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-teal-200">
      
      {/* THÔNG BÁO (TOAST) GÓC TRÊN PHẢI */}
      {toast.visible && (
        <div className={`fixed top-24 right-6 z-[9999] flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl animate-in slide-in-from-top-8 fade-in text-sm font-bold text-white ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5"/> : <AlertCircle className="w-5 h-5"/>} {toast.message}
        </div>
      )}

      {/* HEADER */}
      <header className="bg-white sticky top-0 z-40 border-b border-slate-100 shadow-sm transition-all">
        <div className="bg-teal-950 text-white text-[11px] py-1.5 text-center font-bold tracking-widest uppercase">
          ✨ BỘ SƯU TẬP MỚI ĐÃ CHÍNH THỨC LÊN KỆ - ĐỔI TRẢ MIỄN PHÍ TRONG 7 NGÀY
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

          <div className="flex items-center gap-3 text-slate-600">
            <div className="flex items-center relative">
              {isSearchOpen ? (
                <div className="flex items-center bg-slate-100 rounded-full px-4 py-2 w-48 md:w-64">
                  <Search className="w-4 h-4 text-slate-400 mr-2" />
                  <input autoFocus type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tìm sản phẩm..." className="w-full outline-none text-sm bg-transparent font-medium" />
                  <X className="w-4 h-4 cursor-pointer hover:text-red-500 ml-2" onClick={() => { setIsSearchOpen(false); setSearchQuery(""); }} />
                </div>
              ) : <button onClick={() => setIsSearchOpen(true)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><Search className="w-5 h-5" /></button>}
            </div>

            {currentUser ? (
              <button onClick={openProfile} className="flex items-center gap-2 px-2 py-1 hover:bg-slate-100 rounded-full transition-all border border-transparent hover:border-slate-200">
                <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-bold text-slate-700 hidden md:block max-w-[120px] truncate">{currentUser.name}</span>
              </button>
            ) : (
              <button onClick={() => setIsAuthModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-teal-600 hover:text-white text-slate-700 rounded-full transition-all">
                <User className="w-4 h-4" />
                <span className="text-sm font-bold hidden sm:block">Đăng nhập</span>
              </button>
            )}

            <button onClick={() => setIsCartOpen(true)} className="p-2 hover:bg-slate-100 rounded-full relative flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold shadow-sm">
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO BANNER */}
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

      {/* BỘ LỌC VÀ LƯỚI SẢN PHẨM */}
      <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col lg:flex-row gap-8">
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
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {currentProducts.map((prod) => {
                  const isSale = prod.discountPrice && prod.discountPrice > 0;
                  const percentOff = isSale ? Math.round(((prod.price - prod.discountPrice) / prod.price) * 100) : 0;

                  return (
                    <div key={prod.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col relative">
                      
                      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                        {isSale && <span className="bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase shadow-sm">-{percentOff}%</span>}
                      </div>

                      {prod.stock === 0 && (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-20 flex items-center justify-center">
                          <span className="bg-slate-900 text-white font-black px-4 py-1.5 rounded-full uppercase tracking-widest text-xs shadow-lg">HẾT HÀNG</span>
                        </div>
                      )}

                      <div className="aspect-[4/3] bg-slate-50 flex justify-center items-center cursor-pointer p-6 relative overflow-hidden" onClick={() => { setSelectedProduct(prod); setPopupSize(prod.sizes?.[0] || ""); }}>
                        <img src={prod.image || "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=400"} alt={prod.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      
                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="font-bold text-slate-800 text-sm mb-1 group-hover:text-teal-700 transition-colors line-clamp-2 cursor-pointer" onClick={() => { setSelectedProduct(prod); setPopupSize(prod.sizes?.[0] || ""); }}>{prod.name}</h3>
                        
                        {isSale ? (
                          <div className="flex items-end gap-2 mt-2 mb-4">
                            <span className="text-red-600 font-black text-lg leading-none">{formatVND(prod.discountPrice)}</span>
                            <span className="text-slate-400 line-through text-xs font-bold mb-0.5">{formatVND(prod.price)}</span>
                          </div>
                        ) : (
                          <div className="text-slate-900 font-black text-lg mt-2 mb-4">{formatVND(prod.price)}</div>
                        )}

                        <div className="mt-auto">
                          <button disabled={prod.stock === 0} onClick={() => addToCart(prod, prod.sizes?.[0] || "")} className="w-full py-3 bg-slate-900 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-bold uppercase rounded-xl transition-colors">
                            Thêm Giỏ Hàng
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* KHỐI PHÂN TRANG */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-12 gap-2">
                  <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"><ChevronLeft className="w-5 h-5"/></button>
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button key={idx} onClick={() => setCurrentPage(idx + 1)} className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold text-sm ${currentPage === idx + 1 ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                      {idx + 1}
                    </button>
                  ))}
                  <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"><ChevronRight className="w-5 h-5"/></button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ==================== MODAL: CHI TIẾT SẢN PHẨM ==================== */}
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
                 <button disabled={selectedProduct.stock === 0} onClick={() => addToCart(selectedProduct, popupSize)} className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white py-4 rounded-xl font-black uppercase text-sm tracking-wider shadow-lg shadow-teal-600/30 active:scale-[0.98] transition-all">
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

      {/* ==================== PANEL GIỎ HÀNG (CART DRAWER) ==================== */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-black text-slate-900 uppercase flex items-center gap-2"><ShoppingCart className="w-5 h-5"/> Giỏ Hàng Của Bạn</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 bg-white rounded-full hover:bg-slate-200"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center mt-20 text-slate-500 font-medium">Giỏ hàng trống. Hãy mua sắm thêm nhé!</div>
              ) : (
                cart.map(item => (
                  <div key={item.cartItemId} className="flex gap-4 bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                    <img src={item.image || "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=150"} alt={item.name} className="w-20 h-20 object-contain bg-slate-50 rounded-lg" />
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{item.name}</h4>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold uppercase mt-1 inline-block">Size: {item.size || "Free"}</span>
                        </div>
                        <button onClick={() => removeFromCart(item.cartItemId)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="font-black text-teal-700 text-sm">{formatVND(item.price)}</span>
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                          <button onClick={() => updateQuantity(item.cartItemId, -1)} className="px-2 py-1 bg-slate-50 hover:bg-slate-200 font-bold">-</button>
                          <span className="px-3 py-1 text-xs font-bold">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.cartItemId, 1)} className="px-2 py-1 bg-slate-50 hover:bg-slate-200 font-bold">+</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50">
              <div className="flex justify-between items-center mb-4"><span className="font-bold text-slate-600">Tổng cộng:</span><span className="text-2xl font-black text-slate-900">{formatVND(cartTotal)}</span></div>
              <button disabled={cart.length === 0} onClick={openCheckout} className="w-full py-4 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-black uppercase rounded-xl tracking-wider shadow-lg shadow-teal-600/20">Thanh Toán Ngay</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: THANH TOÁN (CHECKOUT VỚI QR) ==================== */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
              <h2 className="font-black text-slate-800 uppercase flex items-center gap-2">Xác nhận Đặt hàng</h2>
              <button onClick={() => setIsCheckoutOpen(false)} className="p-2 hover:bg-slate-200 rounded-full"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleCheckoutSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Người nhận</label><input type="text" required value={checkoutForm.customerName} onChange={e => setCheckoutForm({...checkoutForm, customerName: e.target.value})} className="w-full px-4 py-3 border rounded-xl" placeholder="Tên người nhận" /></div>
              <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Email</label><input type="email" required value={checkoutForm.customerEmail} onChange={e => setCheckoutForm({...checkoutForm, customerEmail: e.target.value})} className="w-full px-4 py-3 border rounded-xl" placeholder="Email nhận thông báo" /></div>
              <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Số điện thoại</label><input type="tel" required value={checkoutForm.customerPhone} onChange={e => setCheckoutForm({...checkoutForm, customerPhone: e.target.value})} className="w-full px-4 py-3 border rounded-xl" placeholder="SĐT liên hệ giao hàng" /></div>
              <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Địa chỉ giao hàng</label><textarea required rows={2} value={checkoutForm.address} onChange={e => setCheckoutForm({...checkoutForm, address: e.target.value})} className="w-full px-4 py-3 border rounded-xl" placeholder="Số nhà, đường, phường, quận..." /></div>
              
              {/* PHƯƠNG THỨC THANH TOÁN */}
              <div className="pt-2">
                <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Phương thức thanh toán</label>
                <div className="grid grid-cols-2 gap-3">
                  <div onClick={() => setCheckoutForm({...checkoutForm, paymentMethod: "COD"})} className={`border-2 rounded-xl p-3 cursor-pointer text-center font-bold text-sm transition-all ${checkoutForm.paymentMethod === 'COD' ? 'border-teal-600 bg-teal-50 text-teal-800' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Thanh toán khi nhận (COD)</div>
                  <div onClick={() => setCheckoutForm({...checkoutForm, paymentMethod: "QR"})} className={`border-2 rounded-xl p-3 cursor-pointer text-center font-bold text-sm transition-all ${checkoutForm.paymentMethod === 'QR' ? 'border-teal-600 bg-teal-50 text-teal-800' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Chuyển khoản (Mã QR)</div>
                </div>
              </div>

              {checkoutForm.paymentMethod === "QR" && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center animate-in fade-in zoom-in-95">
                  <p className="text-xs font-bold text-slate-600 mb-2 uppercase text-center">Quét mã để thanh toán ngay</p>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" alt="QR Demo" className="w-32 h-32 opacity-90 rounded-lg shadow-sm bg-white p-2" />
                  <p className="text-[10px] text-slate-400 mt-2 italic text-center">Nội dung CK: THANH TOAN DON HANG {checkoutForm.customerPhone || 'XXX'}</p>
                </div>
              )}

              <div className="bg-teal-50 p-4 rounded-xl flex justify-between items-center border border-teal-100 mt-4">
                 <span className="font-bold text-teal-800">Tổng thanh toán:</span><span className="text-xl font-black text-teal-700">{formatVND(cartTotal)}</span>
              </div>
              <button type="submit" className="w-full py-4 mt-2 bg-slate-900 hover:bg-teal-700 text-white font-black rounded-xl uppercase transition-colors shadow-lg shadow-slate-900/20">Hoàn Tất Đặt Hàng</button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: ĐĂNG NHẬP / ĐĂNG KÝ ==================== */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200 overflow-hidden">
            <button onClick={() => setIsAuthModalOpen(false)} className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-slate-200 rounded-full z-10"><X className="w-5 h-5" /></button>
            
            <div className="p-8">
              <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase text-center">{isLoginMode ? 'Đăng nhập' : 'Tạo tài khoản'}</h2>
              <p className="text-sm text-slate-500 text-center mb-6 font-medium">
                {isLoginMode ? 'Chào mừng bạn quay trở lại với Lam Điền' : 'Trải nghiệm mua sắm tuyệt vời hơn'}
              </p>

              {authError && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl text-center border border-red-100">{authError}</div>}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {!isLoginMode && (
                  <>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Họ và tên</label>
                      <input type="text" required value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-teal-500 transition-colors" placeholder="Nguyễn Văn A" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Số điện thoại</label>
                      <input type="tel" required value={authForm.phone} onChange={e => setAuthForm({...authForm, phone: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-teal-500 transition-colors" placeholder="0912345678" />
                    </div>
                  </>
                )}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Email</label>
                  <input type="email" required value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-teal-500 transition-colors" placeholder="email@example.com" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Mật khẩu</label>
                  <input type="password" required value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-teal-500 transition-colors" placeholder="••••••••" />
                </div>

                <button type="submit" className="w-full py-4 mt-2 bg-slate-900 hover:bg-teal-700 text-white font-black rounded-xl uppercase transition-colors shadow-lg shadow-slate-900/20">
                  {isLoginMode ? 'Đăng nhập ngay' : 'Đăng ký tài khoản'}
                </button>
              </form>

              {/* --- NÚT ĐĂNG NHẬP GOOGLE --- */}
              <div className="mt-6 flex items-center justify-between">
                <span className="w-1/5 border-b border-slate-200"></span>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Hoặc tiếp tục với</span>
                <span className="w-1/5 border-b border-slate-200"></span>
              </div>
              <button onClick={() => signIn('google')} className="w-full mt-6 py-3.5 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-3 transition-colors shadow-sm">
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                Đăng nhập bằng Google
              </button>

              <div className="mt-6 text-center text-sm font-semibold text-slate-600">
                {isLoginMode ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
                <button onClick={() => { setIsLoginMode(!isLoginMode); setAuthError(""); }} className="text-teal-600 hover:text-teal-800 uppercase font-black ml-1">
                  {isLoginMode ? 'Đăng ký' : 'Đăng nhập'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: QUẢN LÝ THÔNG TIN CÁ NHÂN ==================== */}
      {isProfileModalOpen && currentUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl relative animate-in zoom-in-95 duration-200 overflow-hidden">
             <button onClick={() => setIsProfileModalOpen(false)} className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-slate-200 rounded-full z-10"><X className="w-5 h-5" /></button>
             <div className="p-8 text-center">
                <div className="w-20 h-20 bg-teal-100 text-teal-800 rounded-full flex items-center justify-center font-black text-3xl border-4 border-white shadow-lg mx-auto mb-4">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-black text-xl text-slate-900 mb-1">{currentUser.name}</h3>
                <p className="text-sm font-semibold text-slate-500 mb-6">{currentUser.email}</p>
                
                {/* Form cập nhật hồ sơ */}
                <form onSubmit={handleUpdateProfile} className="text-left space-y-3 mb-6">
                  <div>
                    <label className="text-xs font-bold text-slate-500">Số điện thoại</label>
                    <input type="tel" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500">Địa chỉ</label>
                    <textarea value={profileForm.address} onChange={e => setProfileForm({...profileForm, address: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-sm transition-colors">Lưu Thông Tin</button>
                </form>

                <button onClick={handleLogout} className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-black rounded-xl uppercase transition-colors flex items-center justify-center gap-2">
                  <LogOut className="w-4 h-4" /> Đăng xuất
                </button>
             </div>
          </div>
        </div>
      )}

      {/* ==================== BẢNG SIZE MODAL ==================== */}
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
               <li className="flex items-center gap-3"><Phone className="w-4 h-4 text-teal-500"/> 1900 1111</li>
               <li className="flex items-start gap-3"><MapPin className="w-4 h-4 text-teal-500 shrink-0"/> 228 Đ. Cầu Giấy, Quan Hoa, Hà Nội</li>
             </ul>
           </div>
         </div>
      </footer>
    </div>
  );
}