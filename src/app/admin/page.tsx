"use client";

import { useState, useEffect } from "react";
import {
    LayoutDashboard, List, Package, ShoppingCart, Users, Star, Settings,
    Search, Bell, LogOut, Plus, Edit3, Trash2, Filter, MoreVertical,
    TrendingUp, DollarSign, Loader2, X, Eye, CheckCircle
} from "lucide-react";

const generateSlug = (text: string) => {
    return text.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
};

export default function AdminDashboardPage() {
    const [activeTab, setActiveTab] = useState("DASHBOARD");
    const [isLoading, setIsLoading] = useState(true);
    const [globalSearch, setGlobalSearch] = useState("");

    // --- CORE SYSTEM DATA STATES ---
    const [stats, setStats] = useState({ revenue: 0, orders: 0, customers: 0, fiveStarReviews: 0 });
    const [categories, setCategories] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);

    // --- MODAL & STATE QUẢN LÝ DANH MỤC ---
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [catForm, setCatForm] = useState({ name: "", slug: "", status: "ACTIVE" });

    // --- MODAL & STATE QUẢN LÝ SẢN PHẨM ---
    const [isProdModalOpen, setIsProdModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [prodForm, setProdForm] = useState({ name: "", slug: "", price: "", stock: "", categoryId: "", status: "ACTIVE", image: "" });

    // --- MODAL XEM CHI TIẾT ĐƠN HÀNG ---
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    const MENU_ITEMS = [
        { id: "DASHBOARD", label: "Tổng quan", icon: LayoutDashboard },
        { id: "CATEGORIES", label: "Danh mục", icon: List },
        { id: "PRODUCTS", label: "Sản phẩm", icon: Package },
        { id: "ORDERS", label: "Đơn hàng", icon: ShoppingCart },
        { id: "CUSTOMERS", label: "Khách hàng", icon: Users },
        { id: "REVIEWS", label: "Đánh giá", icon: Star },
        { id: "SETTINGS", label: "Cài đặt", icon: Settings },
    ];

    // Khởi chạy lấy dữ liệu theo sự thay đổi của tab điều hướng
    useEffect(() => {
        loadTabContextData();
    }, [activeTab]);

    const loadTabContextData = async () => {
        setIsLoading(true);
        try {
            // Luôn kéo danh mục về để phục vụ mapping và select option trong sản phẩm
            const catRes = await fetch('/api/admin/categories');
            const catData = await catRes.json();
            if (catRes.ok) setCategories(catData);

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

    const formatVND = (num: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
    };

    // ========================================================
    // 1. XỬ LÝ DANH MỤC (CATEGORIES CRUD)
    // ========================================================
    const openCategoryModal = (cat: any = null) => {
        if (cat) {
            setEditingCategory(cat);
            setCatForm({ name: cat.name, slug: cat.slug, status: cat.status });
        } else {
            setEditingCategory(null);
            setCatForm({ name: "", slug: "", status: "ACTIVE" });
        }
        setIsCatModalOpen(true);
    };

    const handleCategorySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingCategory ? `/api/admin/categories/${editingCategory.id}` : '/api/admin/categories';
        const method = editingCategory ? 'PATCH' : 'POST';
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(catForm)
        });
        if (res.ok) {
            setIsCatModalOpen(false);
            loadTabContextData();
        } else {
            const err = await res.json();
            alert(err.error || "Có lỗi xảy ra");
        }
    };

    const deleteCategory = async (id: string) => {
        if (!confirm("Xóa danh mục này?")) return;
        const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
        if (res.ok) loadTabContextData();
        else alert((await res.json()).error);
    };

    // ========================================================
    // 2. XỬ LÝ SẢN PHẨM (PRODUCTS CRUD)
    // ========================================================
    const openProductModal = (prod: any = null) => {
        if (prod) {
            setEditingProduct(prod);
            setProdForm({ name: prod.name, slug: prod.slug, price: String(prod.price), stock: String(prod.stock), categoryId: prod.categoryId, status: prod.status, image: prod.image || "" });
        } else {
            setEditingProduct(null);
            setProdForm({ name: "", slug: "", price: "", stock: "", categoryId: categories[0]?.id || "", status: "ACTIVE", image: "" });
        }
        setIsProdModalOpen(true);
    };

    const handleProductSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
        const method = editingProduct ? 'PATCH' : 'POST';
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(prodForm)
        });
        if (res.ok) {
            setIsProdModalOpen(false);
            loadTabContextData();
        } else {
            alert("Lỗi lưu trữ sản phẩm");
        }
    };

    const deleteProduct = async (id: string) => {
        if (!confirm("Bạn chắc chắn muốn gỡ sản phẩm này khỏi sàn?")) return;
        const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
        if (res.ok) loadTabContextData();
    };

    // ========================================================
    // 3. XỬ LÝ ĐƠN HÀNG (ORDERS STATUS HANDLING)
    // ========================================================
    const handleUpdateOrderStatus = async (orderId: string, status: string) => {
        const res = await fetch(`/api/admin/orders/${orderId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (res.ok) {
            loadTabContextData();
            if (selectedOrder) setSelectedOrder({ ...selectedOrder, status });
        }
    };

    // ========================================================
    // 4. XỬ LÝ ĐÁNH GIÁ (REVIEWS SYSTEM)
    // ========================================================
    const handleDeleteReview = async (id: string) => {
        if (!confirm("Xóa nội dung đánh giá không hợp lệ này?")) return;
        const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
        if (res.ok) loadTabContextData();
    };

    // --- RENDER GIAO DIỆN THEO TAB ---
    const renderContent = () => {
        if (isLoading) {
            return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>;
        }

        // Bộ lọc tìm kiếm Client-side kết hợp cho các bảng
        const filterSearch = (text: string) => text.toLowerCase().includes(globalSearch.toLowerCase());

        switch (activeTab) {
            case "DASHBOARD":
                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <h2 className="text-2xl font-bold text-slate-800">Tổng quan thống kê</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full flex items-center justify-center bg-teal-100 text-teal-600"><DollarSign className="w-6 h-6" /></div>
                                <div><p className="text-xs font-bold text-slate-400 uppercase">Doanh thu thật</p><h3 className="text-xl font-black text-slate-800 mt-0.5">{formatVND(stats.revenue)}</h3></div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full flex items-center justify-center bg-blue-100 text-blue-600"><ShoppingCart className="w-6 h-6" /></div>
                                <div><p className="text-xs font-bold text-slate-400 uppercase">Đơn chờ xử lý</p><h3 className="text-2xl font-black text-slate-800 mt-0.5">{stats.orders}</h3></div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full flex items-center justify-center bg-purple-100 text-purple-600"><Users className="w-6 h-6" /></div>
                                <div><p className="text-xs font-bold text-slate-400 uppercase">Khách hàng</p><h3 className="text-2xl font-black text-slate-800 mt-0.5">{stats.customers}</h3></div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full flex items-center justify-center bg-yellow-100 text-yellow-600"><Star className="w-6 h-6" /></div>
                                <div><p className="text-xs font-bold text-slate-400 uppercase">Đánh giá 5 sao</p><h3 className="text-2xl font-black text-slate-800 mt-0.5">{stats.fiveStarReviews}</h3></div>
                            </div>
                        </div>
                    </div>
                );

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
                                    <tr><th className="px-6 py-4">Tên danh mục</th><th className="px-6 py-4">Đường dẫn (Slug)</th><th className="px-6 py-4 text-center">Số sản phẩm</th><th className="px-6 py-4">Trạng thái</th><th className="px-6 py-4 text-right">Thao tác</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {categories.filter(c => filterSearch(c.name)).map(cat => (
                                        <tr key={cat.id} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-4 font-bold text-slate-800">{cat.name}</td>
                                            <td className="px-6 py-4 font-mono text-slate-500">/{cat.slug}</td>
                                            <td className="px-6 py-4 text-center font-black text-teal-600">{cat._count?.products || 0}</td>
                                            <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-md text-[10px] font-black ${cat.status === 'ACTIVE' ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>{cat.status}</span></td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => openCategoryModal(cat)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                                                <button onClick={() => deleteCategory(cat.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg ml-1"><Trash2 className="w-4 h-4" /></button>
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
                                    <tr><th className="px-6 py-4">Tên sản phẩm</th><th className="px-6 py-4">Danh mục</th><th className="px-6 py-4">Giá bán</th><th className="px-6 py-4 text-center">Tồn kho</th><th className="px-6 py-4">Trạng thái</th><th className="px-6 py-4 text-right">Thao tác</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {products.filter(p => filterSearch(p.name)).map(prod => (
                                        <tr key={prod.id} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-4 font-bold text-slate-800">{prod.name}</td>
                                            <td className="px-6 py-4 text-slate-500 font-semibold">{prod.category?.name}</td>
                                            <td className="px-6 py-4 font-bold text-slate-900">{formatVND(prod.price)}</td>
                                            <td className="px-6 py-4 text-center font-bold text-slate-700">{prod.stock}</td>
                                            <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-md text-[10px] font-black ${prod.stock > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{prod.stock > 0 ? "Còn hàng" : "Hết hàng"}</span></td>
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

            case "ORDERS":
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-slate-800">Theo dõi Đơn hàng</h2>
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                                    <tr><th className="px-6 py-4">Mã đơn hàng</th><th className="px-6 py-4">Khách hàng</th><th className="px-6 py-4">Tổng tiền</th><th className="px-6 py-4">Trạng thái</th><th className="px-6 py-4 text-right">Thao tác</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {orders.map(order => (
                                        <tr key={order.id} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-4 font-mono font-bold text-slate-900">{order.orderCode}</td>
                                            <td className="px-6 py-4 text-slate-600 font-semibold">{order.customer?.name}</td>
                                            <td className="px-6 py-4 font-bold text-teal-700">{formatVND(order.totalAmount)}</td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                                    className="text-xs font-bold border border-slate-200 rounded-lg p-1 bg-white outline-none"
                                                >
                                                    <option value="PENDING">Chờ xử lý</option>
                                                    <option value="SHIPPING">Đang giao</option>
                                                    <option value="COMPLETED">Hoàn thành</option>
                                                    <option value="CANCELLED">Đã hủy</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => setSelectedOrder(order)} className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg flex items-center gap-1 text-xs font-bold ml-auto"><Eye className="w-4 h-4" /> Chi tiết</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );

            case "CUSTOMERS":
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-slate-800">Thông tin Khách hàng</h2>
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                                    <tr><th className="px-6 py-4">Tên khách hàng</th><th className="px-6 py-4">Email</th><th className="px-6 py-4">Số điện thoại</th><th className="px-6 py-4 text-center">Đơn đã mua</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {customers.filter(c => filterSearch(c.name) || c.email.includes(globalSearch)).map(cust => (
                                        <tr key={cust.id} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-4 font-bold text-slate-800">{cust.name}</td>
                                            <td className="px-6 py-4 text-slate-500 font-medium">{cust.email}</td>
                                            <td className="px-6 py-4 text-slate-600 font-semibold">{cust.phone || "---"}</td>
                                            <td className="px-6 py-4 text-center font-black text-blue-600">{cust.orders?.length || 0}</td>
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
                        <h2 className="text-2xl font-bold text-slate-800">Đánh giá sản phẩm</h2>
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                                    <tr><th className="px-6 py-4">Sản phẩm</th><th className="px-6 py-4">Khách</th><th className="px-6 py-4">Sao</th><th className="px-6 py-4 w-1/3">Nội dung</th><th className="px-6 py-4 text-right">Thao tác</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {reviews.map(rev => (
                                        <tr key={rev.id} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-4 font-bold text-slate-800">{rev.product?.name}</td>
                                            <td className="px-6 py-4 text-slate-600 font-medium">{rev.customer?.name}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex text-yellow-400 font-bold items-center gap-0.5">
                                                    {rev.rating} <Star className="w-3.5 h-3.5 fill-yellow-400" />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 italic">"{rev.comment}"</td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => handleDeleteReview(rev.id)} className="text-xs font-bold text-red-600 hover:underline"><Trash2 className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                        <Settings className="w-12 h-12 animate-spin duration-1000 mb-2 opacity-30" />
                        <p className="text-sm font-semibold">Cơ sở dữ liệu cấu hình {activeTab} đã bảo mật an toàn.</p>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans">

            {/* SIDEBAR NAVIGATION */}
            <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col fixed h-full left-0 top-0 z-50">
                <div className="h-20 flex items-center px-6 bg-slate-950 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-black italic">LĐ</div>
                        <div>
                            <h1 className="font-black text-white leading-tight">LAM ĐIỀN</h1>
                            <p className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">Admin Panel</p>
                        </div>
                    </div>
                </div>
                <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
                    {MENU_ITEMS.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => { setActiveTab(item.id); setGlobalSearch(""); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === item.id ? "bg-teal-600 text-white shadow-lg" : "hover:bg-slate-800 text-slate-400 hover:text-white"
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>
            </aside>

            {/* MAIN CONTAINER */}
            <main className="flex-1 ml-64 flex flex-col min-h-screen">
                <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-40">
                    <div className="relative w-96">
                        <input
                            type="text"
                            value={globalSearch}
                            onChange={(e) => setGlobalSearch(e.target.value)}
                            placeholder="Tìm kiếm dữ liệu trong bảng..."
                            className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:border-teal-500 focus:bg-white font-medium"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold bg-teal-50 text-teal-700 px-3 py-1 rounded-lg">Super Admin v1.2</span>
                    </div>
                </header>

                <div className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">{renderContent()}</div>
                </div>
            </main>

            {/* ========================================================
          MODAL: THÊM / SỬA CATEGORY
         ======================================================== */}
            {isCatModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-base font-black text-slate-800 uppercase">{editingCategory ? "Cập nhật Danh mục" : "Thêm Danh mục mới"}</h2>
                            <button onClick={() => setIsCatModalOpen(false)} className="p-1.5 hover:bg-slate-200 rounded-full"><X className="w-4 h-4" /></button>
                        </div>
                        <form onSubmit={handleCategorySubmit} className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Tên danh mục</label>
                                <input type="text" required value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value, slug: generateSlug(e.target.value) })} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-teal-600 font-semibold text-slate-800 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Đường dẫn (Slug)</label>
                                <input type="text" required value={catForm.slug} onChange={(e) => setCatForm({ ...catForm, slug: generateSlug(e.target.value) })} className="w-full px-4 py-3 border border-slate-200 rounded-xl font-mono text-sm bg-slate-50 outline-none" />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsCatModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 bg-slate-100 rounded-xl">Hủy</button>
                                <button type="submit" className="flex-[2] py-3 text-sm font-bold text-white bg-teal-600 rounded-xl">Lưu dữ liệu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================
          MODAL: THÊM / SỬA SẢN PHẨM (PRODUCT)
         ======================================================== */}
            {isProdModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-base font-black text-slate-800 uppercase">{editingProduct ? "Cập nhật Sản phẩm" : "Thêm Sản phẩm mới"}</h2>
                            <button onClick={() => setIsProdModalOpen(false)} className="p-1.5 hover:bg-slate-200 rounded-full"><X className="w-4 h-4" /></button>
                        </div>
                        <form onSubmit={handleProductSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto grid grid-cols-2 gap-x-4 gap-y-1">
                            <div className="col-span-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Tên sản phẩm</label>
                                <input type="text" required value={prodForm.name} onChange={(e) => setProdForm({ ...prodForm, name: e.target.value, slug: generateSlug(e.target.value) })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none" />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Đường dẫn sản phẩm</label>
                                <input type="text" required value={prodForm.slug} onChange={(e) => setProdForm({ ...prodForm, slug: generateSlug(e.target.value) })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl font-mono text-xs bg-slate-50 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Giá bán (VND)</label>
                                <input type="number" required value={prodForm.price} onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Số lượng kho</label>
                                <input type="number" required value={prodForm.stock} onChange={(e) => setProdForm({ ...prodForm, stock: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none" />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Thuộc danh mục</label>
                                <select value={prodForm.categoryId} onChange={(e) => setProdForm({ ...prodForm, categoryId: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-700 outline-none bg-white">
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="col-span-2 pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsProdModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 bg-slate-100 rounded-xl">Hủy</button>
                                <button type="submit" className="flex-[2] py-3 text-sm font-bold text-white bg-teal-600 rounded-xl">Cập nhật sàn</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================
          MODAL: XEM CHI TIẾT ĐƠN HÀNG (ORDER SIDE PANEL)
         ======================================================== */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-end z-50">
                    <div className="bg-white h-screen w-full max-w-md shadow-2xl flex flex-col p-6 animate-in slide-in-from-right duration-300">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                            <div><h3 className="font-black text-lg text-slate-900">Chi tiết: {selectedOrder.orderCode}</h3><p className="text-xs text-slate-400 font-medium">Đặt lúc: {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</p></div>
                            <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto py-4 space-y-6">
                            {/* Khách hàng */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Thông tin giao hàng</h4>
                                <p className="text-sm font-bold text-slate-800">{selectedOrder.customer?.name}</p>
                                <p className="text-xs font-medium text-slate-600 mt-1">SĐT: {selectedOrder.customer?.phone || "N/A"}</p>
                                <p className="text-xs text-slate-500 mt-0.5">Địa chỉ: {selectedOrder.customer?.address || "N/A"}</p>
                            </div>
                            {/* Danh sách SP */}
                            <div>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Sản phẩm mua</h4>
                                <div className="divide-y divide-slate-100">
                                    {selectedOrder.items?.map((item: any) => (
                                        <div key={item.id} className="py-2.5 flex justify-between items-start text-sm">
                                            <div><p className="font-bold text-slate-800">{item.product?.name}</p><p className="text-xs text-slate-400 font-semibold">SL: x{item.quantity}</p></div>
                                            <span className="font-bold text-slate-900">{formatVND(item.price)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-slate-100 pt-4 bg-white space-y-4">
                            <div className="flex justify-between items-center"><span className="text-sm font-bold text-slate-500">Tổng thanh toán:</span><span className="text-xl font-black text-teal-700">{formatVND(selectedOrder.totalAmount)}</span></div>
                            <div className="flex gap-2">
                                {selectedOrder.status !== 'COMPLETED' && selectedOrder.status !== 'CANCELLED' && (
                                    <>
                                        <button onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'COMPLETED')} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1"><CheckCircle className="w-4 h-4" /> Hoàn thành đơn</button>
                                        <button onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'CANCELLED')} className="py-3 px-4 bg-red-50 text-red-600 font-bold rounded-xl text-xs hover:bg-red-100">Hủy đơn</button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}