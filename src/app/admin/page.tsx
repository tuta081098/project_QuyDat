"use client";

import { useState, useEffect } from "react";
import {
  LayoutDashboard, List, Package, ShoppingCart, Users, Star, Settings,
  Search, Bell, LogOut, Plus, Edit3, Trash2, Eye, CheckCircle, DollarSign, Loader2, X, CheckCircle2, AlertCircle,
  TrendingUp, Clock, AlertTriangle, ChevronRight, MessageSquare, Palette, MapPin, FileText
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
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");

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
  const [prodForm, setProdForm] = useState({ name: "", slug: "", categoryId: "", status: "ACTIVE", image: "", images: [] as string[], sizes: "", description: "" });

  // STATE BIẾN THỂ MÀU SẮC
  const COMMON_SIZES = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];
  const DEFAULT_VARIANT = { colorName: "", colorCode: "#000000", price: "", discountPrice: "", stock: "", image: "", sizes: "", sizeStocks: {} };
  const [colorVariants, setColorVariants] = useState<any[]>([{ ...DEFAULT_VARIANT }]);
  const [isUploadingVariantImage, setIsUploadingVariantImage] = useState<number | null>(null);

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

  const formatVND = (num: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus })
      });

      if (res.ok) {
        setOrders(orders.map((order: any) => order.id === orderId ? { ...order, status: newStatus } : order));
        setSelectedOrderDetails((prev: any) => prev && prev.id === orderId ? { ...prev, status: newStatus } : prev);
        showToast("Đã cập nhật trạng thái đơn hàng!", "success");
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
    setIsSubmittingCat(true); // BẬT LOADING

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
      setIsSubmittingCat(false); // TẮT LOADING
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

  const handleMultipleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const uploadUrl = process.env.NEXT_PUBLIC_CLOUDINARY_URL;
    if (!uploadUrl) {
      showToast("Chưa cấu hình NEXT_PUBLIC_CLOUDINARY_URL trong biến môi trường.", "error");
      return;
    }

    setIsUploadingImage(true);
    setUploadProgressText(`Đang chuẩn bị tải ${files.length} ảnh lên mây...`);

    const newUploadedUrls: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgressText(`Đang tải ảnh ${i + 1}/${files.length}...`);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'lamdien_shop');
        const res = await fetch(uploadUrl, { method: 'POST', body: formData });
        const data = await res.json();
        if (data.secure_url) {
          newUploadedUrls.push(data.secure_url);
        }
      }

      if (newUploadedUrls.length > 0) {
        setProdForm(prev => {
          const currentImages = Array.isArray(prev.images) ? [...prev.images] : (prev.image ? [prev.image] : []);
          const merged = [...currentImages, ...newUploadedUrls];
          return {
            ...prev,
            images: merged,
            image: prev.image || merged[0] || ""
          };
        });
        showToast(`Đã tải lên thành công ${newUploadedUrls.length} ảnh!`, "success");
      }
    } catch (error) {
      showToast("Lỗi khi tải ảnh lên server.", "error");
    } finally {
      setIsUploadingImage(false);
      setUploadProgressText("");
      e.target.value = "";
    }
  };

  // Đặt 1 ảnh làm ảnh chính đại diện
  const setAsPrimaryImage = (imgUrl: string) => {
    setProdForm(prev => {
      const currentImages = Array.isArray(prev.images) ? [...prev.images] : (prev.image ? [prev.image] : []);
      const filtered = currentImages.filter(url => url !== imgUrl);
      const reordered = [imgUrl, ...filtered];
      return {
        ...prev,
        images: reordered,
        image: imgUrl
      };
    });
    showToast("Đã đặt làm ảnh chính!", "success");
  };

  // Xóa 1 ảnh khỏi danh sách ảnh chung
  const removeProductImage = (imgUrl: string) => {
    setProdForm(prev => {
      const currentImages = Array.isArray(prev.images) ? [...prev.images] : (prev.image ? [prev.image] : []);
      const filtered = currentImages.filter(url => url !== imgUrl);
      return {
        ...prev,
        images: filtered,
        image: prev.image === imgUrl ? (filtered[0] || "") : prev.image
      };
    });
  };

  const openProductModal = (prod: any = null) => {
    if (prod) {
      setEditingProduct(prod);
      const existingImages = (prod.images && Array.isArray(prod.images) && prod.images.length > 0)
        ? prod.images
        : (prod.image ? [prod.image] : []);

      setProdForm({
        name: prod.name,
        slug: prod.slug,
        categoryId: prod.categoryId,
        status: prod.status,
        image: prod.image || existingImages[0] || "",
        images: existingImages,
        sizes: prod.sizes ? prod.sizes.join(', ') : "",
        description: prod.description || ""
      });
      // Load biến thể màu từ DB (hoặc tạo mặc định từ dữ liệu cũ)
      if (prod.colorVariants && Array.isArray(prod.colorVariants) && prod.colorVariants.length > 0) {
        setColorVariants(prod.colorVariants.map((v: any) => ({
          colorName: v.colorName || "",
          colorCode: v.colorCode || "#000000",
          price: String(v.price || ""),
          discountPrice: v.discountPrice ? String(v.discountPrice) : "",
          stock: String(v.stock || ""),
          image: v.image || "",
          sizes: Array.isArray(v.sizes) ? v.sizes.join(', ') : (v.sizes || (prod.sizes ? prod.sizes.join(', ') : "")),
          sizeStocks: (v.sizeStocks && typeof v.sizeStocks === 'object') ? { ...v.sizeStocks } : {}
        })));
      } else {
        // Sản phẩm cũ chưa có biến thể → tạo 1 biến thể mặc định từ dữ liệu cũ
        setColorVariants([{
          colorName: "Mặc định",
          colorCode: "#000000",
          price: String(prod.price || ""),
          discountPrice: prod.discountPrice ? String(prod.discountPrice) : "",
          stock: String(prod.stock || ""),
          image: "",
          sizes: prod.sizes ? prod.sizes.join(', ') : "",
          sizeStocks: {}
        }]);
      }
    } else {
      setEditingProduct(null);
      setProdForm({
        name: "", slug: "",
        categoryId: categories.filter(c => c.parentId)[0]?.id || "",
        status: "ACTIVE", image: "", images: [], sizes: "", description: ""
      });
      setColorVariants([{ ...DEFAULT_VARIANT }]);
    }
    setIsProdModalOpen(true);
  };

  // Helper: Upload ảnh cho biến thể
  const handleVariantImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingVariantImage(index);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'lamdien_shop');
    const uploadUrl = process.env.NEXT_PUBLIC_CLOUDINARY_URL;
    if (!uploadUrl) { showToast("Chưa cấu hình Cloudinary URL", "error"); setIsUploadingVariantImage(null); return; }
    try {
      const res = await fetch(uploadUrl, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.secure_url) {
        const updated = [...colorVariants];
        updated[index] = { ...updated[index], image: data.secure_url };
        setColorVariants(updated);
        showToast("Tải ảnh biến thể thành công!", "success");
      }
    } catch { showToast("Lỗi tải ảnh biến thể", "error"); }
    finally { setIsUploadingVariantImage(null); }
  };

  // Helper: Cập nhật giá trị biến thể
  const updateVariant = (index: number, field: string, value: string) => {
    const updated = [...colorVariants];
    updated[index] = { ...updated[index], [field]: value };

    // Nếu người dùng gõ vào ô sizes, tự động đồng bộ sizeStocks và tính tổng kho
    if (field === 'sizes') {
      const parsedSizes = value.split(',').map((s: string) => s.trim()).filter(Boolean);
      const currentStocks = { ...(updated[index].sizeStocks || {}) };
      Object.keys(currentStocks).forEach(sz => {
        if (!parsedSizes.includes(sz)) delete currentStocks[sz];
      });
      parsedSizes.forEach(sz => {
        if (currentStocks[sz] === undefined) currentStocks[sz] = "";
      });
      updated[index].sizeStocks = currentStocks;
      if (parsedSizes.length > 0) {
        const total = Object.values(currentStocks).reduce((sum: number, v: any) => sum + (Number(v) || 0), 0);
        updated[index].stock = String(total);
      }
    }

    setColorVariants(updated);
  };

  // Helper: Bật/tắt nhanh 1 size cho biến thể màu
  const toggleVariantSize = (index: number, sizeToToggle: string) => {
    const currentSizes = colorVariants[index].sizes
      ? (typeof colorVariants[index].sizes === 'string'
          ? colorVariants[index].sizes.split(',').map((s: string) => s.trim()).filter(Boolean)
          : (Array.isArray(colorVariants[index].sizes) ? colorVariants[index].sizes : []))
      : [];
    let newSizes: string[];
    const updated = [...colorVariants];
    const currentSizeStocks = { ...(updated[index].sizeStocks || {}) };

    if (currentSizes.includes(sizeToToggle)) {
      newSizes = currentSizes.filter((s: string) => s !== sizeToToggle);
      delete currentSizeStocks[sizeToToggle];
    } else {
      newSizes = [...currentSizes, sizeToToggle].sort((a: string, b: string) => {
        const numA = Number(a);
        const numB = Number(b);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.localeCompare(b);
      });
      if (currentSizeStocks[sizeToToggle] === undefined) {
        currentSizeStocks[sizeToToggle] = "";
      }
    }
    updated[index].sizes = newSizes.join(', ');
    updated[index].sizeStocks = currentSizeStocks;
    if (newSizes.length > 0) {
      const total = Object.values(currentSizeStocks).reduce((sum: number, v: any) => sum + (Number(v) || 0), 0);
      updated[index].stock = String(total);
    }
    setColorVariants(updated);
  };

  // Helper: Cập nhật số lượng cho 1 size cụ thể
  const updateVariantSizeStock = (variantIndex: number, size: string, value: string) => {
    const updated = [...colorVariants];
    const currentSizeStocks = { ...(updated[variantIndex].sizeStocks || {}) };
    currentSizeStocks[size] = value;
    updated[variantIndex].sizeStocks = currentSizeStocks;

    // Tự động tính tổng kho từ các size
    const total = Object.values(currentSizeStocks).reduce((sum: number, v: any) => sum + (Number(v) || 0), 0);
    updated[variantIndex].stock = String(total);
    setColorVariants(updated);
  };

  // Helper: Gán nhanh số lượng cho toàn bộ size của biến thể
  const applyStockToAllSizes = (variantIndex: number, quickStock: number) => {
    const updated = [...colorVariants];
    const variant = updated[variantIndex];
    const currentSizes = variant.sizes
      ? (typeof variant.sizes === 'string'
          ? variant.sizes.split(',').map((s: string) => s.trim()).filter(Boolean)
          : (Array.isArray(variant.sizes) ? variant.sizes : []))
      : [];
    if (currentSizes.length === 0) return;

    const newSizeStocks: Record<string, string> = {};
    currentSizes.forEach((sz: string) => {
      newSizeStocks[sz] = String(quickStock);
    });
    variant.sizeStocks = newSizeStocks;
    variant.stock = String(quickStock * currentSizes.length);
    setColorVariants(updated);
  };

  const addVariant = () => setColorVariants([...colorVariants, { ...DEFAULT_VARIANT, sizes: prodForm.sizes || "" }]);
  const removeVariant = (index: number) => {
    if (colorVariants.length <= 1) { showToast("Cần ít nhất 1 biến thể màu!", "error"); return; }
    setColorVariants(colorVariants.filter((_, i) => i !== index));
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate biến thể
    for (const v of colorVariants) {
      if (!v.colorName.trim()) { showToast("Vui lòng nhập tên màu cho tất cả biến thể!", "error"); return; }
      if (!v.price || Number(v.price) <= 0) { showToast(`Vui lòng nhập giá hợp lệ cho màu "${v.colorName}"!`, "error"); return; }
      if (v.stock === "" || Number(v.stock) < 0) { showToast(`Vui lòng nhập số lượng hợp lệ cho màu "${v.colorName}"!`, "error"); return; }
    }

    setIsSubmittingProd(true);

    try {
      const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
      const method = editingProduct ? 'PATCH' : 'POST';

      // Chuyển đổi biến thể sang đúng kiểu number & phân tách mảng sizes & sizeStocks
      const variantsData = colorVariants.map(v => {
        const variantSizes = typeof v.sizes === 'string'
          ? v.sizes.split(',').map((s: string) => s.trim()).filter(Boolean)
          : (Array.isArray(v.sizes) ? v.sizes : []);

        const cleanedSizeStocks: Record<string, number> = {};
        if (variantSizes.length > 0) {
          variantSizes.forEach((sz: string) => {
            cleanedSizeStocks[sz] = Number(v.sizeStocks?.[sz]) || 0;
          });
        }

        const variantTotalStock = variantSizes.length > 0
          ? Object.values(cleanedSizeStocks).reduce((sum: number, s: number) => sum + s, 0)
          : (Number(v.stock) || 0);

        return {
          colorName: v.colorName.trim(),
          colorCode: v.colorCode,
          price: Number(v.price),
          discountPrice: v.discountPrice ? Number(v.discountPrice) : null,
          stock: variantTotalStock,
          image: v.image || "",
          sizes: variantSizes,
          sizeStocks: cleanedSizeStocks
        };
      });

      // Tổng hợp sizes từ tất cả màu
      const allVariantSizes = Array.from(new Set(variantsData.flatMap(v => v.sizes)));
      const finalSizes = allVariantSizes.length > 0
        ? allVariantSizes
        : prodForm.sizes.split(',').map(s => s.trim()).filter(Boolean);

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...prodForm,
          image: prodForm.images?.[0] || prodForm.image || "",
          images: prodForm.images || [],
          sizes: finalSizes,
          colorVariants: variantsData
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
                    <th className="px-6 py-4">Màu sắc</th>
                    <th className="px-6 py-4">Giá bán</th>
                    <th className="px-6 py-4 text-center">Tồn kho</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.filter(p => filterSearch(p.name)).map(prod => {
                    const variants = (prod.colorVariants && Array.isArray(prod.colorVariants)) ? prod.colorVariants as any[] : [];
                    const firstVariant = variants[0];
                    const displayPrice = firstVariant?.price || prod.price;
                    const displayDiscount = firstVariant?.discountPrice || prod.discountPrice;
                    return (
                      <tr key={prod.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4">
                          <div className="relative w-12 h-12">
                            <img src={(prod.images && prod.images[0]) || prod.image || "https://via.placeholder.com/50"} alt={prod.name} className="w-12 h-12 object-contain bg-slate-50 rounded-xl border border-slate-100" />
                            {prod.images && prod.images.length > 1 && (
                              <span className="absolute -bottom-1 -right-1 bg-slate-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm leading-none border border-white">
                                +{prod.images.length - 1}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800">{prod.name}</td>
                        <td className="px-6 py-4 text-slate-500 font-semibold">{prod.category?.name}</td>
                        <td className="px-6 py-4">
                          {variants.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 items-center">
                              {variants.map((v: any, i: number) => {
                                const vSizesStr = (() => {
                                  if (v.sizeStocks && typeof v.sizeStocks === 'object' && Object.keys(v.sizeStocks).length > 0) {
                                    return ' - ' + Object.entries(v.sizeStocks).map(([sz, qty]) => `${sz}(${qty})`).join(', ');
                                  }
                                  if (v.sizes && (Array.isArray(v.sizes) ? v.sizes.length > 0 : v.sizes.trim())) {
                                    return ` - Size: ${Array.isArray(v.sizes) ? v.sizes.join(', ') : v.sizes}`;
                                  }
                                  return '';
                                })();
                                return (
                                  <div key={i} className="group relative">
                                    <div
                                      className="w-6 h-6 rounded-full border-2 border-white shadow-sm cursor-default transition-transform hover:scale-125"
                                      style={{ backgroundColor: v.colorCode || '#ccc' }}
                                      title={`${v.colorName}: ${formatVND(v.price)} - Tổng kho: ${v.stock}${vSizesStr}`}
                                    />
                                  </div>
                                );
                              })}
                              <span className="text-[10px] text-slate-400 font-bold ml-1">{variants.length} màu</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {displayDiscount && displayDiscount > 0 ? (
                            <div className="flex flex-col">
                              <span className="font-black text-red-600">{formatVND(displayDiscount)}</span>
                              <span className="text-xs text-slate-400 line-through font-semibold">{formatVND(displayPrice)}</span>
                            </div>
                          ) : (
                            <span className="font-bold text-slate-900">{formatVND(displayPrice)}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-700">{prod.stock}</td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => openProductModal(prod)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                          <button onClick={() => deleteProduct(prod.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg ml-1"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "DASHBOARD":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800">Tổng quan hệ thống</h2>
              <p className="text-sm font-semibold text-slate-400">{new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            {/* === STAT CARDS === */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { label: "Doanh thu (Đã giao)", value: formatVND(stats.revenue || 0), sub: `Hôm nay: ${formatVND(stats.todayRevenue || 0)}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-100" },
                { label: "Tổng Đơn hàng", value: stats.orders || 0, sub: `${stats.ordersByStatus?.pending || 0} đang chờ xử lý`, icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-50", ring: "ring-blue-100" },
                { label: "Khách hàng", value: stats.customers || 0, sub: `${stats.reviewsCount || 0} đánh giá`, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50", ring: "ring-indigo-100" },
                { label: "SP Hết hàng", value: stats.outOfStockProducts || 0, sub: `${stats.productsCount || 0} sản phẩm`, icon: Package, color: "text-red-600", bg: "bg-red-50", ring: "ring-red-100" }
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={idx} className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ring-1 ${stat.ring}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800">{stat.value}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{stat.label}</p>
                    {stat.sub && <p className="text-[11px] font-semibold text-slate-500 mt-2 flex items-center gap-1"><TrendingUp className="w-3 h-3" />{stat.sub}</p>}
                  </div>
                );
              })}
            </div>

            {/* === TRẠNG THÁI ĐƠN HÀNG + QUICK ACTIONS === */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Order status breakdown */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-teal-600" /> Phân bổ trạng thái đơn hàng</h3>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Chờ xử lý", value: stats.ordersByStatus?.pending || 0, color: "bg-amber-500", textColor: "text-amber-700", bgLight: "bg-amber-50" },
                    { label: "Đang giao", value: stats.ordersByStatus?.shipping || 0, color: "bg-blue-500", textColor: "text-blue-700", bgLight: "bg-blue-50" },
                    { label: "Đã giao", value: stats.ordersByStatus?.delivered || 0, color: "bg-emerald-500", textColor: "text-emerald-700", bgLight: "bg-emerald-50" },
                    { label: "Đã hủy", value: stats.ordersByStatus?.cancelled || 0, color: "bg-red-500", textColor: "text-red-700", bgLight: "bg-red-50" }
                  ].map((s, i) => (
                    <div key={i} className={`${s.bgLight} rounded-xl p-4 text-center`}>
                      <p className={`text-2xl font-black ${s.textColor}`}>{s.value}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">{s.label}</p>
                      <div className={`h-1.5 rounded-full mt-3 ${s.color} opacity-30`}>
                        <div className={`h-full rounded-full ${s.color}`} style={{ width: `${stats.orders ? Math.round((s.value / stats.orders) * 100) : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2"><Settings className="w-4 h-4 text-teal-600" /> Truy cập nhanh</h3>
                <div className="space-y-2.5">
                  {[
                    { label: "Thêm sản phẩm mới", icon: Plus, action: () => { setActiveTab("PRODUCTS"); setTimeout(() => openProductModal(), 100); } },
                    { label: "Quản lý đơn hàng", icon: ShoppingCart, action: () => setActiveTab("ORDERS") },
                    { label: "Xem đánh giá", icon: Star, action: () => setActiveTab("REVIEWS") },
                    { label: "Quản lý danh mục", icon: List, action: () => setActiveTab("CATEGORIES") },
                    { label: "Danh sách khách hàng", icon: Users, action: () => setActiveTab("CUSTOMERS") }
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <button key={i} onClick={item.action} className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-teal-50 rounded-xl transition-colors group">
                        <span className="flex items-center gap-3 text-sm font-bold text-slate-700 group-hover:text-teal-700"><Icon className="w-4 h-4 text-slate-400 group-hover:text-teal-600" />{item.label}</span>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-teal-500" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* === RECENT ORDERS + RECENT REVIEWS === */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Recent Orders */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2"><Clock className="w-4 h-4 text-teal-600" /> Đơn hàng gần đây</h3>
                  <button onClick={() => setActiveTab("ORDERS")} className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1">Xem tất cả <ChevronRight className="w-3 h-3" /></button>
                </div>
                <div className="divide-y divide-slate-50">
                  {stats.recentOrders && stats.recentOrders.length > 0 ? stats.recentOrders.map((order: any) => (
                    <div key={order.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{order.customerName}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{new Date(order.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} · {order.items?.length || 0} sản phẩm</p>
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        <p className="text-sm font-black text-teal-700">{formatVND(order.totalAmount)}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                          order.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                          order.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700' :
                          order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>{order.status === 'PENDING' ? 'Chờ xử lý' : order.status === 'DELIVERED' ? 'Đã giao' : order.status === 'CANCELLED' ? 'Đã hủy' : 'Đang giao'}</span>
                      </div>
                    </div>
                  )) : (
                    <div className="px-5 py-8 text-center text-slate-400 text-sm">Chưa có đơn hàng nào.</div>
                  )}
                </div>
              </div>

              {/* Recent Reviews */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-teal-600" /> Đánh giá gần đây</h3>
                  <button onClick={() => setActiveTab("REVIEWS")} className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1">Xem tất cả <ChevronRight className="w-3 h-3" /></button>
                </div>
                <div className="divide-y divide-slate-50">
                  {stats.recentReviews && stats.recentReviews.length > 0 ? stats.recentReviews.map((rev: any) => (
                    <div key={rev.id} className="px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-800">{rev.user?.name || 'Ẩn danh'}</p>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${rev.rating >= s ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />)}
                        </div>
                      </div>
                      <p className="text-xs text-teal-700 font-semibold mt-0.5">{rev.product?.name || 'SP đã xóa'}</p>
                      {rev.comment && <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{rev.comment}</p>}
                    </div>
                  )) : (
                    <div className="px-5 py-8 text-center text-slate-400 text-sm">Chưa có đánh giá nào.</div>
                  )}
                </div>
              </div>
            </div>

            {/* === CẢNH BÁO SẮP HẾT HÀNG === */}
            {stats.lowStockProducts && stats.lowStockProducts.length > 0 && (
              <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-amber-100 bg-amber-50/50 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <h3 className="font-bold text-amber-800">Sản phẩm sắp hết hàng</h3>
                </div>
                <div className="divide-y divide-slate-50">
                  {stats.lowStockProducts.map((prod: any) => (
                    <div key={prod.id} className="px-5 py-3 flex items-center justify-between hover:bg-amber-50/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                          {(prod.image || (prod.images && prod.images[0])) ? (
                            <img src={prod.image || prod.images[0]} alt={prod.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-slate-300 m-auto mt-2.5" />
                          )}
                        </div>
                        <span className="text-sm font-bold text-slate-800">{prod.name}</span>
                      </div>
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-black">Còn {prod.stock} SP</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                    <th className="px-6 py-4">Sản phẩm & Màu sắc</th>
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
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-800">{order.customerName}</span>
                          {order.shippingDetails?.label && (
                            <span className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 text-[9px] font-bold border border-teal-200">
                              {order.shippingDetails.label}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-teal-700 font-semibold block">{order.customerPhone}</span>
                        <span className="text-[11px] text-slate-500 line-clamp-1 max-w-[200px]" title={order.address}>
                          {order.address}
                        </span>
                        {order.note && (
                          <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 line-clamp-1 max-w-[200px] mt-1 inline-flex items-center gap-1" title={`Ghi chú: ${order.note}`}>
                            <FileText className="w-3 h-3 text-amber-600 flex-shrink-0" /> {order.note}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1.5 max-w-xs">
                          {order.items && order.items.length > 0 ? (
                            order.items.map((it: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-1.5 text-xs bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                                {it.image && (
                                  <img src={it.image} alt={it.productName} className="w-6 h-6 object-contain bg-white rounded border border-slate-200 p-0.5 flex-shrink-0" />
                                )}
                                <span className="font-bold text-slate-800 line-clamp-1 flex-1">{it.productName}</span>
                                <span className="text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase">{it.size || 'Free'}</span>
                                {it.color && (
                                  <span className="text-[10px] bg-teal-50 border border-teal-200 text-teal-800 font-bold px-1.5 py-0.5 rounded">
                                    {it.color}
                                  </span>
                                )}
                                <span className="text-[10px] text-slate-500 font-black">x{it.quantity}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">Không có chi tiết</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-black text-teal-700 whitespace-nowrap">{formatVND(order.totalAmount)}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <span className={`px-2 py-1 inline-block text-center rounded text-[10px] font-bold uppercase w-fit ${order.paymentMethod === 'QR' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'}`}>
                            {order.paymentMethod === 'QR' ? 'Chuyển khoản' : 'Thu hộ COD'}
                          </span>
                          <button
                            onClick={() => updatePaymentStatus(order.id, order.paymentStatus === 'PAID' ? 'PENDING' : 'PAID')}
                            className={`px-2 py-1 inline-block text-center rounded text-[10px] font-bold uppercase w-fit hover:opacity-80 transition-opacity ${order.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
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
          <a href="/shop-lam-dien" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-sm flex items-center gap-2"><LogOut className="w-4 h-4" /> Về trang Shop</a>
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

      {/* MODAL PRODUCT VỚI BIẾN THỂ MÀU SẮC */}
      {isProdModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-base font-black text-slate-800 uppercase">{editingProduct ? "Cập nhật Sản phẩm" : "Thêm Sản phẩm mới"}</h2>
              <button onClick={() => setIsProdModalOpen(false)} className="p-1.5 hover:bg-slate-200 rounded-full"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleProductSubmit} className="p-6 max-h-[80vh] overflow-y-auto space-y-5">

              {/* === THÔNG TIN CƠ BẢN === */}
              <div className="grid grid-cols-2 gap-4">
                {/* === KHU VỰC HÌNH ẢNH CHUNG CỦA SẢN PHẨM (1 HOẶC NHIỀU ẢNH) === */}
                <div className="col-span-2 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <span>🖼️ Hình ảnh chung của sản phẩm</span>
                        <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                          {(prodForm.images || []).length} ảnh
                        </span>
                      </label>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        Có thể chọn cùng lúc 1 hoặc nhiều ảnh. Ảnh đầu tiên (có huy hiệu ⭐) là ảnh đại diện chính.
                      </p>
                    </div>

                    <label className="cursor-pointer px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm">
                      <Plus className="w-3.5 h-3.5" /> Thêm ảnh
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleMultipleImagesUpload}
                        disabled={isUploadingImage}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {isUploadingImage && (
                    <div className="mb-3 p-2.5 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-2 text-xs text-teal-700 font-bold animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                      <span>{uploadProgressText || "Đang xử lý và tải ảnh lên mây..."}</span>
                    </div>
                  )}

                  {/* Danh sách ảnh chung preview */}
                  {(prodForm.images && prodForm.images.length > 0) ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mt-2">
                      {prodForm.images.map((imgUrl: string, imgIdx: number) => {
                        const isMain = imgIdx === 0;
                        return (
                          <div
                            key={imgIdx}
                            className={`group relative aspect-square rounded-xl border-2 overflow-hidden bg-white shadow-xs transition-all ${
                              isMain ? 'border-teal-600 ring-2 ring-teal-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <img src={imgUrl} alt={`Ảnh ${imgIdx + 1}`} className="w-full h-full object-cover" />

                            {/* Badge Ảnh chính hoặc Nút Đặt làm chính */}
                            {isMain ? (
                              <span className="absolute top-1.5 left-1.5 bg-teal-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm flex items-center gap-0.5">
                                ⭐ Chính
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setAsPrimaryImage(imgUrl)}
                                className="absolute top-1.5 left-1.5 bg-black/60 hover:bg-teal-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Đặt làm ảnh chính"
                              >
                                Đặt làm chính
                              </button>
                            )}

                            {/* Nút Xóa ảnh */}
                            <button
                              type="button"
                              onClick={() => removeProductImage(imgUrl)}
                              className="absolute top-1.5 right-1.5 w-6 h-6 bg-rose-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-700 shadow-md"
                              title="Xóa ảnh này"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <label className="mt-2 border-2 border-dashed border-slate-300 hover:border-teal-400 bg-white/70 hover:bg-teal-50/30 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                      <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-teal-100 flex items-center justify-center text-slate-400 group-hover:text-teal-600 mb-2 transition-colors">
                        <Plus className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-700 group-hover:text-teal-700 transition-colors">
                        Bấm vào đây để chọn 1 hoặc nhiều ảnh chung
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Hỗ trợ chọn nhiều ảnh cùng lúc (JPG, PNG, WEBP...)</p>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleMultipleImagesUpload}
                        disabled={isUploadingImage}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Tên sản phẩm</label>
                  <input type="text" required value={prodForm.name} onChange={(e) => setProdForm({ ...prodForm, name: e.target.value, slug: generateSlug(e.target.value) })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none" />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Gán vào Danh mục con</label>
                  <select value={prodForm.categoryId} onChange={(e) => setProdForm({ ...prodForm, categoryId: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl font-bold text-teal-700 bg-teal-50/30 outline-none">
                    <option value="">-- Chọn danh mục --</option>
                    {categories.filter(c => c.parentId).map(c => <option key={c.id} value={c.id}>{c.parent?.name} {'>'} {c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Các Size hỗ trợ</label>
                  <input type="text" value={prodForm.sizes} onChange={(e) => setProdForm({ ...prodForm, sizes: e.target.value })} placeholder="VD: 39, 40, 41" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl font-semibold outline-none" />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Mô tả sản phẩm</label>
                  <textarea
                    value={prodForm.description}
                    onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                    rows={2}
                    placeholder="Nhập giới thiệu, chất liệu, tính năng nổi bật..."
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl font-medium outline-none focus:border-teal-600 transition-colors"
                  />
                </div>
              </div>

              {/* === BIẾN THỂ MÀU SẮC === */}
              <div className="border border-teal-200 rounded-2xl overflow-hidden">
                <div className="bg-teal-50 px-5 py-3.5 flex justify-between items-center border-b border-teal-200">
                  <h3 className="text-sm font-black text-teal-800 uppercase flex items-center gap-2">
                    <Palette className="w-4 h-4" /> Biến thể màu sắc
                    <span className="text-[10px] font-bold text-teal-600 bg-teal-100 px-2 py-0.5 rounded-full ml-1">{colorVariants.length} màu</span>
                    <span className="text-[10px] font-semibold text-teal-500 ml-1">• Tổng kho: {colorVariants.reduce((s, v) => s + (Number(v.stock) || 0), 0)}</span>
                  </h3>
                  <button type="button" onClick={addVariant} className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow-sm">
                    <Plus className="w-3 h-3" /> Thêm màu
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {colorVariants.map((variant, idx) => (
                    <div key={idx} className="p-4 hover:bg-slate-50/50 transition-colors">
                      {/* Row 1: Tên màu + Color picker + Ảnh riêng + Nút xóa */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="color"
                            value={variant.colorCode}
                            onChange={(e) => updateVariant(idx, 'colorCode', e.target.value)}
                            className="w-9 h-9 rounded-lg border-2 border-slate-200 cursor-pointer p-0.5"
                            title="Chọn mã màu"
                          />
                          <input
                            type="text"
                            value={variant.colorName}
                            onChange={(e) => updateVariant(idx, 'colorName', e.target.value)}
                            placeholder="Tên màu (VD: Đen, Trắng...)"
                            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-teal-500"
                          />
                        </div>

                        {/* Ảnh riêng cho biến thể */}
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-600 transition-colors whitespace-nowrap">
                            {isUploadingVariantImage === idx ? (
                              <Loader2 className="w-3 h-3 animate-spin inline" />
                            ) : variant.image ? '🖼️ Đổi ảnh' : '📷 Ảnh riêng'}
                            <input type="file" accept="image/*" onChange={(e) => handleVariantImageUpload(e, idx)} className="hidden" disabled={isUploadingVariantImage === idx} />
                          </label>
                          {variant.image && (
                            <div className="w-8 h-8 rounded border border-slate-200 overflow-hidden">
                              <img src={variant.image} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>

                        <button type="button" onClick={() => removeVariant(idx)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Xóa biến thể">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Row 2: Giá + Giá KM + Tồn kho */}
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Giá bán (VNĐ)</label>
                          <input
                            type="number"
                            value={variant.price}
                            onChange={(e) => updateVariant(idx, 'price', e.target.value)}
                            placeholder="VD: 350000"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-teal-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-red-400 uppercase block mb-1">Giá KM (VNĐ)</label>
                          <input
                            type="number"
                            value={variant.discountPrice}
                            onChange={(e) => updateVariant(idx, 'discountPrice', e.target.value)}
                            placeholder="Bỏ trống nếu không KM"
                            className="w-full px-3 py-2 border border-red-100 rounded-lg text-sm font-bold text-red-600 outline-none focus:border-red-400"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                            Tổng kho {(() => {
                              const vSizes = variant.sizes ? (typeof variant.sizes === 'string' ? variant.sizes.split(',').map((s: string) => s.trim()).filter(Boolean) : (Array.isArray(variant.sizes) ? variant.sizes : [])) : [];
                              return vSizes.length > 0 ? <span className="text-teal-600 font-semibold normal-case">(Tự tính từ các size)</span> : '';
                            })()}
                          </label>
                          <input
                            type="number"
                            value={variant.stock}
                            onChange={(e) => updateVariant(idx, 'stock', e.target.value)}
                            readOnly={Boolean(variant.sizes && (typeof variant.sizes === 'string' ? variant.sizes.trim() : variant.sizes.length > 0))}
                            placeholder="VD: 50"
                            className={`w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold outline-none ${
                              variant.sizes && (typeof variant.sizes === 'string' ? variant.sizes.trim() : variant.sizes.length > 0)
                                ? 'bg-teal-50/40 text-teal-800 border-teal-200 font-black'
                                : 'focus:border-teal-500'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Row 3: Size cho riêng màu này */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                            <span>👟 Size có sẵn cho màu này:</span>
                            {variant.sizes && (
                              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60">
                                {(typeof variant.sizes === 'string' ? variant.sizes.split(',').map((s: string) => s.trim()).filter(Boolean) : variant.sizes).length} size
                              </span>
                            )}
                          </label>
                          {prodForm.sizes && (
                            <button
                              type="button"
                              onClick={() => updateVariant(idx, 'sizes', prodForm.sizes)}
                              className="text-[10px] font-bold text-teal-600 hover:text-teal-700 hover:underline flex items-center gap-0.5"
                              title="Sao chép danh sách size từ ô Size chung ở trên"
                            >
                              📋 Lấy từ Size chung
                            </button>
                          )}
                        </div>

                        {/* Bấm chọn nhanh các Size thông dụng */}
                        <div className="flex flex-wrap items-center gap-1 mb-2">
                          <span className="text-[10px] text-slate-400 font-medium mr-1">Bấm chọn nhanh:</span>
                          {COMMON_SIZES.map((sz) => {
                            const currentList = variant.sizes
                              ? (typeof variant.sizes === 'string'
                                  ? variant.sizes.split(',').map((s: string) => s.trim()).filter(Boolean)
                                  : (Array.isArray(variant.sizes) ? variant.sizes : []))
                              : [];
                            const isSelected = currentList.includes(sz);
                            return (
                              <button
                                key={sz}
                                type="button"
                                onClick={() => toggleVariantSize(idx, sz)}
                                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                                  isSelected
                                    ? 'bg-teal-600 text-white shadow-xs ring-1 ring-teal-600 scale-105'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60'
                                }`}
                              >
                                {sz}
                              </button>
                            );
                          })}
                        </div>

                        {/* Ô gõ tùy chỉnh size */}
                        <input
                          type="text"
                          value={variant.sizes || ""}
                          onChange={(e) => updateVariant(idx, 'sizes', e.target.value)}
                          placeholder="Hoặc tự gõ các size cách nhau bằng dấu phẩy (VD: 38, 39, 40, 41 hoặc S, M, L)"
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-teal-500 bg-white"
                        />

                        {/* Bảng nhập số lượng từng Size */}
                        {(() => {
                          const vSizesList = variant.sizes
                            ? (typeof variant.sizes === 'string'
                                ? variant.sizes.split(',').map((s: string) => s.trim()).filter(Boolean)
                                : (Array.isArray(variant.sizes) ? variant.sizes : []))
                            : [];
                          if (vSizesList.length === 0) return null;

                          return (
                            <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                                  <span>📦 Nhập số lượng cho từng size:</span>
                                  <span className="text-[10px] font-extrabold text-teal-700 bg-white px-2 py-0.5 rounded-md border border-teal-200">
                                    Tổng: {variant.stock || 0} SP
                                  </span>
                                </span>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-slate-400 font-medium">Gán nhanh:</span>
                                  {[5, 10, 20, 50].map((quickQty) => (
                                    <button
                                      key={quickQty}
                                      type="button"
                                      onClick={() => applyStockToAllSizes(idx, quickQty)}
                                      className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white hover:bg-teal-50 hover:text-teal-700 text-slate-600 border border-slate-200 transition-colors shadow-2xs"
                                      title={`Đặt tất cả ${vSizesList.length} size đều có số lượng là ${quickQty}`}
                                    >
                                      ={quickQty}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                {vSizesList.map((sz: string) => {
                                  const currentStock = variant.sizeStocks?.[sz] ?? "";
                                  return (
                                    <div key={sz} className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs flex flex-col gap-1">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-black text-slate-800">Size {sz}</span>
                                        <span className="text-[9px] text-slate-400 font-medium">SL</span>
                                      </div>
                                      <input
                                        type="number"
                                        min="0"
                                        value={currentStock}
                                        onChange={(e) => updateVariantSizeStock(idx, sz, e.target.value)}
                                        placeholder="0"
                                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs font-black text-teal-800 text-center outline-none focus:border-teal-500 focus:bg-teal-50/20"
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* === BUTTONS === */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsProdModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 bg-slate-100 rounded-xl">Hủy</button>
                <button type="submit" disabled={isSubmittingProd} className="flex-[2] py-3 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 rounded-xl flex justify-center items-center gap-2">
                  {isSubmittingProd ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu dữ liệu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL CHI TIẾT ĐƠN HÀNG */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-base font-black text-slate-800 uppercase flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-teal-600" />
                  Chi tiết đơn hàng #{selectedOrderDetails.id}
                </h2>
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