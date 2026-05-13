"use client";

import { useState, useEffect, useRef } from "react";
import { FileText, Upload, X, Send, LockKeyhole, User } from "lucide-react";
import { verifyLogin } from "@/src/app/gen-van-ban/action";

export default function GenVanBanClient() {
  // State cho Đăng nhập
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // State cho Màn hình chính
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Kiểm tra xem đã đăng nhập từ trước chưa (chỉ lưu trong phiên làm việc hiện tại)
  useEffect(() => {
    const session = sessionStorage.getItem("auth_gen_van_ban");
    if (session === "true") {
      setIsLoggedIn(true);
    }
    setIsChecking(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Gọi hàm kiểm tra trên Server (Không lộ password F12)
    const res = await verifyLogin(username, password);
    
    if (res.success) {
      sessionStorage.setItem("auth_gen_van_ban", "true");
      setIsLoggedIn(true);
    } else {
      setError(res.message || 'Lỗi');
    }
    setIsLoading(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("auth_gen_van_ban");
    setIsLoggedIn(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Xác thực đuôi file ngay trên client
      if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
        setSelectedFile(file);
      } else {
        alert("Chỉ cho phép tải lên file Word (.doc, .docx)");
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  if (isChecking) return null; // Tránh nháy giao diện khi mới load

  // ==========================================
  // MÀN HÌNH 1: ĐĂNG NHẬP
  // ==========================================
  if (!isLoggedIn) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-blue-50 p-3 rounded-full mb-3">
              <LockKeyhole className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Cổng Tạo Văn Bản</h1>
            <p className="text-sm text-slate-500 mt-1">Vui lòng đăng nhập để tiếp tục</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Tài khoản</label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full pl-10 p-3 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Nhập tài khoản..." />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Mật khẩu</label>
              <div className="relative">
                <LockKeyhole className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 p-3 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="••••••••" />
              </div>
            </div>

            {error && <p className="text-sm text-red-500 font-medium text-center bg-red-50 py-2 rounded-lg">{error}</p>}

            <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all disabled:opacity-50">
              {isLoading ? 'Đang kiểm tra...' : 'Đăng Nhập'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // MÀN HÌNH 2: TRANG CHỦ SAU KHI ĐĂNG NHẬP
  // ==========================================
  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tiện ích Tạo Văn Bản</h1>
          <p className="text-sm text-slate-500 mt-0.5">Tải lên file Word mẫu và kết xuất dữ liệu tự động</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md">
            <Upload className="w-4 h-4" /> Đẩy file mẫu
          </button>
          <button onClick={handleLogout} className="px-4 py-2.5 text-sm font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
            Đăng xuất
          </button>
        </div>
      </div>

      {/* KHU VỰC ĐẨY DỮ LIỆU */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-[400px] flex flex-col items-center justify-center text-center">
        <div className="bg-slate-50 p-6 rounded-full mb-4 border-2 border-dashed border-slate-200">
          <FileText className="w-12 h-12 text-slate-300" />
        </div>
        <h3 className="text-xl font-bold text-slate-700 mb-2">Chưa có dữ liệu nào được chọn</h3>
        <p className="text-slate-500 max-w-md mb-6">Bạn cần chuẩn bị sẵn file mẫu định dạng Word (.docx) trước khi thực hiện kết xuất hàng loạt.</p>
        
        <button className="flex items-center gap-2 px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-200 hover:-translate-y-0.5">
          <Send className="w-5 h-5" /> Đẩy dữ liệu
        </button>
      </div>

      {/* ========================================== */}
      {/* POPUP: UPLOAD FILE MẪU */}
      {/* ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><FileText className="w-5 h-5 text-indigo-600"/> Tải lên File Mẫu</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6">
              <div 
                className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 hover:border-indigo-400 transition-colors cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="bg-indigo-50 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform"><Upload className="w-6 h-6 text-indigo-500" /></div>
                <p className="text-sm font-bold text-slate-700 mb-1">Click để chọn file từ máy tính</p>
                <p className="text-xs text-slate-500 font-medium">Chỉ hỗ trợ file Word (.doc, .docx)</p>
                
                {/* Chỉ lấy file Word */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect}
                  accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                  className="hidden" 
                />
              </div>

              {selectedFile && (
                <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center gap-3">
                  <FileText className="w-8 h-8 text-indigo-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{selectedFile.name}</p>
                    <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button onClick={() => setSelectedFile(null)} className="p-1.5 text-slate-400 hover:text-red-500 bg-white rounded-md shadow-sm"><X className="w-4 h-4"/></button>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-100">Hủy</button>
              <button disabled={!selectedFile} className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 shadow-md">
                Lưu file mẫu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}