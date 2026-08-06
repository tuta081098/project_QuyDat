"use client";

import { useState, useEffect } from "react";
import {
  LayoutDashboard, List, Package, ShoppingCart, Users, Star, Settings,
  Search, Bell, LogOut, Plus, Edit3, Trash2, Eye, CheckCircle, DollarSign, Loader2, X, CheckCircle2, AlertCircle
} from "lucide-react";

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
  const [customers, setCustomers] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // --- HỆ THỐNG TOAST THÔNG BÁO (THAY THẾ ALERT) ---
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error', visible: boolean }>({ message: "", type: "success", visible: false });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  // --- STATE CATEGORY ---
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [catForm, setCatForm] = useState({ name: "", slug: "", status: "ACTIVE", headerTab: "NAM" });

  // --- STATE PRODUCT ---
  const [isProdModalOpen, setIsProdModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [prodForm, setProdForm] = useState({ name: "", slug: "", price: "", discountPrice: "", stock: "", categoryId: "", status: "ACTIVE", image: "", sizes: "", description: "" });

  const MENU_ITEMS = [
    { id: "DASHBOARD", label: "Tổng quan", icon: LayoutDashboard },
    { id: "CATEGORIES", label: "Danh mục", icon: List },
    { id: "PRODUCTS", label: "Sản phẩm", icon: Package },
    { id: "ORDERS", label: "Đơn hàng", icon: ShoppingCart },
    { id: "CUSTOMERS", label: "Khách hàng", icon: Users },
    { id: "REVIEWS", label: "Đánh giá", icon: Star }
  ];

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

  const formatVND = (num: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);

  // --- LOGIC ORDERS ---
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus })
      });

      if (res.ok) {
        setOrders(orders.map((order: any) => order.id === orderId ? { ...order, status: newStatus } : order));
        showToast("Đã cập nhật trạng thái đơn hàng!", "success");
      } else {
        showToast("Lỗi khi cập nhật trạng thái.", "error");
      }
    } catch (error) {
      showToast("Lỗi kết nối máy chủ.", "error");
    }
  };

  // --- LOGIC CATEGORY ---
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

  // --- TẢI ẢNH LÊN CLOUDINARY ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'lamdien_shop'); // ĐIỀN ĐÚNG PRESET CỦA BẠN

    try {
      // THAY 'YOUR_CLOUD_NAME' bằng Cloud Name của bạn
      const res = await fetch('https://api.cloudinary.com/v1_1/qho0kb7k/image/upload', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (data.secure_url) {
        setProdForm({ ...prodForm, image: data.secure_url });
        showToast("Tải ảnh lên mây thành công!", "success");
      }
    } catch (error) {
      showToast("Lỗi khi tải ảnh lên server.", "error");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // --- LOGIC PRODUCT ---
  const openProductModal = (prod: any = null) => {
    if (prod) {
      setEditingProduct(prod);
      setProdForm({
        name: prod.name,
        slug: prod.slug,
        price: String(prod.price),
        discountPrice: prod.discountPrice ? String(prod.discountPrice) : "", 
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
    const sizesArray = prodForm.sizes.split(',').map(s => s.trim()).filter(Boolean);
    const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
    const method = editingProduct ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ...prodForm, 
        sizes: sizesArray,
        price: Number(prodForm.price),
        discountPrice: prodForm.discountPrice ? Number(prodForm.discountPrice) : null,
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
                      <td className="px-6 py-4"><img src={prod.image || "https://via.placeholder.com/50"} alt={prod.name} className="w-12 h-12 object-contain bg-slate-50 rounded-lg"/></td>
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

      case "DASHBOARD":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Tổng quan hệ thống</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: "Doanh thu", value: formatVND(stats.revenue || 0), icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Đơn hàng", value: stats.orders || 0, icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Khách hàng", value: stats.customers || 0, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
                { label: "SP Hết hàng", value: stats.outOfStockProducts || 0, icon: Package, color: "text-red-600", bg: "bg-red-50" }
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div><p className="text-sm font-bold text-slate-400">{stat.label}</p><h3 className="text-2xl font-black text-slate-800">{stat.value}</h3></div>
                  </div>
                );
              })}
            </div>
          </div>
        );

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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800 block truncate w-24" title={order.id}>{order.id}</span>
                        <span className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
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
                          <span className={`px-2 py-1 inline-block text-center rounded text-[10px] font-bold uppercase w-fit ${order.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                          </span>
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
                  <tr><th className="px-6 py-4">Khách hàng</th><th className="px-6 py-4">Sản phẩm</th><th className="px-6 py-4">Đánh giá</th><th className="px-6 py-4">Nội dung</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reviews.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">Chưa có đánh giá nào.</td></tr>
                  ) : (
                    reviews.map(rev => (
                      <tr key={rev.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-bold text-slate-800">{rev.user?.name || 'Ẩn danh'}</td>
                        <td className="px-6 py-4 text-teal-700 font-semibold">{rev.product?.name || 'SP đã xóa'}</td>
                        <td className="px-6 py-4 text-amber-500 font-bold flex items-center gap-1">
                          {rev.rating} <Star className="w-4 h-4 fill-amber-500" />
                        </td>
                        <td className="px-6 py-4 text-slate-600">{rev.comment || <span className="italic text-slate-400">Không có bình luận</span>}</td>
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
      
      {/* THÔNG BÁO (TOAST) TỐI ƯU Z-INDEX ĐỂ KHÔNG BỊ LẤP */}
      {toast.visible && (
        <div className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl animate-in slide-in-from-top-4 fade-in text-sm font-bold text-white ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5"/> : <AlertCircle className="w-5 h-5"/>} {toast.message}
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
          <a href="/shop-lam-dien" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-sm flex items-center gap-2"><LogOut className="w-4 h-4"/> Về trang Shop</a>
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
                <button type="submit" className="flex-[2] py-3 text-sm font-bold text-white bg-teal-600 rounded-xl">Lưu dữ liệu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PRODUCT THÊM UPLOAD ẢNH CLOUDINARY */}
      {isProdModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-base font-black text-slate-800 uppercase">{editingProduct ? "Cập nhật Sản phẩm" : "Thêm Sản phẩm mới"}</h2>
              <button onClick={() => setIsProdModalOpen(false)} className="p-1.5 hover:bg-slate-200 rounded-full"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleProductSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto grid grid-cols-2 gap-x-4 gap-y-1">
              
              {/* UPLOAD HÌNH ẢNH SẢN PHẨM */}
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Hình ảnh sản phẩm</label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploadingImage} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer" />
                    {isUploadingImage && <p className="text-xs text-teal-600 mt-2 font-bold animate-pulse">Đang xử lý và tải ảnh lên mây...</p>}
                  </div>
                  <div className="w-20 h-20 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {prodForm.image ? ( <img src={prodForm.image} alt="Preview" className="w-full h-full object-cover" /> ) : ( <span className="text-[10px] text-slate-400 text-center font-bold">Chưa có<br/>ảnh</span> )}
                  </div>
                </div>
              </div>

              <div className="col-span-2 mt-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Tên sản phẩm</label>
                <input type="text" required value={prodForm.name} onChange={(e) => setProdForm({ ...prodForm, name: e.target.value, slug: generateSlug(e.target.value) })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none" />
              </div>
              <div className="col-span-2 mt-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Gán vào Danh mục con</label>
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
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Giá bán gốc (VND)</label>
                <input type="number" required value={prodForm.price} onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl font-bold outline-none" />
              </div>

              <div className="mt-2">
                <label className="text-xs font-bold text-red-400 uppercase tracking-wider block mb-1">Giá Khuyến Mãi (VND)</label>
                <input type="number" value={prodForm.discountPrice} onChange={(e) => setProdForm({ ...prodForm, discountPrice: e.target.value })} placeholder="Để trống nếu không Sale" className="w-full px-4 py-2.5 border border-red-200 rounded-xl font-bold text-red-600 outline-none focus:border-red-400 focus:bg-red-50/30 transition-colors" />
              </div>

              <div className="mt-2 col-span-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Số lượng kho</label>
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
                <button type="submit" className="flex-[2] py-3 text-sm font-bold text-white bg-teal-600 rounded-xl">Lưu dữ liệu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}