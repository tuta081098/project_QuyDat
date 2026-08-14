"use client";

import { useState, useEffect } from "react";
import {
  Search, ShoppingCart, User, MapPin, Phone, Loader2, X, Check, Truck, Ruler, LogOut, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, Trash2, QrCode, PackageSearch, Package, Star,
  Sparkles, ShieldCheck, RefreshCw, Headphones, ArrowUp, Heart, Flame, Eye, Tag
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
  
  const [activeHeaderTab, setActiveHeaderTab] = useState<string>("NAM");
  const [activeSubCategory, setActiveSubCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [priceRange, setPriceRange] = useState<number>(5000000); 
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [quickFilter, setQuickFilter] = useState<string>("ALL"); 

  const [currentPage, setCurrentPage] = useState<number>(1);
  useEffect(() => { setCurrentPage(1); }, [activeHeaderTab, activeSubCategory, searchQuery, selectedSize, priceRange, quickFilter]);

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [popupSize, setPopupSize] = useState<string>("");
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authForm, setAuthForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [authError, setAuthError] = useState<string>("");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "", address: "" });

  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  
  const [checkoutForm, setCheckoutForm] = useState({ customerName: "", customerEmail: "", customerPhone: "", address: "", paymentMethod: "COD" });
  const [isQrPaid, setIsQrPaid] = useState(false);

  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [trackPhone, setTrackPhone] = useState("");
  
  // --- CÁC STATE CHỐNG DOUBLE CLICK (LOADING SPINNER) ---
  const [isTracking, setIsTracking] = useState(false);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const [isCheckoutSubmitting, setIsCheckoutSubmitting] = useState(false);

  const [trackResults, setTrackResults] = useState<any[] | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error', visible: boolean }>({ message: "", type: "success", visible: false });
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ productId: "", rating: 5, comment: "", productName: "" });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

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
        
        let loggedInUser = null;
        const session = await getSession();
        const userEmail = session?.user?.email || (localStorage.getItem("lamdien_user") ? JSON.parse(localStorage.getItem("lamdien_user")!).email : null);

        if (userEmail) {
          const userRes = await fetch(`/api/auth/me?email=${userEmail}`);
          if (userRes.ok) {
            const { data } = await userRes.json();
            if (data) {
              loggedInUser = data;
              setCurrentUser(data);
              localStorage.setItem("lamdien_user", JSON.stringify(data));
              
              if (data.cartData && data.cartData !== "[]") {
                const dbCart = JSON.parse(data.cartData);
                setCart(dbCart);
                localStorage.setItem("lamdien_cart", data.cartData);
              }
            }
          }
        }

        if (!loggedInUser) {
          const savedCart = localStorage.getItem("lamdien_cart");
          if (savedCart) setCart(JSON.parse(savedCart));
        }
      } catch (error) { console.error(error); } finally { setIsLoading(false); }
    };
    loadShopData();
  }, []);

  const formatVND = (num: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(""); 
    if (!isLoginMode) {
      const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
      if (!phoneRegex.test(authForm.phone)) return setAuthError("Số điện thoại không hợp lệ.");
    }
    
    setIsAuthSubmitting(true); // BẬT LOADING
    try {
      const res = await fetch(isLoginMode ? '/api/auth/login' : '/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(authForm) });
      const data = await res.json();
      if (!res.ok) return setAuthError(data.error);
      
      localStorage.setItem("lamdien_user", JSON.stringify(data.data));
      setCurrentUser(data.data);
      setIsAuthModalOpen(false);
      setAuthForm({ name: "", email: "", phone: "", password: "" }); 
      showToast(isLoginMode ? "Đăng nhập thành công!" : "Đăng ký thành công!", "success");
    } catch (err) { 
      setAuthError("Lỗi kết nối đến máy chủ."); 
    } finally {
      setIsAuthSubmitting(false); // TẮT LOADING
    }
  };

  const handleLogout = async () => { 
    localStorage.removeItem("lamdien_user"); 
    localStorage.removeItem("lamdien_cart");
    setCurrentUser(null); 
    setCart([]);
    setIsProfileModalOpen(false); 
    showToast("Đã đăng xuất.", "success"); 
    await signOut({ redirect: false }); 
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProfileSubmitting(true); // BẬT LOADING
    try {
      const res = await fetch('/api/auth/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: currentUser.id, ...profileForm }) });
      const data = await res.json();
      if (res.ok) {
        const updatedUser = { ...currentUser, ...data.data };
        localStorage.setItem("lamdien_user", JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
        setIsProfileModalOpen(false);
        showToast("Cập nhật thông tin thành công!", "success");
      } else { showToast(data.error || "Cập nhật thất bại", "error"); }
    } catch (err) { 
      showToast("Lỗi kết nối.", "error"); 
    } finally {
      setIsProfileSubmitting(false); // TẮT LOADING
    }
  };

  const openProfile = () => {
    setProfileForm({ name: currentUser.name, phone: currentUser.phone || "", address: currentUser.address || "" });
    setIsProfileModalOpen(true);
  };

  const saveCart = (newCart: any[]) => { 
    setCart(newCart); 
    localStorage.setItem("lamdien_cart", JSON.stringify(newCart)); 
    if (currentUser && currentUser.id) {
       fetch('/api/auth/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: currentUser.id, cartData: JSON.stringify(newCart) })
       }).catch(err => console.error(err));
    }
  };

  const addToCart = (product: any, size: string) => {
    if (!size && product.sizes?.length > 0) return showToast("Vui lòng chọn Size!", "error");
    const actualPrice = product.discountPrice || product.price;
    const cartItemId = `${product.id}_${size || 'freesize'}`;
    const existingItem = cart.find(item => item.cartItemId === cartItemId);
    const currentQty = existingItem ? existingItem.quantity : 0;
    if (currentQty + 1 > product.stock) return showToast(`Sản phẩm này chỉ còn ${product.stock} chiếc trong kho!`, "error");

    let newCart = [...cart];
    if (existingItem) newCart = newCart.map(item => item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item);
    else newCart.push({ cartItemId, productId: product.id, name: product.name, price: actualPrice, size: size || null, image: product.image, quantity: 1 });
    
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
    if (delta > 0 && productData && (itemToUpdate.quantity + delta > productData.stock)) return showToast(`Chỉ còn ${productData.stock} sản phẩm trong kho!`, "error");

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

  const openCheckout = () => {
    if (cart.length === 0) return showToast("Giỏ hàng đang trống!", "error");
    if (currentUser) {
      setCheckoutForm({ customerName: currentUser.name || "", customerEmail: currentUser.email || "", customerPhone: currentUser.phone || "", address: currentUser.address || "", paymentMethod: "COD" });
    } else {
      setCheckoutForm({ customerName: "", customerEmail: "", customerPhone: "", address: "", paymentMethod: "COD" });
    }
    setIsQrPaid(false);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleSimulateQRPayment = () => {
    showToast("Đang kiểm tra giao dịch...", "success");
    setTimeout(() => { setIsQrPaid(true); }, 1500);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phoneRegex.test(checkoutForm.customerPhone)) return showToast("Số điện thoại không hợp lệ.", "error");
    const finalPaymentStatus = (checkoutForm.paymentMethod === 'QR' && isQrPaid) ? 'PAID' : 'PENDING';

    setIsCheckoutSubmitting(true); // BẬT LOADING
    try {
      const orderData = { ...checkoutForm, totalAmount: cartTotal, paymentStatus: finalPaymentStatus, items: cart };
      const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderData) });
      if (res.ok) {
        showToast("Đặt hàng thành công! Chúng tôi sẽ chuẩn bị đơn sớm nhất.", "success");
        saveCart([]); 
        setIsCheckoutOpen(false);
        const prodRes = await fetch("/api/admin/products");
        if (prodRes.ok) setProducts((await prodRes.json()).filter((p: any) => p.status !== "DELETED"));
      } else { showToast("Có lỗi xảy ra hoặc sản phẩm vừa hết hàng.", "error"); }
    } catch (err) { 
      showToast("Lỗi kết nối.", "error"); 
    } finally {
      setIsCheckoutSubmitting(false); // TẮT LOADING
    }
  };

  const handleTrackOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackPhone.trim()) return showToast("Vui lòng nhập số điện thoại", "error");
    
    setIsTracking(true);
    try {
      const res = await fetch(`/api/orders/track?phone=${trackPhone}`);
      const data = await res.json();
      if (res.ok) {
        setTrackResults(data.data);
        if (data.data.length === 0) showToast("Không tìm thấy đơn hàng nào", "error");
      } else {
        showToast(data.error || "Lỗi tra cứu", "error");
      }
    } catch (error) {
      showToast("Lỗi kết nối máy chủ", "error");
    } finally {
      setIsTracking(false);
    }
  };

  const openReviewModal = (productId: string, productName: string) => {
    if (!currentUser) {
      showToast("Vui lòng đăng nhập để đánh giá", "error");
      setIsAuthModalOpen(true);
      setIsLoginMode(true);
      return;
    }
    setReviewForm({ productId, rating: 5, comment: "", productName });
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: reviewForm.productId,
          rating: reviewForm.rating,
          comment: reviewForm.comment,
          userId: currentUser.id
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Đánh giá sản phẩm thành công", "success");
        setIsReviewModalOpen(false);
        // Refresh products to get the new review
        const prodRes = await fetch("/api/admin/products");
        if (prodRes.ok) {
          const prods = await prodRes.json();
          setProducts(prods);
        }
      } else {
        showToast(data.error || "Lỗi gửi đánh giá", "error");
      }
    } catch (error) {
      showToast("Lỗi kết nối máy chủ", "error");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const matchedRootCat = categories.find(
    c => c.name?.trim().toUpperCase() === activeHeaderTab.trim().toUpperCase() && (!c.parentId || c.isHeaderMenu)
  );
  const currentSubCats = matchedRootCat
    ? categories.filter(c => c.parentId === matchedRootCat.id)
    : [];
  const currentSubCatIds = currentSubCats.map(c => c.id);

  const filteredProducts = products.filter(prod => {
    let matchesCategory = false;

    if (activeHeaderTab === "GIẢM GIÁ") {
      matchesCategory = Boolean(prod.discountPrice && prod.discountPrice > 0);
    } else {
      if (activeSubCategory) {
        matchesCategory = prod.categoryId === activeSubCategory || prod.category?.id === activeSubCategory;
      } else {
        const prodParentName = prod.category?.parent?.name?.trim().toUpperCase();
        const prodCatName = prod.category?.name?.trim().toUpperCase();
        const targetTab = activeHeaderTab.trim().toUpperCase();

        const matchesByParentName = prodParentName === targetTab;
        const matchesByDirectName = (!prod.category?.parentId || prod.category?.isHeaderMenu) && prodCatName === targetTab;
        const matchesByRootCatId = Boolean(matchedRootCat && (prod.categoryId === matchedRootCat.id || prod.category?.id === matchedRootCat.id));
        const matchesBySubCatId = currentSubCatIds.includes(prod.categoryId) || Boolean(prod.category?.id && currentSubCatIds.includes(prod.category.id));
        const matchesByParentId = Boolean(matchedRootCat && prod.category?.parentId === matchedRootCat.id);

        matchesCategory = Boolean(
          matchesByParentName ||
          matchesByDirectName ||
          matchesByRootCatId ||
          matchesBySubCatId ||
          matchesByParentId
        );
      }
    }

    const matchesSearch = prod.name ? prod.name.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    const matchesSize = selectedSize ? prod.sizes && prod.sizes.includes(selectedSize) : true;
    const actualPrice = prod.discountPrice || prod.price;
    const matchesPrice = actualPrice <= priceRange;

    return matchesCategory && matchesSearch && matchesSize && matchesPrice;
  }).sort((a, b) => {
    if (quickFilter === "BEST_SELLER") {
      const aRevCount = a.reviews?.length || 0;
      const bRevCount = b.reviews?.length || 0;
      if (bRevCount !== aRevCount) return bRevCount - aRevCount;
      const aRating = a.reviews?.reduce((acc: number, r: any) => acc + r.rating, 0) || 0;
      const bRating = b.reviews?.reduce((acc: number, r: any) => acc + r.rating, 0) || 0;
      return bRating - aRating;
    }
    return 0;
  });

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-teal-200">
      
      {toast.visible && (
        <div className={`fixed top-24 right-6 z-[9999] flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl animate-in slide-in-from-top-8 fade-in text-sm font-bold text-white ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5"/> : <AlertCircle className="w-5 h-5"/>} {toast.message}
        </div>
      )}

      {/* TOP ANNOUNCEMENT BAR */}
      <div className="bg-gradient-to-r from-slate-950 via-teal-950 to-slate-950 text-white text-xs py-2 px-4 border-b border-teal-900/30">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-[11px] font-semibold">
          <div className="flex items-center gap-6 overflow-hidden">
            <span className="flex items-center gap-1.5 text-teal-300 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> BỘ SƯU TẬP 2024 ĐÃ LÊN KỆ
            </span>
            <span className="hidden md:flex items-center gap-1.5 text-slate-300">
              <Truck className="w-3.5 h-3.5 text-teal-400" /> FREESHIP ĐƠN TỪ 500K
            </span>
            <span className="hidden lg:flex items-center gap-1.5 text-slate-300">
              <RefreshCw className="w-3.5 h-3.5 text-sky-400" /> ĐỔI SIZE MIỄN PHÍ 30 NGÀY
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-300">
            <span className="hidden sm:flex items-center gap-1 text-slate-300">
              <Phone className="w-3 h-3 text-teal-400" /> Hotline: <strong className="text-white">1900 1000</strong>
            </span>
          </div>
        </div>
      </div>

      {/* HEADER */}
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100/80 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex justify-between items-center">
          
          {/* Logo Brand */}
          <div className="flex-shrink-0 flex items-center cursor-pointer group" onClick={() => { setActiveHeaderTab("NAM"); setActiveSubCategory(""); setQuickFilter("ALL"); setSearchQuery(""); }}>
            <div className="relative flex items-center gap-3">
              <img src="/images/logo-1.png" alt="Lam Điền" className="h-12 md:h-14 w-auto object-contain transition-transform group-hover:scale-105" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.add('fallback-logo-active'); }} />
              <div className="hidden sm:flex flex-col">
                <span className="font-black text-lg tracking-wider text-slate-900 leading-none">LAM ĐIỀN</span>
                <span className="text-[10px] font-bold text-teal-700 uppercase tracking-widest mt-0.5">Footwear & Lifestyle</span>
              </div>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <nav className="hidden lg:flex space-x-1.5 items-center bg-slate-50/80 p-1.5 rounded-2xl border border-slate-100">
            {HEADER_TABS.map((item) => {
              const isActive = activeHeaderTab === item;
              const isSale = item === 'GIẢM GIÁ';
              return (
                <button
                  key={item}
                  onClick={() => { setActiveHeaderTab(item); setActiveSubCategory(""); setQuickFilter(item === 'GIẢM GIÁ' ? 'SALE' : 'ALL'); }}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
                    isActive
                      ? isSale
                        ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md shadow-red-500/20'
                        : 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
                      : isSale
                      ? 'text-red-500 hover:bg-red-50'
                      : 'text-slate-600 hover:bg-white hover:text-teal-700'
                  }`}
                >
                  {isSale && <Flame className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300' : 'text-red-500 animate-pulse'}`} />}
                  {item}
                </button>
              );
            })}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 text-slate-700">
            {/* Search Input Box */}
            <div className="flex items-center relative">
              {isSearchOpen ? (
                <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 w-52 md:w-72 shadow-inner transition-all animate-in fade-in zoom-in-95 duration-200">
                  <Search className="w-4 h-4 text-teal-700 mr-2 flex-shrink-0" />
                  <input autoFocus type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tìm kiếm giày, dép..." className="w-full outline-none text-xs bg-transparent font-semibold text-slate-800 placeholder-slate-400" />
                  <X className="w-4 h-4 cursor-pointer hover:text-red-500 ml-2 text-slate-400 flex-shrink-0" onClick={() => { setIsSearchOpen(false); setSearchQuery(""); }} />
                </div>
              ) : (
                <button onClick={() => setIsSearchOpen(true)} className="p-2.5 hover:bg-slate-100 rounded-xl transition-all text-slate-600 hover:text-teal-700" title="Tìm kiếm">
                  <Search className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Order Tracking Button */}
            <button onClick={() => setIsTrackModalOpen(true)} className="p-2.5 hover:bg-slate-100 rounded-xl transition-all text-slate-600 hover:text-teal-700" title="Tra cứu đơn hàng">
              <PackageSearch className="w-5 h-5" />
            </button>

            {/* User Account */}
            {currentUser ? (
              <button onClick={openProfile} className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-slate-100 hover:bg-teal-50 rounded-xl transition-all border border-slate-200/60">
                <div className="w-7 h-7 bg-teal-700 text-white rounded-lg flex items-center justify-center font-black text-xs shadow-sm">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-bold text-slate-700 hidden md:block max-w-[100px] truncate">{currentUser.name}</span>
              </button>
            ) : (
              <button onClick={() => setIsAuthModalOpen(true)} className="flex items-center gap-1.5 px-3.5 py-2 hover:bg-slate-100 text-slate-700 rounded-xl transition-all font-bold text-xs">
                <User className="w-4 h-4 text-teal-700" />
                <span className="hidden sm:inline">Đăng nhập</span>
              </button>
            )}

            {/* Cart Button */}
            <button onClick={() => setIsCartOpen(true)} className="p-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl relative flex items-center transition-all shadow-sm group">
              <ShoppingCart className="w-5 h-5 transition-transform group-hover:scale-110" />
              {cart.reduce((a, b) => a + b.quantity, 0) > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-black h-5 min-w-5 px-1 flex items-center justify-center rounded-full shadow-md animate-in zoom-in">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* HERO BANNER */}
      <section className="relative h-[300px] md:h-[380px] w-full bg-slate-950 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&q=80&w=2000" alt="Banner" className="w-full h-full object-cover opacity-35 filter scale-105 transition-transform duration-1000" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-900/30 via-transparent to-transparent"></div>
        </div>
        <div className="relative z-10 text-center px-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-teal-950/80 border border-teal-500/30 text-teal-300 text-[11px] font-extrabold uppercase px-4 py-1.5 rounded-full mb-4 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> BST Giày Lam Điền 2024
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white uppercase tracking-tight leading-tight drop-shadow-md">
            Khám phá <span className={`bg-clip-text text-transparent ${activeHeaderTab === 'GIẢM GIÁ' ? 'bg-gradient-to-r from-red-400 to-amber-400' : 'bg-gradient-to-r from-teal-300 via-emerald-400 to-teal-200'}`}>{activeHeaderTab}</span>
          </h1>
          <p className="mt-3 text-slate-300 text-xs sm:text-sm md:text-base font-medium max-w-lg mx-auto tracking-wide leading-relaxed">
            Thiết kế tối giản công thái học, chất liệu bền vững, nâng niu từng bước chân người Việt.
          </p>

          {/* Quick pills */}
          <div className="flex flex-wrap justify-center gap-2.5 mt-6">
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'BEST_SELLER', label: 'Bán chạy' },
              { id: 'SALE', label: 'Khuyến mãi' }
            ].map((pill) => {
              const isActive =
                pill.id === 'SALE'
                  ? activeHeaderTab === 'GIẢM GIÁ'
                  : pill.id === 'BEST_SELLER'
                  ? quickFilter === 'BEST_SELLER' && activeHeaderTab !== 'GIẢM GIÁ'
                  : quickFilter === 'ALL' && activeHeaderTab !== 'GIẢM GIÁ' && !activeSubCategory && !searchQuery;

              return (
                <button
                  key={pill.id}
                  onClick={() => {
                    if (pill.id === 'SALE') {
                      setActiveHeaderTab('GIẢM GIÁ');
                      setActiveSubCategory('');
                      setQuickFilter('SALE');
                    } else if (pill.id === 'BEST_SELLER') {
                      if (activeHeaderTab === 'GIẢM GIÁ') setActiveHeaderTab('NAM');
                      setActiveSubCategory('');
                      setQuickFilter('BEST_SELLER');
                      setSearchQuery('');
                    } else {
                      // 'ALL'
                      if (activeHeaderTab === 'GIẢM GIÁ') setActiveHeaderTab('NAM');
                      setActiveSubCategory('');
                      setQuickFilter('ALL');
                      setSearchQuery('');
                      setSelectedSize('');
                      setPriceRange(5000000);
                    }
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border ${
                    isActive
                      ? 'bg-teal-500 text-white border-teal-400 shadow-md shadow-teal-500/30 scale-105'
                      : 'bg-white/10 hover:bg-white/20 text-white/90 border-white/15 backdrop-blur-sm'
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* TRUST HIGHLIGHTS BAR */}
      <section className="bg-white border-b border-slate-100 py-6 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Truck, title: "Giao hàng hỏa tốc", desc: "Freeship đơn từ 500k toàn quốc", color: "text-teal-700", bg: "bg-teal-50" },
            { icon: ShieldCheck, title: "Bảo hành 12 tháng", desc: "Cam kết chính hãng 100%", color: "text-emerald-700", bg: "bg-emerald-50" },
            { icon: RefreshCw, title: "Đổi trả 30 ngày", desc: "Đổi size tận nơi thuận tiện", color: "text-sky-700", bg: "bg-sky-50" },
            { icon: Headphones, title: "Tư vấn 24/7", desc: "Hỗ trợ khách hàng chu đáo", color: "text-purple-700", bg: "bg-purple-50" }
          ].map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div key={idx} className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50/60 hover:bg-slate-50 transition-colors border border-slate-100/80">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${feature.bg} ${feature.color} shadow-sm`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-xs text-slate-800 uppercase tracking-wide truncate">{feature.title}</h4>
                  <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{feature.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* BỘ LỌC VÀ LƯỚI SẢN PHẨM */}
      <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col lg:flex-row gap-8">
        
        {/* SIDEBAR FILTER */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_25px_rgb(0,0,0,0.03)] sticky top-28 space-y-6">
            
            {/* Filter Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="font-black text-slate-900 uppercase text-xs tracking-wider flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-teal-700" /> Bộ Lọc Tìm Kiếm
              </span>
              {(activeSubCategory || selectedSize || priceRange < 5000000 || searchQuery || activeHeaderTab === "GIẢM GIÁ" || quickFilter !== "ALL") && (
                <button
                  onClick={() => {
                    if (activeHeaderTab === "GIẢM GIÁ") setActiveHeaderTab("NAM");
                    setActiveSubCategory("");
                    setSelectedSize("");
                    setPriceRange(5000000);
                    setSearchQuery("");
                    setQuickFilter("ALL");
                    setIsSearchOpen(false);
                  }}
                  className="text-[11px] font-bold text-teal-700 hover:text-teal-900 hover:underline"
                >
                  Xóa lọc
                </button>
              )}
            </div>

            {/* Sub Categories */}
            {activeHeaderTab !== "GIẢM GIÁ" && (
              <div>
                <h3 className="font-extrabold text-slate-800 text-xs mb-3 uppercase tracking-wider">Danh mục con</h3>
                {matchedRootCat ? (
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => setActiveSubCategory("")}
                      className={`text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                        activeSubCategory === ""
                          ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <span>Tất cả {activeHeaderTab}</span>
                      {activeSubCategory === "" && <Check className="w-3.5 h-3.5" />}
                    </button>
                    {currentSubCats.map(subCat => {
                      const isSelected = activeSubCategory === subCat.id;
                      return (
                        <button
                          key={subCat.id}
                          onClick={() => setActiveSubCategory(subCat.id)}
                          className={`text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <span>{subCat.name}</span>
                          {isSelected ? <Check className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Đang cập nhật danh mục.</p>
                )}
              </div>
            )}
            
            {/* Size Filter */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Kích cỡ giày</h3>
                {selectedSize && (
                  <span className="text-[10px] font-bold bg-teal-50 text-teal-800 px-2 py-0.5 rounded-md">Size {selectedSize}</span>
                )}
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {ALL_SIZES.map(size => {
                  const isSelected = selectedSize === size;
                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(selectedSize === size ? "" : size)}
                      className={`h-9 flex items-center justify-center rounded-xl text-xs font-black transition-all ${
                        isSelected
                          ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20 scale-105'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-100'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Filter */}
            <div className="pt-2">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Mức giá tối đa</h3>
                <span className="text-[10px] font-black text-teal-800 bg-teal-50 px-2 py-1 rounded-md">
                  {formatVND(priceRange)}
                </span>
              </div>
              <input
                type="range"
                min="100000"
                max="5000000"
                step="100000"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-teal-700"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1.5">
                <span>100K</span>
                <span>5 Triệu</span>
              </div>
            </div>

          </div>
        </aside>

        {/* MAIN PRODUCT GRID */}
        <main className="flex-1 min-w-0">
          
          {/* Products Header / Breadcrumbs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-6 border-b border-slate-100 gap-2">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                {searchQuery ? (
                  <>Tìm kiếm: <span className="text-teal-700">"{searchQuery}"</span></>
                ) : activeHeaderTab === "GIẢM GIÁ" ? (
                  <span className="flex items-center gap-2 text-red-600"><Flame className="w-7 h-7" /> Siêu Khuyến Mãi</span>
                ) : quickFilter === "BEST_SELLER" ? (
                  <span className="flex items-center gap-2 text-teal-800"><Sparkles className="w-6 h-6 text-amber-500" /> Sản Phẩm Bán Chạy</span>
                ) : (
                  activeSubCategory ? categories.find(c => c.id === activeSubCategory)?.name : `Sản Phẩm ${activeHeaderTab}`
                )}
              </h2>
              <p className="text-xs font-bold text-slate-400 mt-1">
                Hiển thị <span className="text-teal-700">{filteredProducts.length}</span> sản phẩm chất lượng
              </p>
            </div>

            {/* Active filters badges */}
            {(activeSubCategory || selectedSize || priceRange < 5000000 || searchQuery || quickFilter !== "ALL") && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    if (activeHeaderTab === "GIẢM GIÁ") setActiveHeaderTab("NAM");
                    setActiveSubCategory("");
                    setSelectedSize("");
                    setPriceRange(5000000);
                    setSearchQuery("");
                    setQuickFilter("ALL");
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Xóa tất cả bộ lọc
                </button>
              </div>
            )}
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex flex-col justify-center items-center py-28">
              <Loader2 className="w-10 h-10 animate-spin text-teal-700 mb-3" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đang tải sản phẩm...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white border border-slate-100 shadow-sm rounded-3xl p-8">
              <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-slate-800 uppercase mb-1">Không tìm thấy sản phẩm nào</h3>
              <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto mb-6">Hãy thử tìm với từ khóa khác hoặc điều chỉnh lại bộ lọc kích cỡ, khoảng giá của bạn.</p>
              <button
                onClick={() => { setActiveSubCategory(""); setSelectedSize(""); setPriceRange(5000000); setSearchQuery(""); setQuickFilter("ALL"); setIsSearchOpen(false); }}
                className="px-6 py-3 bg-teal-700 hover:bg-teal-800 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-teal-700/20"
              >
                Xóa bộ lọc danh mục này
              </button>
            </div>
          ) : (
            <>
              {/* Product Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {currentProducts.map((prod) => {
                  const isSale = prod.discountPrice && prod.discountPrice > 0;
                  const percentOff = isSale ? Math.round(((prod.price - prod.discountPrice) / prod.price) * 100) : 0;
                  const ratingAvg = prod.reviews && prod.reviews.length > 0
                    ? (prod.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / prod.reviews.length).toFixed(1)
                    : null;

                  return (
                    <div
                      key={prod.id}
                      className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-xl hover:border-teal-200/80 hover:-translate-y-1.5 transition-all duration-300 flex flex-col relative"
                    >
                      {/* Sale & Tag Badges */}
                      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
                        {isSale && (
                          <span className="bg-gradient-to-r from-red-500 to-rose-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase shadow-md shadow-red-500/20 flex items-center gap-1">
                            <Flame className="w-3 h-3 text-amber-300" /> -{percentOff}%
                          </span>
                        )}
                        {prod.stock > 0 && prod.stock <= 3 && (
                          <span className="bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase shadow-sm">
                            Sắp hết
                          </span>
                        )}
                      </div>

                      {/* Out of Stock Mask */}
                      {prod.stock === 0 && (
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-20 flex items-center justify-center p-4">
                          <span className="bg-slate-900 text-white font-black px-4 py-2 rounded-xl uppercase tracking-widest text-[11px] shadow-xl border border-slate-700">
                            TẠM HẾT HÀNG
                          </span>
                        </div>
                      )}

                      {/* Image Frame */}
                      <div
                        className="aspect-[4/3] bg-gradient-to-b from-slate-50 to-slate-100/60 flex justify-center items-center cursor-pointer p-6 relative overflow-hidden"
                        onClick={() => { setSelectedProduct(prod); setPopupSize(prod.sizes?.[0] || ""); }}
                      >
                        <img
                          src={prod.image || "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=400"}
                          alt={prod.name}
                          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500 ease-out"
                        />
                        
                        {/* Quick View Button on Hover */}
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-xl text-[11px] font-black text-slate-800 shadow-md flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                            <Eye className="w-3.5 h-3.5 text-teal-700" /> Xem chi tiết
                          </span>
                        </div>
                      </div>
                      
                      {/* Details Section */}
                      <div className="p-4 sm:p-5 flex flex-col flex-1">
                        
                        {/* Title */}
                        <h3
                          className="font-bold text-slate-800 text-xs sm:text-sm mb-1.5 group-hover:text-teal-700 transition-colors line-clamp-2 cursor-pointer leading-snug"
                          onClick={() => { setSelectedProduct(prod); setPopupSize(prod.sizes?.[0] || ""); }}
                        >
                          {prod.name}
                        </h3>
                        
                        {/* Rating Stars & Count */}
                        <div className="flex items-center gap-1.5 mb-3 min-h-[16px]">
                          {ratingAvg ? (
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span className="text-xs font-black text-slate-700">{ratingAvg}</span>
                              <span className="text-[10px] text-slate-400 font-semibold">({prod.reviews.length})</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">Chưa có đánh giá</span>
                          )}
                        </div>
                        
                        {/* Price Display */}
                        <div className="mt-auto mb-3.5">
                          {isSale ? (
                            <div className="flex items-baseline gap-2">
                              <span className="text-red-600 font-black text-base sm:text-lg leading-none">
                                {formatVND(prod.discountPrice)}
                              </span>
                              <span className="text-slate-400 line-through text-xs font-semibold">
                                {formatVND(prod.price)}
                              </span>
                            </div>
                          ) : (
                            <div className="text-slate-900 font-black text-base sm:text-lg leading-none">
                              {formatVND(prod.price)}
                            </div>
                          )}
                        </div>

                        {/* Add to Cart Button */}
                        <button
                          disabled={prod.stock === 0}
                          onClick={() => addToCart(prod, prod.sizes?.[0] || "")}
                          className="w-full py-3 bg-slate-50 hover:bg-teal-700 text-slate-700 hover:text-white disabled:bg-slate-50 disabled:text-slate-300 text-[11px] font-black uppercase rounded-xl transition-all duration-200 tracking-wider flex items-center justify-center gap-1.5 border border-slate-200/70 hover:border-teal-700 shadow-sm"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          {prod.stock === 0 ? "Hết hàng" : "Thêm Giỏ Hàng"}
                        </button>

                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-12 gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="p-2.5 bg-white border border-slate-200/80 shadow-sm rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-600"/>
                  </button>
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(idx + 1)}
                      className={`w-9 h-9 flex items-center justify-center rounded-xl font-bold text-xs transition-all ${
                        currentPage === idx + 1
                          ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
                          : 'bg-white border border-slate-200/80 shadow-sm hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="p-2.5 bg-white border border-slate-200/80 shadow-sm rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-all"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-600"/>
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ==================== MODAL: TRA CỨU ĐƠN HÀNG ==================== */}
      {isTrackModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl relative animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <h2 className="font-black text-slate-800 uppercase flex items-center gap-2 tracking-wider text-sm"><PackageSearch className="w-5 h-5 text-teal-700"/> Tra cứu đơn hàng</h2>
               <button onClick={() => { setIsTrackModalOpen(false); setTrackResults(null); }} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"><X className="w-5 h-5 text-slate-600" /></button>
             </div>
             
             <div className="p-6 border-b border-slate-100 bg-white">
                <form onSubmit={handleTrackOrderSubmit} className="flex gap-3">
                  <input type="tel" placeholder="Nhập số điện thoại mua hàng..." required value={trackPhone} onChange={(e) => setTrackPhone(e.target.value)} className="flex-1 px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-teal-600 font-medium transition-colors" />
                  <button type="submit" disabled={isTracking} className="px-6 py-3 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white font-bold rounded-xl whitespace-nowrap transition-colors flex items-center gap-2">
                    {isTracking ? <Loader2 className="w-4 h-4 animate-spin"/> : <Search className="w-4 h-4"/>} Tra cứu
                  </button>
                </form>
             </div>

             <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                {!trackResults ? (
                   <div className="h-40 flex flex-col items-center justify-center text-slate-400">
                      <Package className="w-10 h-10 mb-3 opacity-20"/>
                      <p className="text-sm font-medium">Nhập số điện thoại để xem lịch sử mua hàng của bạn</p>
                   </div>
                ) : trackResults.length === 0 ? (
                   <div className="h-40 flex items-center justify-center text-red-500 font-bold text-sm">Không tìm thấy đơn hàng nào khớp với SĐT này.</div>
                ) : (
                   <div className="space-y-4">
                     {trackResults.map((order: any) => (
                       <div key={order.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                          <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-50">
                             <div>
                               <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Mã đơn: {order.id.slice(-6)}</p>
                               <p className="text-sm font-bold text-slate-700">{new Date(order.createdAt).toLocaleDateString('vi-VN')} - {new Date(order.createdAt).toLocaleTimeString('vi-VN')}</p>
                             </div>
                             <div className="text-right flex flex-col gap-1.5 items-end">
                                <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider ${order.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : order.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                  {order.status === 'PENDING' ? 'Đang xử lý' : order.status === 'DELIVERED' ? 'Đã giao' : order.status}
                                </span>
                                <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider ${order.paymentStatus === 'PAID' ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-600'}`}>
                                  {order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                </span>
                             </div>
                          </div>
                          
                          <div className="space-y-3 mb-4">
                            {order.items.map((item: any, idx: number) => (
                               <div key={idx} className="flex justify-between items-center text-sm">
                                  <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center font-bold text-slate-500 text-xs">{item.quantity}</span>
                                    <span className="font-bold text-slate-800">{item.productName} <span className="text-slate-400 font-normal">({item.size || 'Free'})</span></span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="font-bold text-teal-700">{formatVND(item.price)}</span>
                                    {order.status === 'DELIVERED' && (
                                      <button onClick={() => openReviewModal(item.productId, item.productName)} className="px-2 py-1 bg-amber-50 text-amber-600 rounded text-xs font-bold hover:bg-amber-100 transition-colors flex items-center gap-1">
                                        <Star className="w-3 h-3 fill-amber-500" /> Đánh giá
                                      </button>
                                    )}
                                  </div>
                               </div>
                            ))}
                          </div>
                          
                          <div className="flex justify-between items-center pt-4 border-t border-slate-50 border-dashed">
                             <span className="text-xs font-bold text-slate-500 uppercase">Tổng cộng</span>
                             <span className="text-lg font-black text-slate-900">{formatVND(order.totalAmount)}</span>
                          </div>
                       </div>
                     ))}
                   </div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: CHI TIẾT SẢN PHẨM ==================== */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row shadow-2xl relative">
            <button onClick={() => { setSelectedProduct(null); setPopupSize(""); }} className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-lg z-10 transition-colors"><X className="w-5 h-5 text-slate-600" /></button>
            
            <div className="w-full md:w-1/2 bg-[#F8FAFC] min-h-[300px] flex items-center justify-center p-8">
               <img src={selectedProduct.image || "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=600"} alt={selectedProduct.name} className="w-full h-auto object-contain mix-blend-multiply drop-shadow-2xl hover:scale-105 transition-transform duration-700" />
            </div>

            <div className="w-full md:w-1/2 p-8 lg:p-10 flex flex-col bg-white">
              <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider w-fit mb-4">{selectedProduct.category?.name || "Lam Điền"}</span>
              <h2 className="text-2xl font-black text-slate-900 mb-3 leading-tight">{selectedProduct.name}</h2>
              
              {selectedProduct.discountPrice && selectedProduct.discountPrice > 0 ? (
                <div className="flex items-end gap-3 mb-6">
                  <span className="text-3xl font-black text-red-600 leading-none">{formatVND(selectedProduct.discountPrice)}</span>
                  <span className="text-base text-slate-400 line-through font-bold">{formatVND(selectedProduct.price)}</span>
                </div>
              ) : (
                <div className="text-3xl font-black text-slate-900 mb-6 leading-none">{formatVND(selectedProduct.price)}</div>
              )}

              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap mb-6 bg-slate-50 p-5 rounded-2xl border-none">
                {selectedProduct.description || "Chưa có mô tả chi tiết."}
              </p>

              {/* Reviews Section */}
              <div className="mb-6">
                 <h3 className="font-bold text-slate-800 text-sm mb-3">Đánh giá sản phẩm ({selectedProduct.reviews?.length || 0})</h3>
                 <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                   {selectedProduct.reviews && selectedProduct.reviews.length > 0 ? (
                     selectedProduct.reviews.map((rev: any) => (
                       <div key={rev.id} className="bg-slate-50 p-3 rounded-xl">
                         <div className="flex justify-between items-center mb-1.5">
                           <span className="font-bold text-xs text-slate-800">{rev.user?.name || "Người dùng ẩn danh"}</span>
                           <div className="flex gap-0.5">
                             {[1, 2, 3, 4, 5].map(star => (
                               <Star key={star} className={`w-3 h-3 ${rev.rating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                             ))}
                           </div>
                         </div>
                         <p className="text-xs text-slate-600">{rev.comment}</p>
                       </div>
                     ))
                   ) : (
                     <p className="text-xs text-slate-500 italic">Chưa có đánh giá nào.</p>
                   )}
                 </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">Chọn Size</span>
                  <span onClick={() => setIsSizeGuideOpen(true)} className="flex items-center gap-1.5 text-xs text-teal-700 hover:text-teal-900 cursor-pointer font-bold"><Ruler className="w-3.5 h-3.5"/> Hướng dẫn chọn size</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {selectedProduct.sizes && selectedProduct.sizes.length > 0 ? (
                    selectedProduct.sizes.map((s: string) => (
                      <button key={s} onClick={() => setPopupSize(s)} className={`w-12 h-12 flex items-center justify-center rounded-xl text-sm font-bold border-none transition-all ${popupSize === s ? 'bg-slate-900 text-white shadow-md scale-105' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{s}</button>
                    ))
                  ) : <span className="text-sm text-slate-500 italic font-medium">Freesize</span>}
                </div>
              </div>

              <div className="mt-auto pt-6">
                 <button disabled={selectedProduct.stock === 0} onClick={() => addToCart(selectedProduct, popupSize)} className="w-full bg-teal-700 hover:bg-teal-800 disabled:bg-slate-200 disabled:text-slate-400 text-white py-4 rounded-xl font-black uppercase text-sm tracking-widest shadow-lg shadow-teal-700/20 active:scale-[0.98] transition-all">
                   {selectedProduct.stock === 0 ? "Tạm hết hàng" : "Thêm vào giỏ hàng"}
                 </button>
                 <div className="flex gap-6 mt-5 justify-center">
                    <span className="flex items-center gap-1.5 text-xs text-slate-500 font-bold"><Check className="w-4 h-4 text-emerald-500"/> Sẵn {selectedProduct.stock} SP</span>
                    <span className="flex items-center gap-1.5 text-xs text-slate-500 font-bold"><Truck className="w-4 h-4 text-teal-500"/> Freeship toàn quốc</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== PANEL GIỎ HÀNG ==================== */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <h2 className="font-black text-slate-900 uppercase flex items-center gap-2 tracking-wider text-sm"><ShoppingCart className="w-5 h-5 text-teal-700"/> Giỏ Hàng</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-1.5 bg-slate-50 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-600" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
              {cart.length === 0 ? (
                <div className="text-center mt-20 text-slate-400 font-medium">Giỏ hàng trống. Hãy mua sắm thêm nhé!</div>
              ) : (
                cart.map(item => (
                  <div key={item.cartItemId} className="flex gap-4 bg-white border-none p-3.5 rounded-2xl shadow-sm">
                    <img src={item.image || "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=150"} alt={item.name} className="w-20 h-20 object-contain bg-[#F8FAFC] rounded-xl" />
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{item.name}</h4>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold uppercase mt-1 inline-block">Size: {item.size || "Free"}</span>
                        </div>
                        <button onClick={() => removeFromCart(item.cartItemId)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="font-black text-teal-700 text-sm">{formatVND(item.price)}</span>
                        <div className="flex items-center bg-slate-50 rounded-lg overflow-hidden border border-slate-100">
                          <button onClick={() => updateQuantity(item.cartItemId, -1)} className="px-3 py-1 hover:bg-slate-200 font-bold text-slate-600">-</button>
                          <span className="px-2 py-1 text-xs font-bold text-slate-800">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.cartItemId, 1)} className="px-3 py-1 hover:bg-slate-200 font-bold text-slate-600">+</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-white">
              <div className="flex justify-between items-center mb-5"><span className="font-bold text-slate-500 text-sm uppercase tracking-wider">Tổng cộng:</span><span className="text-2xl font-black text-slate-900">{formatVND(cartTotal)}</span></div>
              <button disabled={cart.length === 0} onClick={openCheckout} className="w-full py-4 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black uppercase rounded-xl tracking-widest shadow-lg shadow-teal-700/20 transition-colors">Thanh Toán Ngay</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: THANH TOÁN (CHECKOUT) ==================== */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
              <h2 className="font-black text-slate-800 uppercase flex items-center gap-2">Xác nhận Đặt hàng</h2>
              <button onClick={() => setIsCheckoutOpen(false)} className="p-2 hover:bg-slate-200 rounded-lg transition-colors"><X className="w-5 h-5 text-slate-600"/></button>
            </div>
            
            <form onSubmit={handleCheckoutSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Người nhận</label><input type="text" required value={checkoutForm.customerName} onChange={e => setCheckoutForm({...checkoutForm, customerName: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-teal-600 font-medium transition-colors" placeholder="Tên người nhận" /></div>
              <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Email</label><input type="email" required value={checkoutForm.customerEmail} onChange={e => setCheckoutForm({...checkoutForm, customerEmail: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-teal-600 font-medium transition-colors" placeholder="Email nhận thông báo" /></div>
              <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Số điện thoại</label><input type="tel" required value={checkoutForm.customerPhone} onChange={e => setCheckoutForm({...checkoutForm, customerPhone: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-teal-600 font-medium transition-colors" placeholder="SĐT liên hệ giao hàng" /></div>
              <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Địa chỉ giao hàng</label><textarea required rows={2} value={checkoutForm.address} onChange={e => setCheckoutForm({...checkoutForm, address: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-teal-600 font-medium transition-colors" placeholder="Số nhà, đường, phường, quận..." /></div>
              
              <div className="pt-2">
                <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Phương thức thanh toán</label>
                <div className="grid grid-cols-2 gap-3">
                  <div onClick={() => setCheckoutForm({...checkoutForm, paymentMethod: "COD"})} className={`border-2 rounded-xl p-3 cursor-pointer text-center font-bold text-sm transition-all ${checkoutForm.paymentMethod === 'COD' ? 'border-teal-700 bg-teal-50 text-teal-800 shadow-sm' : 'border-slate-100 text-slate-500 hover:bg-slate-50'}`}>Thanh toán khi nhận (COD)</div>
                  <div onClick={() => setCheckoutForm({...checkoutForm, paymentMethod: "QR"})} className={`border-2 rounded-xl p-3 cursor-pointer text-center font-bold text-sm transition-all ${checkoutForm.paymentMethod === 'QR' ? 'border-teal-700 bg-teal-50 text-teal-800 shadow-sm' : 'border-slate-100 text-slate-500 hover:bg-slate-50'}`}>Chuyển khoản (Mã QR)</div>
                </div>
              </div>

              {checkoutForm.paymentMethod === "QR" && (
                <div className="bg-slate-50 p-6 rounded-2xl border-none shadow-inner flex flex-col items-center animate-in fade-in zoom-in-95">
                  {!isQrPaid ? (
                    <>
                      <p className="text-xs font-black text-slate-700 mb-3 uppercase text-center flex items-center gap-2"><QrCode className="w-4 h-4"/> Quét mã để thanh toán ngay</p>
                      <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=THANHTOAN_${cartTotal}_${checkoutForm.customerPhone}`} alt="QR Code" className="w-32 h-32 opacity-95" />
                      </div>
                      <p className="text-[11px] font-medium text-slate-500 mt-3 text-center">Hoặc chuyển khoản thủ công tới STK: <span className="font-bold text-teal-700">0123456789</span></p>
                      <button type="button" onClick={handleSimulateQRPayment} className="mt-5 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase rounded-xl shadow-md transition-colors">
                        Giả lập: Quét QR & Thanh toán
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 animate-in zoom-in">
                      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3 shadow-sm">
                        <Check className="w-8 h-8" />
                      </div>
                      <p className="text-sm font-black text-emerald-700 uppercase tracking-wider">Thanh toán thành công</p>
                      <p className="text-xs text-slate-500 mt-1 font-medium">Hệ thống đã ghi nhận khoản tiền {formatVND(cartTotal)}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-teal-50 p-5 rounded-2xl flex justify-between items-center border-none shadow-sm mt-4">
                 <span className="font-bold text-teal-800 text-sm uppercase tracking-wider">Tổng thanh toán:</span><span className="text-2xl font-black text-teal-700">{formatVND(cartTotal)}</span>
              </div>
              
              <button 
                type="submit" 
                disabled={(checkoutForm.paymentMethod === 'QR' && !isQrPaid) || isCheckoutSubmitting}
                className="w-full py-4 mt-4 bg-slate-900 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black rounded-xl uppercase transition-colors shadow-lg shadow-slate-900/20 tracking-widest flex items-center justify-center gap-2"
              >
                {isCheckoutSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : (checkoutForm.paymentMethod === 'QR' && !isQrPaid ? 'Vui lòng thanh toán QR để tiếp tục' : 'Hoàn Tất Đặt Hàng')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: ĐĂNG NHẬP / ĐĂNG KÝ ==================== */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200 overflow-hidden">
            <button onClick={() => setIsAuthModalOpen(false)} className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-slate-200 rounded-lg z-10 transition-colors"><X className="w-5 h-5 text-slate-600" /></button>
            
            <div className="p-8">
              <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase text-center">{isLoginMode ? 'Đăng nhập' : 'Tạo tài khoản'}</h2>
              <p className="text-sm text-slate-500 text-center mb-6 font-medium">
                {isLoginMode ? 'Chào mừng bạn quay trở lại với Lam Điền' : 'Trải nghiệm mua sắm tuyệt vời hơn'}
              </p>

              {authError && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl text-center border-none">{authError}</div>}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {!isLoginMode && (
                  <>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Họ và tên</label>
                      <input type="text" required value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-teal-600 transition-colors font-medium" placeholder="Nguyễn Văn A" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Số điện thoại</label>
                      <input type="tel" required value={authForm.phone} onChange={e => setAuthForm({...authForm, phone: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-teal-600 transition-colors font-medium" placeholder="0912345678" />
                    </div>
                  </>
                )}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Email</label>
                  <input type="email" required value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-teal-600 transition-colors font-medium" placeholder="email@example.com" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Mật khẩu</label>
                  <input type="password" required value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-teal-600 transition-colors font-medium" placeholder="••••••••" />
                </div>

                <button type="submit" disabled={isAuthSubmitting} className="w-full py-4 mt-2 bg-slate-900 hover:bg-teal-700 disabled:bg-slate-300 text-white font-black rounded-xl uppercase transition-colors shadow-lg shadow-slate-900/20 tracking-widest flex items-center justify-center gap-2">
                  {isAuthSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : (isLoginMode ? 'Đăng nhập ngay' : 'Đăng ký tài khoản')}
                </button>
              </form>

              <div className="mt-6 flex items-center justify-between">
                <span className="w-1/5 border-b border-slate-100"></span>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Hoặc tiếp tục với</span>
                <span className="w-1/5 border-b border-slate-100"></span>
              </div>
              <button onClick={() => signIn('google')} className="w-full mt-6 py-3.5 bg-white border-none shadow-sm hover:shadow-md text-slate-700 font-bold rounded-xl flex items-center justify-center gap-3 transition-all">
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                Đăng nhập bằng Google
              </button>

              <div className="mt-6 text-center text-sm font-semibold text-slate-600">
                {isLoginMode ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
                <button onClick={() => { setIsLoginMode(!isLoginMode); setAuthError(""); }} className="text-teal-700 hover:text-teal-900 uppercase font-black ml-1">
                  {isLoginMode ? 'Đăng ký' : 'Đăng nhập'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: HỒ SƠ ==================== */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setIsReviewModalOpen(false); }}>
           <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-300">
             <div className="p-6">
                <button onClick={() => setIsReviewModalOpen(false)} className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-slate-200 rounded-lg z-10 transition-colors"><X className="w-5 h-5 text-slate-600" /></button>
                <h3 className="font-black text-xl text-slate-900 mb-2">Đánh giá sản phẩm</h3>
                <p className="text-sm font-semibold text-slate-500 mb-6">{reviewForm.productName}</p>
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Chất lượng sản phẩm</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button type="button" key={star} onClick={() => setReviewForm(prev => ({...prev, rating: star}))} className="p-1 transition-transform hover:scale-110 active:scale-95">
                          <Star className={`w-8 h-8 ${reviewForm.rating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Bình luận</label>
                    <textarea 
                      required 
                      value={reviewForm.comment} 
                      onChange={e => setReviewForm(prev => ({...prev, comment: e.target.value}))} 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 transition-colors min-h-[100px]" 
                      placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                    />
                  </div>
                  <button type="submit" disabled={isSubmittingReview} className="w-full bg-teal-700 hover:bg-teal-800 text-white font-black text-sm uppercase py-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
                    {isSubmittingReview ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Gửi đánh giá</>}
                  </button>
                </form>
             </div>
           </div>
        </div>
      )}

      {isProfileModalOpen && currentUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl relative animate-in zoom-in-95 duration-200 overflow-hidden">
             <button onClick={() => setIsProfileModalOpen(false)} className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-slate-200 rounded-lg z-10 transition-colors"><X className="w-5 h-5 text-slate-600" /></button>
             <div className="p-8 text-center">
                <div className="w-20 h-20 bg-teal-100 text-teal-800 rounded-2xl flex items-center justify-center font-black text-3xl shadow-sm mx-auto mb-5 rotate-3">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-black text-xl text-slate-900 mb-1">{currentUser.name}</h3>
                <p className="text-sm font-semibold text-slate-500 mb-6">{currentUser.email}</p>
                
                <form onSubmit={handleUpdateProfile} className="text-left space-y-4 mb-8">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Số điện thoại</label>
                    <input type="tel" required value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium focus:border-teal-600 outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Địa chỉ</label>
                    <textarea required value={profileForm.address} onChange={e => setProfileForm({...profileForm, address: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium focus:border-teal-600 outline-none transition-colors" rows={2} />
                  </div>
                  <button type="submit" disabled={isProfileSubmitting} className="w-full py-3.5 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white font-black tracking-widest uppercase rounded-xl text-xs transition-colors shadow-md flex justify-center items-center gap-2">
                    {isProfileSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Lưu Thông Tin'}
                  </button>
                </form>

                <button onClick={handleLogout} className="w-full py-3.5 bg-red-50 hover:bg-red-100 text-red-600 font-black rounded-xl uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2">
                  <LogOut className="w-4 h-4" /> Đăng xuất
                </button>
             </div>
          </div>
        </div>
      )}

      {/* ==================== BẢNG SIZE MODAL ==================== */}
      {isSizeGuideOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-black uppercase tracking-wider text-sm flex items-center gap-2"><Ruler className="w-4 h-4 text-teal-400"/> Bảng Quy Đổi Size</h3>
              <button onClick={() => setIsSizeGuideOpen(false)} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-6 bg-slate-50 p-4 rounded-xl border-none font-medium">Đo chiều dài bàn chân từ gót đến ngón dài nhất để đối chiếu bảng dưới đây.</p>
              <div className="overflow-hidden rounded-2xl shadow-sm border border-slate-100">
                <table className="w-full text-center text-sm">
                  <thead className="bg-slate-50 font-black text-slate-600 uppercase text-[10px] tracking-widest">
                    <tr><th className="py-4">Size EU</th><th className="py-4 border-l border-slate-100">Size US</th><th className="py-4 border-l border-slate-100">Chiều dài (cm)</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    <tr className="hover:bg-slate-50"><td className="py-3.5 font-black text-teal-700">39</td><td className="py-3.5 border-l border-slate-100">7.5</td><td className="py-3.5 border-l border-slate-100 text-slate-500">24.1 - 24.5</td></tr>
                    <tr className="hover:bg-slate-50 bg-teal-50/50"><td className="py-3.5 font-black text-teal-800">40</td><td className="py-3.5 border-l border-slate-100">8.5</td><td className="py-3.5 border-l border-slate-100 text-teal-700 font-bold">24.6 - 25.0</td></tr>
                    <tr className="hover:bg-slate-50"><td className="py-3.5 font-black text-teal-700">41</td><td className="py-3.5 border-l border-slate-100">9.5</td><td className="py-3.5 border-l border-slate-100 text-slate-500">25.1 - 25.5</td></tr>
                    <tr className="hover:bg-slate-50"><td className="py-3.5 font-black text-teal-700">42</td><td className="py-3.5 border-l border-slate-100">10.0</td><td className="py-3.5 border-l border-slate-100 text-slate-500">25.6 - 26.0</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING ACTION BUTTON - SCROLL TO TOP */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 z-30 w-11 h-11 bg-teal-700 hover:bg-teal-800 text-white rounded-2xl shadow-xl shadow-teal-700/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95 border border-teal-600/40 group"
        title="Lên đầu trang"
      >
        <ArrowUp className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
      </button>

      {/* MODERN FOOTER */}
      <footer className="bg-slate-950 text-slate-300 pt-16 pb-8 border-t border-slate-800 mt-16 relative overflow-hidden">
        {/* Accent top gradient line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-600"></div>

        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            
            {/* Brand Intro */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img src="/images/logo-1.png" alt="Lam Điền" className="h-12 w-auto object-contain brightness-200" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                <div>
                  <h3 className="font-black text-white text-base tracking-wider leading-none">LAM ĐIỀN</h3>
                  <p className="text-[10px] text-teal-400 font-bold uppercase tracking-widest mt-1">Bước chân tự nhiên</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Thương hiệu giày dép Việt Nam chất lượng cao. Chúng tôi cam kết mang đến những sản phẩm êm ái, bền bỉ và tôn vinh phong cách người Việt.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-bold text-teal-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> 100% Chính hãng
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-bold text-amber-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Chuẩn chất lượng
                </span>
              </div>
            </div>

            {/* Quick Policies */}
            <div>
              <h4 className="font-black text-white uppercase tracking-wider mb-4 text-xs flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span> Chính sách & Hỗ trợ
              </h4>
              <ul className="space-y-2.5 text-xs font-semibold text-slate-400">
                <li><Link href="#" className="hover:text-teal-400 transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3 text-teal-600" />Giao hàng toàn quốc (Freeship)</Link></li>
                <li><Link href="#" className="hover:text-teal-400 transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3 text-teal-600" />Đổi trả trong 30 ngày linh hoạt</Link></li>
                <li><Link href="#" className="hover:text-teal-400 transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3 text-teal-600" />Bảo hành đường keo 12 tháng</Link></li>
                <li><button onClick={() => setIsSizeGuideOpen(true)} className="hover:text-teal-400 transition-colors flex items-center gap-2 text-left"><ChevronRight className="w-3 h-3 text-teal-600" />Bảng hướng dẫn chọn size</button></li>
              </ul>
            </div>

            {/* Contact & Stores */}
            <div>
              <h4 className="font-black text-white uppercase tracking-wider mb-4 text-xs flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span> Thông tin liên hệ
              </h4>
              <ul className="space-y-3 text-xs font-medium text-slate-400">
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-teal-400 flex-shrink-0">
                    <Phone className="w-4 h-4"/>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Tổng đài CSKH</p>
                    <p className="font-bold text-white text-sm">1900 1000</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-teal-400 flex-shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4"/>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Địa chỉ cửa hàng</p>
                    <p className="text-slate-300 leading-snug">228 Đ. Cầu Giấy, Quan Hoa, Cầu Giấy, Hà Nội</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Payment & Security */}
            <div>
              <h4 className="font-black text-white uppercase tracking-wider mb-4 text-xs flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span> Phương thức thanh toán
              </h4>
              <p className="text-xs text-slate-400 mb-3">Hỗ trợ đa dạng phương thức tiện lợi, an toàn và bảo mật.</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-center">
                  <span className="font-black text-amber-400 text-xs block">COD</span>
                  <span className="text-[10px] text-slate-400 font-medium">Nhận hàng trả tiền</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-center">
                  <span className="font-black text-teal-400 text-xs block flex items-center justify-center gap-1"><QrCode className="w-3 h-3" /> QR Pay</span>
                  <span className="text-[10px] text-slate-400 font-medium">Chuyển khoản 24/7</span>
                </div>
              </div>
            </div>

          </div>

          {/* Copyright Sub-footer */}
          <div className="border-t border-slate-900 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500 font-medium">
            <p>© 2024 Lam Điền Footwear. Bản quyền thuộc về Lam Điền.</p>
            <p className="flex items-center gap-1 text-slate-400">
              Được chế tác với <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> dành cho người tiêu dùng Việt
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}