"use client";

import { useState, useEffect } from "react";
import {
  LayoutDashboard, List, Package, ShoppingCart, Users, Star, Settings,
  Search, Bell, LogOut, Plus, Edit3, Trash2, Eye, CheckCircle, DollarSign, Loader2, X, CheckCircle2, AlertCircle,
  TrendingUp, Clock, AlertTriangle, ChevronRight, MessageSquare,
  Flame, BarChart3, QrCode, Truck, RefreshCw, ArrowUpRight, FileText
} from "lucide-react";
import { formatVND, formatCurrencyInput, parseCurrency, numberToWordsVN } from "@/src/lib/format";

const HEADER_TABS = ['NAM', 'NỮ', 'TRẺ EM', 'PHỤ KIỆN', 'BỘ SƯU TẬP', 'GIẢM GIÁ'];

const generateSlug = (text: string) => {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
};

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("DASHBOARD");
  const [isLoading, setIsLoading] = useState(true);
  const [globalSearch, setGlobalSearch] = useState("");

  const [stats, setStats] = useState<any>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // --- HỆ THỐNG TOAST THÔNG BÁO ---
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error', visible: boolean }>({ message: "", type: "success", visible: false });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  // --- STATE CATEGORY ---
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [catForm, setCatForm] = useState({ name: "", slug: "", status: "ACTIVE", headerTab: "NAM" });

  // STATE CHỐNG SPAM CATEGORY
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);

  // --- STATE PRODUCT ---
  const [isProdModalOpen, setIsProdModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [prodForm, setProdForm] = useState({ name: "", slug: "", price: "", discountPrice: "", stock: "", categoryId: "", status: "ACTIVE", image: "", sizes: "", description: "" });

  // STATE CHỐNG SPAM PRODUCT
  const [isSubmittingProd, setIsSubmittingProd] = useState(false);

  const MENU_ITEMS = [
    { id: "DASHBOARD", label: "Tổng quan", icon: LayoutDashboard },
    { id: "CATEGORIES", label: "Danh mục", icon: List },
    { id: "PRODUCTS", label: "Sản phẩm", icon: Package },
    { id: "ORDERS", label: "Đơn hàng", icon: ShoppingCart },
    { id: "CUSTOMERS", label: "Khách hàng", icon: Users },
    { id: "REVIEWS", label: "Đánh giá", icon: Star }
  ];

  useEffect(() => {
    document.title = "Shop Lam Điền - Quản trị Admin";
  }, []);

  useEffect(() => { loadTabContextData(); }, [activeTab]);

  const loadTabContextData = async () => {
    setIsLoading(true);
    try {
      const catRes = await fetch('/api/admin/categories');
      if (catRes.ok) setCategories(await catRes.json());

      if (activeTab === "DASHBOARD") {
        const res = await fetch('/api/admin/dashboard');
        if (res.ok) setStats(await res.json());
      } else if (activeTab === "PRODUCTS") {
        const res = await fetch('/api/admin/products');
        if (res.ok) setProducts(await res.json());
      } else if (activeTab === "ORDERS") {
        const res = await fetch('/api/admin/orders');
        if (res.ok) setOrders(await res.json());
      } else if (activeTab === "CUSTOMERS") {
        const res = await fetch('/api/admin/customers');
        if (res.ok) setCustomers(await res.json());
      } else if (activeTab === "REVIEWS") {
        const res = await fetch('/api/admin/reviews');
        if (res.ok) setReviews(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const isDelivered = newStatus === 'DELIVERED';
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderId,
          status: newStatus,
          ...(isDelivered ? { paymentStatus: 'PAID' } : {})
        })
      });

      if (res.ok) {
        setOrders(orders.map((order: any) => {
          if (order.id === orderId) {
            return {
              ...order,
              status: newStatus,
              ...(isDelivered ? { paymentStatus: 'PAID' } : {})
            };
          }
          return order;
        }));

        setSelectedOrderDetails((prev: any) => {
          if (prev && prev.id === orderId) {
            return {
              ...prev,
              status: newStatus,
              ...(isDelivered ? { paymentStatus: 'PAID' } : {})
            };
          }
          return prev;
        });

        if (isDelivered) {
          showToast("Đã giao hàng & tự động cập nhật: Đã thanh toán!", "success");
        } else {
          showToast("Đã cập nhật trạng thái đơn hàng!", "success");
        }
      } else {
        showToast("Lỗi khi cập nhật trạng thái.", "error");
      }
    } catch (error) {
      showToast("Lỗi kết nối máy chủ.", "error");
    }
  };

  const updatePaymentStatus = async (orderId: string, newPaymentStatus: string) => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, paymentStatus: newPaymentStatus })
      });

      if (res.ok) {
        setOrders(orders.map((order: any) => order.id === orderId ? { ...order, paymentStatus: newPaymentStatus } : order));
        setSelectedOrderDetails((prev: any) => prev && prev.id === orderId ? { ...prev, paymentStatus: newPaymentStatus } : prev);
        showToast("Đã cập nhật trạng thái thanh toán!", "success");
      } else {
        showToast("Lỗi khi cập nhật thanh toán.", "error");
      }
    } catch (error) {
      showToast("Lỗi kết nối máy chủ.", "error");
    }
  };

  const openCategoryModal = (cat: any = null) => {
    if (cat) {
      setEditingCategory(cat);
      setCatForm({ name: cat.name, slug: cat.slug, status: cat.status, headerTab: cat.parent?.name || "NAM" });
    } else {
      setEditingCategory(null);
      setCatForm({ name: "", slug: "", status: "ACTIVE", headerTab: "NAM" });
    }
    setIsCatModalOpen(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingCat(true);

    try {
      const url = editingCategory ? `/api/admin/categories/${editingCategory.id}` : '/api/admin/categories';
      const method = editingCategory ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(catForm) });
      if (res.ok) {
        setIsCatModalOpen(false);
        loadTabContextData();
        showToast(editingCategory ? "Cập nhật danh mục thành công!" : "Thêm danh mục thành công!", "success");
      } else {
        const err = await res.json();
        showToast(err.error || "Lỗi lưu danh mục", "error");
      }
    } catch (err) {
      showToast("Lỗi kết nối máy chủ", "error");
    } finally {
      setIsSubmittingCat(false);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadTabContextData();
      showToast("Đã xóa danh mục!", "success");
    } else {
      const err = await res.json();
      showToast(err.error || "Không thể xóa danh mục", "error");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'lamdien_shop');

    const uploadUrl = process.env.NEXT_PUBLIC_CLOUDINARY_URL;

    if (!uploadUrl) {
      throw new Error("Chưa cấu hình NEXT_PUBLIC_CLOUDINARY_URL trong biến môi trường.");
    }

    try {
      const res = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (data.secure_url) {
        setProdForm({ ...prodForm, image: data.secure_url });
        showToast("Tải ảnh thành công!", "success");
      }
    } catch (error) {
      showToast("Lỗi khi tải ảnh lên server.", "error");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const openProductModal = (prod: any = null) => {
    if (prod) {
      setEditingProduct(prod);
      setProdForm({
        name: prod.name,
        slug: prod.slug,
        price: prod.price ? formatCurrencyInput(prod.price) : "",
        discountPrice: prod.discountPrice ? formatCurrencyInput(prod.discountPrice) : "",
        stock: String(prod.stock),
        categoryId: prod.categoryId,
        status: prod.status,
        image: prod.image || "",
        sizes: prod.sizes ? prod.sizes.join(', ') : "",
        description: prod.description || ""
      });
    } else {
      setEditingProduct(null);
      setProdForm({
        name: "", slug: "", price: "", discountPrice: "", stock: "",
        categoryId: categories.filter(c => c.parentId)[0]?.id || "",
        status: "ACTIVE", image: "", sizes: "", description: ""
      });
    }
    setIsProdModalOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.name.trim()) return showToast("Vui lòng nhập tên sản phẩm", "error");
    if (!prodForm.categoryId) return showToast("Vui lòng chọn danh mục", "error");

    const parsedPrice = parseCurrency(prodForm.price);
    const parsedDiscount = prodForm.discountPrice ? parseCurrency(prodForm.discountPrice) : null;

    if (parsedPrice <= 0) return showToast("Vui lòng nhập giá bán hợp lệ (lớn hơn 0)", "error");
    if (parsedDiscount !== null && parsedDiscount >= parsedPrice) {
      return showToast("Giá khuyến mãi phải nhỏ hơn giá bán gốc!", "error");
    }
    if (prodForm.stock === "" || Number(prodForm.stock) < 0) return showToast("Vui lòng nhập số lượng kho hợp lệ", "error");
    setIsSubmittingProd(true);

    try {
      const sizesArray = prodForm.sizes.split(',').map(s => s.trim()).filter(Boolean);
      const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
      const method = editingProduct ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...prodForm,
          sizes: sizesArray,
          price: parsedPrice,
          discountPrice: parsedDiscount,
          stock: Number(prodForm.stock)
        })
      });

      if (res.ok) {
        setIsProdModalOpen(false);
        loadTabContextData();
        showToast(editingProduct ? "Cập nhật sản phẩm thành công!" : "Đã thêm sản phẩm mới!", "success");
      } else {
        const errData = await res.json();
        showToast(errData.error || "Lỗi lưu trữ sản phẩm", "error");
      }
    } catch (err) {
      showToast("Lỗi kết nối máy chủ", "error");
    } finally {
      setIsSubmittingProd(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm("Xóa sản phẩm này khỏi hệ thống?")) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadTabContextData();
      showToast("Đã xóa sản phẩm!", "success");
    } else {
      showToast("Lỗi khi xóa sản phẩm", "error");
    }
  };

  const deleteReview = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) return;
    const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadTabContextData();
      showToast("Đã xóa đánh giá!", "success");
    } else {
      showToast("Lỗi khi xóa đánh giá", "error");
    }
  };

  const filterSearch = (text: string) => text.toLowerCase().includes(globalSearch.toLowerCase());

  const renderContent = () => {
    if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>;

    switch (activeTab) {
      case "CATEGORIES":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800">Quản lý Danh mục</h2>
              <button onClick={() => openCategoryModal()} className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm shadow-sm transition-all"><Plus className="w-4 h-4" /> Thêm danh mục</button>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                  <tr><th className="px-6 py-4">Tên danh mục</th><th className="px-6 py-4">Thuộc Đầu Mục</th><th className="px-6 py-4">Đường dẫn</th><th className="px-6 py-4 text-center">Số SP</th><th className="px-6 py-4 text-right">Thao tác</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.filter(c => filterSearch(c.name)).map(cat => (
                    <tr key={cat.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-bold text-slate-800">{cat.name}</td>
                      <td className="px-6 py-4 font-bold text-teal-700">{cat.parent?.name || <span className="text-slate-400 text-xs">ĐẦU MỤC GỐC</span>}</td>
                      <td className="px-6 py-4 font-mono text-slate-500">/{cat.slug}</td>
                      <td className="px-6 py-4 text-center font-black text-teal-600">{cat._count?.products || 0}</td>
                      <td className="px-6 py-4 text-right">
                        {!cat.isHeaderMenu && (
                          <>
                            <button onClick={() => openCategoryModal(cat)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                            <button onClick={() => deleteCategory(cat.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg ml-1"><Trash2 className="w-4 h-4" /></button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "PRODUCTS":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800">Quản lý Sản phẩm</h2>
              <button onClick={() => openProductModal()} className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm shadow-sm transition-all"><Plus className="w-4 h-4" /> Thêm sản phẩm</button>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Hình ảnh</th>
                    <th className="px-6 py-4">Tên sản phẩm</th>
                    <th className="px-6 py-4">Danh mục</th>
                    <th className="px-6 py-4">Giá bán / Khuyến mãi</th>
                    <th className="px-6 py-4 text-center">Tồn kho</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.filter(p => filterSearch(p.name)).map(prod => (
                    <tr key={prod.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4"><img src={prod.image || "https://via.placeholder.com/50"} alt={prod.name} className="w-12 h-12 object-contain bg-slate-50 rounded-lg" /></td>
                      <td className="px-6 py-4 font-bold text-slate-800">{prod.name}</td>
                      <td className="px-6 py-4 text-slate-500 font-semibold">{prod.category?.name}</td>
                      <td className="px-6 py-4">
                        {prod.discountPrice && prod.discountPrice > 0 ? (
                          <div className="flex flex-col">
                            <span className="font-black text-red-600">{formatVND(prod.discountPrice)}</span>
                            <span className="text-xs text-slate-400 line-through font-semibold">{formatVND(prod.price)}</span>
                          </div>
                        ) : (
                          <span className="font-bold text-slate-900">{formatVND(prod.price)}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-700">{prod.stock}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => openProductModal(prod)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => deleteProduct(prod.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg ml-1"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "DASHBOARD": {
        const last7DaysList = stats.last7Days || [];
        const maxDayRevenue = Math.max(...last7DaysList.map((d: any) => d.revenue || 0), 1000000);
        const pendingCount = stats.ordersByStatus?.pending || 0;
        const outOfStockCount = stats.outOfStockProducts || 0;
        const paymentStats = stats.paymentStats || { qrCount: 0, qrRevenue: 0, codCount: 0, codRevenue: 0, paidCount: 0, unpaidCount: 0 };
        const totalOrdersForCalc = (stats.orders || 0) || 1;

        return (
          <div className="space-y-7">
            {/* === HEADER & ACTION TOOLBAR === */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700">
                    <LayoutDashboard className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Trung tâm điều hành kinh doanh</h2>
                    <p className="text-xs font-semibold text-slate-400 mt-0.5 capitalize">
                      {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={() => loadTabContextData()}
                  className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                  title="Tải lại số liệu mới nhất"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-teal-600' : ''}`} />
                  Làm mới số liệu
                </button>
                <button
                  onClick={() => { setActiveTab("ORDERS"); }}
                  className="flex-1 sm:flex-none px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  Quản lý đơn
                </button>
              </div>
            </div>

            {/* === SMART ACTION ALERTS === */}
            {(pendingCount > 0 || outOfStockCount > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingCount > 0 && (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-700 relative">
                        <Clock className="w-5 h-5 animate-pulse" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full ring-2 ring-white"></span>
                      </div>
                      <div>
                        <p className="text-xs font-black text-amber-900 uppercase tracking-wider">Đơn hàng mới chờ duyệt</p>
                        <p className="text-sm font-bold text-amber-800 mt-0.5">
                          Có <span className="text-amber-950 font-black underline">{pendingCount} đơn hàng</span> cần bạn xử lý ngay!
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab("ORDERS")}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl shadow-xs transition-colors flex items-center gap-1 ml-3 flex-shrink-0"
                    >
                      Duyệt ngay <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {outOfStockCount > 0 && (
                  <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0 text-red-700">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-red-900 uppercase tracking-wider">Cảnh báo tồn kho</p>
                        <p className="text-sm font-bold text-red-800 mt-0.5">
                          Có <span className="text-red-950 font-black underline">{outOfStockCount} sản phẩm</span> đã hết sạch hàng!
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab("PRODUCTS")}
                      className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow-xs transition-colors flex items-center gap-1 ml-3 flex-shrink-0"
                    >
                      Kiểm tra kho <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* === 4 KPI METRIC CARDS === */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Doanh thu */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Doanh thu thực tế</span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{formatVND(stats.revenue || 0)}</h3>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-500">Hôm nay:</span>
                  <span className="font-bold text-emerald-700">+{formatVND(stats.todayRevenue || 0)} ({stats.todayOrdersCount || 0} đơn)</span>
                </div>
              </div>

              {/* Tổng đơn & Tiến độ */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Đơn hàng hoàn tất</span>
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                  {stats.ordersByStatus?.delivered || 0} <span className="text-sm font-bold text-slate-400">/ {stats.orders || 0}</span>
                </h3>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-500">Giao thành công:</span>
                  <span className="font-bold text-blue-700">{stats.kpis?.deliverySuccessRate || 0}%</span>
                </div>
              </div>

              {/* Giá trị đơn TB (AOV) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500"></div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Giá trị đơn TB (AOV)</span>
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{formatVND(stats.kpis?.aov || 0)}</h3>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-500">Đã thu tiền:</span>
                  <span className="font-bold text-purple-700">{stats.kpis?.paidRate || 0}% tổng đơn</span>
                </div>
              </div>

              {/* Khách hàng & Tồn kho */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-500"></div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Khách hàng & Kho</span>
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                  {stats.customers || 0} <span className="text-sm font-bold text-slate-400">thành viên</span>
                </h3>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-500">Hàng tồn kho:</span>
                  <span className={`font-bold ${outOfStockCount > 0 ? 'text-red-600' : 'text-slate-700'}`}>
                    {stats.productsCount || 0} SP ({outOfStockCount} hết)
                  </span>
                </div>
              </div>
            </div>

            {/* === 7-DAY REVENUE BAR CHART === */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
                <div>
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                    <BarChart3 className="w-5 h-5 text-teal-600" />
                    Biểu đồ doanh thu 7 ngày gần nhất
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Doanh thu tính trên các đơn hàng giao thành công</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-teal-500 inline-block"></span> Doanh thu
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-emerald-400 inline-block"></span> Hôm nay
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-48 pt-6 pb-2 border-b border-slate-100">
                {last7DaysList.length > 0 ? last7DaysList.map((day: any, idx: number) => {
                  const isToday = idx === last7DaysList.length - 1 || day.dayName === 'Hôm nay';
                  const heightPercent = maxDayRevenue > 0 ? Math.max(Math.round((day.revenue / maxDayRevenue) * 100), 8) : 8;

                  return (
                    <div key={idx} className="flex flex-col items-center h-full justify-end group relative">
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 bg-slate-900 text-white text-[10px] font-bold py-1.5 px-2.5 rounded-lg shadow-lg pointer-events-none whitespace-nowrap text-center">
                        <div>{formatVND(day.revenue)}</div>
                        <div className="text-slate-400 font-normal">{day.ordersCount} đơn</div>
                      </div>

                      {/* Revenue pill above bar on desktop */}
                      <span className="hidden md:block text-[10px] font-bold text-slate-600 mb-1.5 text-center truncate w-full">
                        {day.revenue > 0 ? (day.revenue >= 1000000 ? `${(day.revenue / 1000000).toFixed(1)}Tr` : `${Math.round(day.revenue / 1000)}k`) : '0'}
                      </span>

                      {/* The Bar */}
                      <div className="w-full max-w-[42px] bg-slate-100 rounded-t-xl overflow-hidden flex flex-col justify-end relative h-36">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-xl transition-all duration-500 ${
                            isToday
                              ? 'bg-gradient-to-t from-teal-600 to-emerald-400 shadow-sm'
                              : 'bg-gradient-to-t from-slate-400 to-teal-500 group-hover:from-teal-500 group-hover:to-teal-400'
                          }`}
                        />
                      </div>

                      {/* Day Name */}
                      <span className={`text-[11px] font-bold mt-2 text-center truncate w-full ${isToday ? 'text-teal-700 font-black' : 'text-slate-500'}`}>
                        {day.dayName}
                      </span>
                    </div>
                  );
                }) : (
                  <div className="col-span-7 h-full flex items-center justify-center text-slate-400 text-sm">
                    Đang cập nhật biểu đồ 7 ngày...
                  </div>
                )}
              </div>
            </div>

            {/* === 2 COLUMNS: TIẾN TRÌNH ĐƠN HÀNG & PHƯƠNG THỨC THANH TOÁN === */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Cột 1: Phễu Trạng Thái Đơn Hàng */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                      <ShoppingCart className="w-4 h-4 text-teal-600" />
                      Phân bổ & Tiến độ đơn hàng
                    </h3>
                    <button onClick={() => setActiveTab("ORDERS")} className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1">
                      Xem chi tiết <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-3.5">
                    {[
                      { label: "Chờ xử lý (Cần duyệt)", key: "pending", count: stats.ordersByStatus?.pending || 0, color: "bg-amber-500", text: "text-amber-700", bgLight: "bg-amber-50", border: "border-amber-100" },
                      { label: "Đang vận chuyển", key: "shipping", count: stats.ordersByStatus?.shipping || 0, color: "bg-blue-500", text: "text-blue-700", bgLight: "bg-blue-50", border: "border-blue-100" },
                      { label: "Giao thành công", key: "delivered", count: stats.ordersByStatus?.delivered || 0, color: "bg-emerald-500", text: "text-emerald-700", bgLight: "bg-emerald-50", border: "border-emerald-100" },
                      { label: "Đã hủy đơn", key: "cancelled", count: stats.ordersByStatus?.cancelled || 0, color: "bg-red-500", text: "text-red-700", bgLight: "bg-red-50", border: "border-red-100" }
                    ].map((item, i) => {
                      const pct = Math.round((item.count / totalOrdersForCalc) * 100);
                      return (
                        <div key={i} className={`p-3 rounded-xl border ${item.border} ${item.bgLight} flex items-center justify-between`}>
                          <div className="flex-1 pr-4">
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="text-xs font-bold text-slate-700">{item.label}</span>
                              <span className={`text-xs font-black ${item.text}`}>{item.count} đơn ({pct}%)</span>
                            </div>
                            <div className="w-full h-2 bg-white/80 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }}></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Cột 2: Phân Bổ Phương Thức & Trạng Thái Thanh Toán */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                      <QrCode className="w-4 h-4 text-indigo-600" />
                      Phân tích thanh toán & Dòng tiền
                    </h3>
                    <span className="text-xs font-bold text-slate-400">VietQR vs COD</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3.5">
                      <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-xs mb-1">
                        <QrCode className="w-3.5 h-3.5" /> Chuyển khoản QR
                      </div>
                      <p className="text-lg font-black text-indigo-950">{paymentStats.qrCount} đơn</p>
                      <p className="text-[11px] font-semibold text-indigo-700 mt-1">{formatVND(paymentStats.qrRevenue)}</p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                      <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs mb-1">
                        <Truck className="w-3.5 h-3.5" /> Thu hộ (COD)
                      </div>
                      <p className="text-lg font-black text-slate-900">{paymentStats.codCount} đơn</p>
                      <p className="text-[11px] font-semibold text-slate-600 mt-1">{formatVND(paymentStats.codRevenue)}</p>
                    </div>
                  </div>

                  {/* Trạng thái thu tiền */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                    <div className="flex justify-between items-center text-xs font-bold mb-2">
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã thu tiền: {paymentStats.paidCount} đơn
                      </span>
                      <span className="text-amber-700 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Chưa thu: {paymentStats.unpaidCount} đơn
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-amber-100 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${Math.round((paymentStats.paidCount / totalOrdersForCalc) * 100)}%` }}
                        title="Đã thanh toán"
                      ></div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 italic">
                      * Đơn hàng khi chuyển sang trạng thái "Đã giao" được hệ thống tự động đánh dấu "Đã thanh toán".
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* === TOP 5 SẢN PHẨM BÁN CHẠY === */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                    <Flame className="w-5 h-5 text-amber-500" />
                    Top 5 Sản phẩm bán chạy nhất
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Xếp hạng dựa trên số lượng sản phẩm đã bán ra qua các đơn hàng</p>
                </div>
                <button onClick={() => setActiveTab("PRODUCTS")} className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1">
                  Kho sản phẩm <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {stats.topSellingProducts && stats.topSellingProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
                  {stats.topSellingProducts.map((item: any, idx: number) => {
                    const rankMedals = [
                      { badge: "bg-amber-100 text-amber-800 border-amber-300", label: "🥇 Top 1" },
                      { badge: "bg-slate-100 text-slate-700 border-slate-300", label: "🥈 Top 2" },
                      { badge: "bg-orange-100 text-orange-800 border-orange-300", label: "🥉 Top 3" },
                      { badge: "bg-slate-50 text-slate-600 border-slate-200", label: `#${idx + 1}` },
                      { badge: "bg-slate-50 text-slate-600 border-slate-200", label: `#${idx + 1}` }
                    ];
                    const medal = rankMedals[idx] || rankMedals[3];

                    return (
                      <div key={idx} className="bg-slate-50/70 border border-slate-100 rounded-xl p-3.5 flex flex-col justify-between hover:border-teal-200 hover:bg-teal-50/20 transition-all">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${medal.badge}`}>
                              {medal.label}
                            </span>
                            <span className="text-xs font-black text-teal-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                              x{item.totalQty} đã bán
                            </span>
                          </div>
                          <div className="w-full h-24 bg-white rounded-lg border border-slate-100 overflow-hidden mb-2.5 flex items-center justify-center">
                            {item.image ? (
                              <img src={item.image} alt={item.productName} className="w-full h-full object-contain p-1" />
                            ) : (
                              <Package className="w-8 h-8 text-slate-300" />
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-slate-800 line-clamp-2" title={item.productName}>
                            {item.productName}
                          </h4>
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-semibold">Doanh số:</span>
                          <span className="font-black text-slate-800">{formatVND(item.totalRevenue)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm">
                  Chưa có dữ liệu sản phẩm bán ra.
                </div>
              )}
            </div>

            {/* === ĐƠN HÀNG GẦN ĐÂY VỚI THAO TÁC 1-CLICK === */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                    <Clock className="w-5 h-5 text-teal-600" />
                    Đơn hàng mới nhất & Thao tác nhanh
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Duyệt nhanh và cập nhật trạng thái đơn ngay tại màn hình tổng quan</p>
                </div>
                <button onClick={() => setActiveTab("ORDERS")} className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1">
                  Xem tất cả đơn hàng <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {stats.recentOrders && stats.recentOrders.length > 0 ? stats.recentOrders.map((order: any) => (
                  <div key={order.id} className="p-4 sm:px-6 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-black text-xs text-slate-800">#{order.id.slice(-8).toUpperCase()}</span>
                        <span className="text-xs font-bold text-slate-700">{order.customerName}</span>
                        <span className="text-[11px] text-slate-400 font-semibold">{order.customerPhone}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          order.paymentMethod === 'QR' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {order.paymentMethod === 'QR' ? 'VietQR' : 'COD'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          order.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {order.paymentStatus === 'PAID' ? '✓ Đã thanh toán' : '⏳ Chưa thanh toán'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {new Date(order.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} · {order.items?.length || 0} sản phẩm · {order.address}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-black text-teal-700">{formatVND(order.totalAmount)}</p>
                        <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                          order.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                          order.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700' :
                          order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {order.status === 'PENDING' ? 'Chờ xử lý' : order.status === 'DELIVERED' ? 'Đã giao' : order.status === 'CANCELLED' ? 'Đã hủy' : 'Đang giao'}
                        </span>
                      </div>

                      {/* Quick action buttons */}
                      <div className="flex items-center gap-1.5 ml-2">
                        {order.status === 'PENDING' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'SHIPPING')}
                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                            title="Chuyển sang trạng thái Đang giao"
                          >
                            <Truck className="w-3.5 h-3.5" /> Duyệt giao
                          </button>
                        )}
                        {order.status === 'SHIPPING' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                            title="Xác nhận Đã giao & Đã thanh toán"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Đã giao
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (typeof setSelectedOrderDetails === 'function') {
                              setSelectedOrderDetails(order);
                            } else {
                              setActiveTab("ORDERS");
                            }
                          }}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                          title="Xem chi tiết đơn hàng"
                        >
                          <Eye className="w-3.5 h-3.5" /> Chi tiết
                        </button>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="px-6 py-8 text-center text-slate-400 text-sm">Chưa có đơn hàng nào.</div>
                )}
              </div>
            </div>

            {/* === 2 COLUMNS: SẢN PHẨM SẮP HẾT HÀNG & ĐÁNH GIÁ GẦN ĐÂY === */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Sản phẩm sắp hết hàng */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Cảnh báo tồn kho thấp (Tồn ≤ 5)
                    </h3>
                    <button onClick={() => setActiveTab("PRODUCTS")} className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1">
                      Tất cả SP <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {stats.lowStockProducts && stats.lowStockProducts.length > 0 ? stats.lowStockProducts.map((prod: any) => (
                      <div key={prod.id} className="p-4 flex items-center justify-between hover:bg-amber-50/30 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100">
                            {(prod.image || (prod.images && prod.images[0])) ? (
                              <img src={prod.image || prod.images[0]} alt={prod.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-slate-300 m-auto mt-3" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate" title={prod.name}>{prod.name}</p>
                            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{formatVND(prod.price)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-black">
                            Còn {prod.stock}
                          </span>
                          <button
                            onClick={() => {
                              setActiveTab("PRODUCTS");
                              setTimeout(() => openProductModal(prod), 100);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                          >
                            Nhập thêm
                          </button>
                        </div>
                      </div>
                    )) : (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        Tất cả sản phẩm hiện đang có đủ tồn kho an toàn!
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Đánh giá mới nhất */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                      <MessageSquare className="w-4 h-4 text-teal-600" />
                      Đánh giá phản hồi gần nhất
                    </h3>
                    <button onClick={() => setActiveTab("REVIEWS")} className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1">
                      Xem tất cả <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {stats.recentReviews && stats.recentReviews.length > 0 ? stats.recentReviews.map((rev: any) => (
                      <div key={rev.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-800">{rev.user?.name || 'Khách hàng ẩn danh'}</p>
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} className={`w-3 h-3 ${rev.rating >= s ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-teal-700 font-bold mt-1">{rev.product?.name || 'Sản phẩm'}</p>
                        {rev.comment && <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{rev.comment}</p>}
                      </div>
                    )) : (
                      <div className="p-8 text-center text-slate-400 text-xs">Chưa có đánh giá nào gần đây.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case "CUSTOMERS":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Quản lý Khách hàng</h2>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Tên Khách Hàng</th>
                    <th className="px-6 py-4">Thông tin liên hệ</th>
                    <th className="px-6 py-4 text-center">Vai trò</th>
                    <th className="px-6 py-4 text-right">Ngày tham gia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.filter(c => filterSearch(c.name || c.email)).map(customer => (
                    <tr key={customer.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-bold text-slate-800">{customer.name}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-teal-700">{customer.email}</span>
                          <span className="text-xs text-slate-500">{customer.phone || 'Chưa cập nhật SĐT'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider ${customer.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                          {customer.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-xs font-medium text-slate-400">
                        {new Date(customer.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "ORDERS":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Quản lý Đơn hàng</h2>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">Mã Đơn / Ngày</th>
                    <th className="px-6 py-4">Khách hàng</th>
                    <th className="px-6 py-4">Tổng tiền (VNĐ)</th>
                    <th className="px-6 py-4">Thanh toán</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800 block truncate w-24" title={order.id}>{order.id}</span>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          <span className="font-semibold text-teal-700">{new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="mx-1">-</span>
                          <span>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800 block">{order.customerName}</span>
                        <span className="text-xs text-slate-500">{order.customerPhone}</span>
                      </td>
                      <td className="px-6 py-4 font-black text-teal-700">{formatVND(order.totalAmount)}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <span className={`px-2 py-1 inline-block text-center rounded text-[10px] font-bold uppercase w-fit ${order.paymentMethod === 'QR' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'}`}>
                            {order.paymentMethod === 'QR' ? 'Chuyển khoản' : 'Thu hộ COD'}
                          </span>
                          <button
                            onClick={() => updatePaymentStatus(order.id, order.paymentStatus === 'PAID' ? 'PENDING' : 'PAID')}
                            className={`px-2 py-1 inline-block text-center rounded text-[10px] font-bold uppercase w-fit transition-colors cursor-pointer ${order.paymentStatus === 'PAID' ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700' : 'bg-amber-100 hover:bg-amber-200 text-amber-700'}`}
                            title="Bấm để đổi trạng thái thanh toán"
                          >
                            {order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold outline-none cursor-pointer ${order.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                            order.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                            }`}
                        >
                          <option value="PENDING">Chờ xử lý</option>
                          <option value="SHIPPING">Đang giao</option>
                          <option value="DELIVERED">Đã giao</option>
                          <option value="CANCELLED">Đã hủy</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedOrderDetails(order)}
                          className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold rounded-lg inline-flex items-center gap-1 transition-colors border border-teal-200"
                        >
                          <Eye className="w-3.5 h-3.5" /> Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "REVIEWS":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Quản lý Đánh giá</h2>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                  <tr><th className="px-6 py-4">Khách hàng</th><th className="px-6 py-4">Sản phẩm</th><th className="px-6 py-4">Đánh giá</th><th className="px-6 py-4">Nội dung</th><th className="px-6 py-4 text-right">Thao tác</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reviews.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Chưa có đánh giá nào.</td></tr>
                  ) : (
                    reviews.map(rev => (
                      <tr key={rev.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-bold text-slate-800">{rev.user?.name || 'Ẩn danh'}</td>
                        <td className="px-6 py-4 text-teal-700 font-semibold">{rev.product?.name || 'SP đã xóa'}</td>
                        <td className="px-6 py-4 text-amber-500 font-bold flex items-center gap-1">
                          {rev.rating} <Star className="w-4 h-4 fill-amber-500" />
                        </td>
                        <td className="px-6 py-4 text-slate-600">{rev.comment || <span className="italic text-slate-400">Không có bình luận</span>}</td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => deleteReview(rev.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      default: return <div className="text-center mt-20 font-bold text-slate-400">Chọn chức năng bên menu trái.</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans relative">

      {toast.visible && (
        <div className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl animate-in slide-in-from-top-4 fade-in text-sm font-bold text-white ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />} {toast.message}
        </div>
      )}

      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col fixed h-full left-0 top-0 z-50">
        <div className="h-20 flex items-center px-6 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-black italic">LĐ</div>
            <div><h1 className="font-black text-white leading-tight">LAM ĐIỀN</h1><p className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">Admin</p></div>
          </div>
        </div>
        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setGlobalSearch(""); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === item.id ? "bg-teal-600 text-white shadow-lg" : "hover:bg-slate-800 text-slate-400 hover:text-white"}`}
              >
                <Icon className="w-4 h-4" />{item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="relative w-96">
            <input type="text" value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} placeholder="Tìm kiếm..." className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:border-teal-500 font-medium" />
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>
          <a href="/" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-sm flex items-center gap-2"><LogOut className="w-4 h-4" /> Về trang Shop</a>
        </header>

        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">{renderContent()}</div>
        </div>
      </main>

      {/* MODAL CATEGORY */}
      {isCatModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-base font-black text-slate-800 uppercase">{editingCategory ? "Cập nhật Danh mục" : "Thêm Danh mục mới"}</h2>
              <button onClick={() => setIsCatModalOpen(false)} className="p-1.5 hover:bg-slate-200 rounded-full"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCategorySubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Tên danh mục con</label>
                <input type="text" required value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value, slug: generateSlug(e.target.value) })} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-teal-600 font-semibold outline-none" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Gán vào Đầu mục (Header Menu)</label>
                <select
                  value={catForm.headerTab}
                  onChange={(e) => setCatForm({ ...catForm, headerTab: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl font-bold text-teal-700 bg-teal-50/30 outline-none"
                >
                  {HEADER_TABS.map(tab => <option key={tab} value={tab}>{tab}</option>)}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Hệ thống sẽ tự động xếp danh mục này vào Menu tương ứng.</p>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsCatModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 bg-slate-100 rounded-xl">Hủy</button>
                <button type="submit" disabled={isSubmittingCat} className="flex-[2] py-3 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl disabled:bg-teal-300 flex items-center justify-center gap-2">
                  {isSubmittingCat ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu dữ liệu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PRODUCT */}
      {isProdModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-base font-black text-slate-800 uppercase">{editingProduct ? "Cập nhật Sản phẩm" : "Thêm Sản phẩm mới"}</h2>
              <button onClick={() => setIsProdModalOpen(false)} className="p-1.5 hover:bg-slate-200 rounded-full"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleProductSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto grid grid-cols-2 gap-x-4 gap-y-1">

              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Hình ảnh sản phẩm</label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploadingImage} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer" />
                    {isUploadingImage && <p className="text-xs text-teal-600 mt-2 font-bold animate-pulse">Đang xử lý và tải ảnh lên mây...</p>}
                  </div>
                  <div className="w-20 h-20 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {prodForm.image ? (<img src={prodForm.image} alt="Preview" className="w-full h-full object-cover" />) : (<span className="text-[10px] text-slate-400 text-center font-bold">Chưa có<br />ảnh</span>)}
                  </div>
                </div>
              </div>

              <div className="col-span-2 mt-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Tên sản phẩm <span className="text-red-500">*</span></label>
                <input type="text" required value={prodForm.name} onChange={(e) => setProdForm({ ...prodForm, name: e.target.value, slug: generateSlug(e.target.value) })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none" />
              </div>
              <div className="col-span-2 mt-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Gán vào Danh mục con <span className="text-red-500">*</span></label>
                <select value={prodForm.categoryId} onChange={(e) => setProdForm({ ...prodForm, categoryId: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl font-bold text-teal-700 bg-teal-50/30 outline-none">
                  <option value="">-- Chọn danh mục --</option>
                  {categories.filter(c => c.parentId).map(c => <option key={c.id} value={c.id}>{c.parent?.name} {'>'} {c.name}</option>)}
                </select>
              </div>
              <div className="col-span-2 mt-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Các Size hỗ trợ</label>
                <input type="text" value={prodForm.sizes} onChange={(e) => setProdForm({ ...prodForm, sizes: e.target.value })} placeholder="VD: 39, 40, 41" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl font-semibold outline-none" />
              </div>

              <div className="mt-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Giá bán gốc <span className="text-red-500">*</span>
                  </label>
                  {prodForm.price && parseCurrency(prodForm.price) > 0 && (
                    <span className="text-[11px] font-black text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md">
                      {formatVND(parseCurrency(prodForm.price))}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="VD: 350.000"
                    value={prodForm.price}
                    onChange={(e) => {
                      const formatted = formatCurrencyInput(e.target.value);
                      setProdForm({ ...prodForm, price: formatted });
                    }}
                    className="w-full pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-teal-500 transition-colors"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 pointer-events-none">
                    ₫
                  </span>
                </div>
                {prodForm.price && parseCurrency(prodForm.price) > 0 && (
                  <p className="text-[10px] text-slate-400 italic mt-1 truncate">
                    {numberToWordsVN(parseCurrency(prodForm.price))}
                  </p>
                )}
              </div>

              <div className="mt-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-red-500 uppercase tracking-wider">
                    Giá Khuyến Mãi
                  </label>
                  {prodForm.discountPrice && parseCurrency(prodForm.discountPrice) > 0 && (
                    <span className="text-[11px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                      {formatVND(parseCurrency(prodForm.discountPrice))}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Để trống nếu không Sale"
                    value={prodForm.discountPrice}
                    onChange={(e) => {
                      const formatted = formatCurrencyInput(e.target.value);
                      setProdForm({ ...prodForm, discountPrice: formatted });
                    }}
                    className="w-full pl-4 pr-10 py-2.5 border border-red-200 rounded-xl font-bold text-red-600 outline-none focus:border-red-400 focus:bg-red-50/30 transition-colors"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-red-400 pointer-events-none">
                    ₫
                  </span>
                </div>
                {prodForm.discountPrice && parseCurrency(prodForm.discountPrice) > 0 ? (
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] text-slate-400 italic truncate">
                      {numberToWordsVN(parseCurrency(prodForm.discountPrice))}
                    </p>
                    {parseCurrency(prodForm.price) > 0 && parseCurrency(prodForm.discountPrice) < parseCurrency(prodForm.price) && (
                      <span className="text-[10px] font-bold text-emerald-600 ml-1 shrink-0 bg-emerald-50 px-1.5 py-0.5 rounded">
                        Giảm {Math.round(((parseCurrency(prodForm.price) - parseCurrency(prodForm.discountPrice)) / parseCurrency(prodForm.price)) * 100)}%
                      </span>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="mt-2 col-span-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Số lượng kho <span className="text-red-500">*</span></label>
                <input type="number" required value={prodForm.stock} onChange={(e) => setProdForm({ ...prodForm, stock: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl font-bold outline-none" />
              </div>

              <div className="col-span-2 mt-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Mô tả sản phẩm</label>
                <textarea
                  value={prodForm.description}
                  onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                  rows={3}
                  placeholder="Nhập giới thiệu, chất liệu, tính năng nổi bật..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl font-medium outline-none focus:border-teal-600 transition-colors"
                />
              </div>

              <div className="col-span-2 pt-4 flex gap-3">
                <button type="button" onClick={() => setIsProdModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 bg-slate-100 rounded-xl">Hủy</button>
                <button type="submit" disabled={isSubmittingProd} className="flex-[2] py-3 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 rounded-xl flex justify-center items-center gap-2">
                  {isSubmittingProd ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu dữ liệu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XEM CHI TIẾT ĐƠN HÀNG */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-black text-slate-800">
                    Chi tiết đơn hàng #{selectedOrderDetails.id?.slice(-8).toUpperCase()}
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${
                    selectedOrderDetails.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                    selectedOrderDetails.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700' :
                    selectedOrderDetails.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {selectedOrderDetails.status === 'PENDING' ? 'Chờ xử lý' :
                     selectedOrderDetails.status === 'DELIVERED' ? 'Đã giao' :
                     selectedOrderDetails.status === 'CANCELLED' ? 'Đã hủy' : 'Đang giao'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ngày đặt: {new Date(selectedOrderDetails.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Thông tin khách hàng & Giao hàng */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thông tin người nhận</h3>
                    {selectedOrderDetails.shippingDetails?.label && (
                      <span className="bg-white border border-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px]">
                        {selectedOrderDetails.shippingDetails.label}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="font-bold text-slate-800">{selectedOrderDetails.customerName}</p>
                    <p className="text-teal-700 font-semibold text-xs">{selectedOrderDetails.customerPhone}</p>
                    {selectedOrderDetails.customerEmail && (
                      <p className="text-slate-500 text-xs">{selectedOrderDetails.customerEmail}</p>
                    )}
                    <p className="text-slate-600 text-xs pt-1 border-t border-slate-200 mt-1">
                      <span className="font-semibold text-slate-700">Địa chỉ:</span> {selectedOrderDetails.address}
                    </p>
                    {selectedOrderDetails.note && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 mt-2">
                        <span className="font-bold flex items-center gap-1.5 text-amber-800">
                          <FileText className="w-3.5 h-3.5 text-amber-600"/> Ghi chú giao hàng:
                        </span>
                        <p className="mt-1 font-medium">{selectedOrderDetails.note}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thanh toán & Trạng thái</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Hình thức:</span>
                      <span className="font-bold text-slate-800">
                        {selectedOrderDetails.paymentMethod === 'QR' ? 'Chuyển khoản (VietQR)' : 'Thu hộ (COD)'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Thanh toán:</span>
                      <button
                        onClick={() => updatePaymentStatus(selectedOrderDetails.id, selectedOrderDetails.paymentStatus === 'PAID' ? 'PENDING' : 'PAID')}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase ${
                          selectedOrderDetails.paymentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                        title="Bấm để cập nhật trạng thái thanh toán"
                      >
                        {selectedOrderDetails.paymentStatus === 'PAID' ? '✓ Đã thanh toán' : '⏳ Chưa thanh toán'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                      <span className="text-slate-500">Tiến độ đơn:</span>
                      <select
                        value={selectedOrderDetails.status}
                        onChange={(e) => updateOrderStatus(selectedOrderDetails.id, e.target.value)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold outline-none cursor-pointer bg-white border border-slate-200 text-slate-800"
                      >
                        <option value="PENDING">Chờ xử lý</option>
                        <option value="SHIPPING">Đang giao</option>
                        <option value="DELIVERED">Đã giao</option>
                        <option value="CANCELLED">Đã hủy</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Danh sách sản phẩm */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Sản phẩm trong đơn ({selectedOrderDetails.items?.length || 0})
                </h3>
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Sản phẩm</th>
                        <th className="px-3 py-3 text-center">Size</th>
                        <th className="px-3 py-3 text-center">Màu sắc</th>
                        <th className="px-3 py-3 text-center">SL</th>
                        <th className="px-3 py-3 text-right">Đơn giá</th>
                        <th className="px-4 py-3 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrderDetails.items?.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-bold text-slate-800 flex items-center gap-2.5">
                            {item.image ? (
                              <img src={item.image} alt={item.productName} className="w-9 h-9 object-contain bg-white rounded-lg border border-slate-100 flex-shrink-0" />
                            ) : (
                              <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-400 flex-shrink-0">
                                SP
                              </div>
                            )}
                            <span className="truncate max-w-[180px]">{item.productName}</span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-bold uppercase text-[10px]">
                              {item.size || 'Free'}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            {item.color ? (
                              <span className="px-2.5 py-1 bg-teal-50 border border-teal-200 text-teal-800 font-bold rounded-lg text-[11px] inline-flex items-center gap-1">
                                {item.color}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center font-bold text-slate-700">x{item.quantity}</td>
                          <td className="px-3 py-3 text-right text-slate-500 font-medium">{formatVND(item.price)}</td>
                          <td className="px-4 py-3 text-right font-black text-teal-700">{formatVND(item.price * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tổng kết tiền */}
              <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-4 rounded-2xl flex justify-between items-center border border-teal-100">
                <div>
                  <span className="text-xs font-bold text-teal-900 uppercase tracking-wider block">Tổng giá trị đơn hàng</span>
                  <span className="text-[11px] text-teal-600">Đã bao gồm VAT & Miễn phí vận chuyển</span>
                </div>
                <span className="text-2xl font-black text-teal-800">{formatVND(selectedOrderDetails.totalAmount)}</span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
