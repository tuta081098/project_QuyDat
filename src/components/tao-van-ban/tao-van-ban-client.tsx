"use client";

import { useState, useEffect, useRef } from "react";
import { 
  FileText, Upload, LockKeyhole, User, FileSpreadsheet, 
  FileArchive, Download, PlayCircle, Trash2, X, PlusCircle
} from "lucide-react";
import * as XLSX from "xlsx";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { verifyLogin } from "@/src/app/tao-van-ban/action";

// Interface định nghĩa cấu trúc dữ liệu của 1 Mẫu văn bản
interface TemplateItem {
  id: string;
  name: string;
  file: File;
  keys: string[];
  createdAt: Date;
}

export default function TaoVanBanClient() {
  // === STATE ĐĂNG NHẬP ===
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // === STATE QUẢN LÝ MẪU (BẢNG) ===
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const wordInputRef = useRef<HTMLInputElement>(null);

  // === STATE SỬ DỤNG MẪU (MODAL) ===
  const [activeTemplate, setActiveTemplate] = useState<TemplateItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const excelInputRef = useRef<HTMLInputElement>(null);

  // Kiểm tra trạng thái đăng nhập
  useEffect(() => {
    const session = sessionStorage.getItem("auth_tao_van_ban");
    if (session === "true") setIsLoggedIn(true);
    setIsChecking(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await verifyLogin(username, password);
    if (res.success) {
      sessionStorage.setItem("auth_tao_van_ban", "true");
      setIsLoggedIn(true);
    } else setError(res.message||"Lỗi!");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("auth_tao_van_ban");
    setIsLoggedIn(false);
    setTemplates([]);
  };

  // =========================================
  // BƯỚC 1: TẢI LÊN FILE WORD VÀ LƯU VÀO BẢNG
  // =========================================
  const handleWordSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (wordInputRef.current) wordInputRef.current.value = ''; // Reset input

    if (file && file.name.endsWith('.docx')) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const zip = new PizZip(arrayBuffer);
        const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
        
        const text = doc.getFullText();
        const regex = /\{([a-zA-Z0-9_A-ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+)\}/g;
        let match;
        const extractedKeys = new Set<string>();

        while ((match = regex.exec(text)) !== null) {
          extractedKeys.add(match[1].trim());
        }

        const newTemplate: TemplateItem = {
          id: Date.now().toString(),
          name: file.name,
          file: file,
          keys: Array.from(extractedKeys),
          createdAt: new Date()
        };

        // Thêm vào danh sách bảng
        setTemplates(prev => [newTemplate, ...prev]);

        if (extractedKeys.size === 0) {
          alert(`File "${file.name}" đã được tải lên, nhưng không tìm thấy từ khóa {key} nào bên trong.`);
        }

      } catch (err) {
        console.error(err);
        alert("File Word bị lỗi hoặc không thể đọc. Vui lòng kiểm tra lại định dạng.");
      }
    } else if (file) {
      alert("Chỉ hỗ trợ tải lên file Word định dạng .docx");
    }
  };

  // =========================================
  // BƯỚC 2: TẢI XUỐNG FILE EXCEL MẪU TỪ BẢNG
  // =========================================
  const downloadExcelTemplate = (template: TemplateItem) => {
    if (template.keys.length === 0) {
      alert("Mẫu này không có từ khóa nào để tạo file Excel.");
      return;
    }

    const headerRow: any = {};
    template.keys.forEach(key => { headerRow[key] = "" });

    const worksheet = XLSX.utils.json_to_sheet([headerRow]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data_Mau");

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    
    const cleanName = template.name.replace('.docx', '');
    saveAs(dataBlob, `Data_Mau_${cleanName}.xlsx`);
  };

  const removeTemplate = (id: string) => {
    if(confirm("Bạn có chắc muốn xóa mẫu này khỏi danh sách?")) {
      setTemplates(templates.filter(t => t.id !== id));
    }
  };

  // =========================================
  // BƯỚC 3: MỞ MODAL SỬ DỤNG MẪU VÀ TẢI EXCEL DATA
  // =========================================
  const openUseModal = (template: TemplateItem) => {
    setActiveTemplate(template);
    setExcelFile(null);
    setExcelData([]);
    setIsModalOpen(true);
  };

  const handleExcelSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (excelInputRef.current) excelInputRef.current.value = '';

    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setExcelFile(file);
      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        setExcelData(jsonData);
      } catch (err) {
        alert("Không thể đọc dữ liệu file Excel.");
        setExcelFile(null);
        setExcelData([]);
      }
    } else if (file) {
      alert("Chỉ hỗ trợ file dữ liệu Excel (.xlsx, .xls)");
    }
  };

  // =========================================
  // BƯỚC 4: THUẬT TOÁN KẾT XUẤT VÀ LƯU LỊCH SỬ
  // =========================================
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleGenerate = async () => {
    if (!activeTemplate || !excelFile || excelData.length === 0) return;
    setIsGenerating(true);

    try {
      const wordBuffer = await activeTemplate.file.arrayBuffer();
      const zipOutput = new JSZip();

      excelData.forEach((row, index) => {
        const zip = new PizZip(wordBuffer);
        const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
        
        doc.render(row);
        
        const outDocBuffer = doc.getZip().generate({
          type: "blob",
          mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        const personName = row['HoTen'] || row['Tên'] || row['Name'] || `So_${index + 1}`;
        zipOutput.file(`VanBan_${personName}.docx`, outDocBuffer);
      });

      const zipBlob = await zipOutput.generateAsync({ type: "blob" });
      saveAs(zipBlob, `Ket_Xuat_${activeTemplate.name.replace('.docx', '')}_${new Date().getTime()}.zip`);
      
      try {
        const base64String = await fileToBase64(activeTemplate.file);
        await fetch('/api/tao-van-ban', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateName: activeTemplate.name,
            fileBase64: base64String,
            excelName: excelFile.name,
            dataSnapshot: excelData
          })
        });
      } catch (dbError) {}

      alert(`🎉 Đã kết xuất thành công ${excelData.length} văn bản!`);
      setIsModalOpen(false); // Đóng modal khi xong
      
    } catch (error) {
      alert("Có lỗi xảy ra trong quá trình trộn dữ liệu. Vui lòng kiểm tra lại các từ khóa {key} trong file Word.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isChecking) return null;

  // ==========================================
  // GIAO DIỆN ĐĂNG NHẬP
  // ==========================================
  if (!isLoggedIn) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-blue-50 p-3 rounded-full mb-3"><LockKeyhole className="w-8 h-8 text-blue-600" /></div>
            <h1 className="text-2xl font-bold text-slate-800">Cổng Tạo Văn Bản</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Tài khoản</label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full pl-10 p-3 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Mật khẩu</label>
              <div className="relative">
                <LockKeyhole className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 p-3 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
              </div>
            </div>
            {error && <p className="text-sm text-red-500 font-medium text-center bg-red-50 py-2 rounded-lg">{error}</p>}
            <button type="submit" className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all">Đăng Nhập</button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // GIAO DIỆN CHÍNH
  // ==========================================
  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-500">
      
      {/* HEADER TỔNG */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản Lý & Tạo Văn Bản Tự Động</h1>
          <p className="text-sm text-slate-500 mt-0.5">Quản lý kho mẫu văn bản và kết xuất dữ liệu hàng loạt.</p>
        </div>
        <button onClick={handleLogout} className="px-4 py-2.5 text-sm font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
          Đăng xuất
        </button>
      </div>

      {/* KHU VỰC QUẢN LÝ MẪU */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600"/> Danh sách Mẫu văn bản
          </h2>
          
          <input type="file" ref={wordInputRef} onChange={handleWordSelect} accept=".docx" className="hidden" />
          <button 
            onClick={() => wordInputRef.current?.click()} 
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md text-sm"
          >
            <PlusCircle className="w-4 h-4" /> Tải lên mẫu Word mới
          </button>
        </div>

        {/* BẢNG DANH SÁCH MẪU */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold w-16 text-center">STT</th>
                <th className="px-6 py-4 font-bold">Tên Mẫu Văn Bản</th>
                <th className="px-6 py-4 font-bold text-center">Biến số (Keys)</th>
                <th className="px-6 py-4 font-bold text-center">Dữ Liệu Mẫu</th>
                <th className="px-6 py-4 font-bold text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {templates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="font-medium text-base text-slate-500">Chưa có mẫu văn bản nào được tải lên</p>
                    <p className="text-sm mt-1">Bấm nút "Tải lên mẫu Word mới" để bắt đầu</p>
                  </td>
                </tr>
              ) : (
                templates.map((template, index) => (
                  <tr key={template.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-center font-bold text-slate-400">{index + 1}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-500 shrink-0"/>
                        {template.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-md text-xs">
                        {template.keys.length} từ khóa
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => downloadExcelTemplate(template)}
                        className="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-bold px-3 py-1.5 rounded-lg transition-colors text-xs"
                      >
                        <Download className="w-4 h-4" /> Tải Excel Mẫu
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => openUseModal(template)}
                          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-1.5 rounded-lg transition-colors shadow-sm text-xs"
                        >
                          <PlayCircle className="w-4 h-4" /> Sử dụng
                        </button>
                        <button 
                          onClick={() => removeTemplate(template.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa mẫu"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================== */}
      {/* MODAL SỬ DỤNG MẪU (TẢI DATA & KẾT XUẤT) */}
      {/* ========================================== */}
      {isModalOpen && activeTemplate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-slate-800"/> Ghép Dữ Liệu: {activeTemplate.name}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">Tải lên dữ liệu bảng (.xlsx)</h3>
              
              <div 
                onClick={() => excelInputRef.current?.click()} 
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${excelFile ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-300 hover:bg-slate-50 hover:border-emerald-400'}`}
              >
                <input type="file" ref={excelInputRef} onChange={handleExcelSelect} accept=".xlsx, .xls" className="hidden" />
                
                {excelFile ? (
                  <div className="flex flex-col items-center animate-in zoom-in-95">
                    <FileSpreadsheet className="w-10 h-10 text-emerald-600 mb-3" />
                    <p className="text-sm font-bold text-slate-800">{excelFile.name}</p>
                    <p className="text-xs text-emerald-600 font-bold mt-1">Chuẩn bị xuất {excelData.length} văn bản</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-emerald-50 p-3 rounded-full mb-3"><Upload className="w-6 h-6 text-emerald-500" /></div>
                    <p className="text-sm font-bold text-slate-700 mb-1">Click để tải lên file Excel dữ liệu</p>
                    <p className="text-xs text-slate-500">Dữ liệu phải có các cột khớp với file mẫu</p>
                  </>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-100">Hủy bỏ</button>
              <button 
                onClick={handleGenerate}
                disabled={!excelFile || excelData.length === 0 || isGenerating} 
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-slate-800 rounded-lg hover:bg-slate-900 disabled:opacity-50 shadow-md transition-all"
              >
                {isGenerating ? 'Đang xử lý...' : <><FileArchive className="w-4 h-4" /> Kết xuất ZIP</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}