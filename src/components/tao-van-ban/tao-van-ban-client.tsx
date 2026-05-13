"use client";

import { useState, useEffect, useRef } from "react";
import { 
  FileText, Upload, LockKeyhole, User, FileSpreadsheet, 
  FileArchive, Download, PlayCircle, Trash2, X, PlusCircle, History, CalendarClock, Table
} from "lucide-react";
import * as XLSX from "xlsx";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { verifyLogin } from "@/src/app/tao-van-ban/action";

// Interface định nghĩa cấu trúc Lịch sử (ĐÃ THÊM dataSnapshot)
interface TemplateHistory {
  id: string;
  excelName: string;
  recordCount: number;
  date: Date;
  dataSnapshot?: any[]; // Mảng lưu toàn bộ nội dung file Excel
}

interface TemplateItem {
  id: string;
  name: string;
  file: File;
  keys: string[];
  createdAt: Date;
  histories: TemplateHistory[];
}

// =========================================
// HỆ QUẢN TRỊ CSDL CỤC BỘ (INDEXED-DB)
// =========================================
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("DocGenDB", 2); 
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("templates")) {
        db.createObjectStore("templates", { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveTemplateToDB = async (template: TemplateItem) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("templates", "readwrite");
    tx.objectStore("templates").put(template); 
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
};

const getTemplatesFromDB = async (): Promise<TemplateItem[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("templates", "readonly");
    const req = tx.objectStore("templates").getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

const deleteTemplateFromDB = async (id: string) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("templates", "readwrite");
    tx.objectStore("templates").delete(id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
};

// =========================================
// COMPONENT CHÍNH
// =========================================
export default function TaoVanBanClient() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const wordInputRef = useRef<HTMLInputElement>(null);

  const [activeTemplate, setActiveTemplate] = useState<TemplateItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const excelInputRef = useRef<HTMLInputElement>(null);

  // States cho Lịch sử & Xem trước Dữ liệu
  const [historyTemplate, setHistoryTemplate] = useState<TemplateItem | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any[] | null>(null); // State chứa data để xem chi tiết

  useEffect(() => {
    const session = sessionStorage.getItem("auth_tao_van_ban");
    if (session === "true") setIsLoggedIn(true);
    setIsChecking(false);

    getTemplatesFromDB().then((data) => {
      const safeData = data.map(t => ({ ...t, histories: t.histories || [] }));
      const sorted = safeData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setTemplates(sorted);
    }).catch(err => console.error("Lỗi load Database cục bộ:", err));
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
  };

  const handleWordSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (wordInputRef.current) wordInputRef.current.value = ''; 

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
          createdAt: new Date(),
          histories: [] 
        };

        await saveTemplateToDB(newTemplate);
        setTemplates(prev => [newTemplate, ...prev]);

        if (extractedKeys.size === 0) {
          alert(`File "${file.name}" đã được tải lên, nhưng không tìm thấy từ khóa {key} nào.`);
        }

      } catch (err) {
        alert("File Word bị lỗi hoặc không thể đọc. Vui lòng kiểm tra lại định dạng.");
      }
    } else if (file) {
      alert("Chỉ hỗ trợ tải lên file Word định dạng .docx");
    }
  };

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
    saveAs(dataBlob, `Data_Mau_${template.name.replace('.docx', '')}.xlsx`);
  };

  const removeTemplate = async (id: string) => {
    if(confirm("Bạn có chắc muốn xóa mẫu này khỏi danh sách? Lịch sử cũng sẽ bị xóa theo.")) {
      await deleteTemplateFromDB(id);
      setTemplates(templates.filter(t => t.id !== id));
    }
  };

  const openUseModal = (template: TemplateItem) => {
    setActiveTemplate(template);
    setExcelFile(null);
    setExcelData([]);
    setIsModalOpen(true);
  };

  const openHistoryModal = (template: TemplateItem) => {
    setHistoryTemplate(template);
    setIsHistoryModalOpen(true);
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
    }
  };

  // THUẬT TOÁN KẾT XUẤT VÀ LƯU LỊCH SỬ (CÓ CHỨA NỘI DUNG DATA)
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
      
      // === TẠO VÀ LƯU LỊCH SỬ KÈM TOÀN BỘ DATA NỘI DUNG ===
      const newHistory: TemplateHistory = {
        id: Date.now().toString(),
        excelName: excelFile.name,
        recordCount: excelData.length,
        date: new Date(),
        dataSnapshot: excelData // LƯU TOÀN BỘ JSON CỦA EXCEL VÀO ĐÂY
      };

      const updatedTemplate = {
        ...activeTemplate,
        histories: [newHistory, ...(activeTemplate.histories || [])]
      };

      await saveTemplateToDB(updatedTemplate);
      setTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));

      alert(`🎉 Đã kết xuất thành công ${excelData.length} văn bản! Lịch sử và dữ liệu đã được lưu lại.`);
      setIsModalOpen(false); 
      
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
    <div className="space-y-6 max-w-[1200px] mx-auto animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản Lý & Tạo Văn Bản Tự Động</h1>
          <p className="text-sm text-slate-500 mt-0.5">Lưu trữ mẫu và truy xuất lịch sử dữ liệu an toàn trên trình duyệt.</p>
        </div>
        <button onClick={handleLogout} className="px-4 py-2.5 text-sm font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
          Đăng xuất
        </button>
      </div>

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

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-5 py-4 font-bold w-12 text-center">STT</th>
                <th className="px-5 py-4 font-bold">Tên Mẫu Văn Bản</th>
                <th className="px-5 py-4 font-bold text-center">Biến số</th>
                <th className="px-5 py-4 font-bold text-center">Dữ Liệu Mẫu</th>
                <th className="px-5 py-4 font-bold text-center">Lịch sử xuất</th>
                <th className="px-5 py-4 font-bold text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {templates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="font-medium text-base text-slate-500">Chưa có mẫu văn bản nào được tải lên</p>
                    <p className="text-sm mt-1">Bấm nút "Tải lên mẫu Word mới" để bắt đầu</p>
                  </td>
                </tr>
              ) : (
                templates.map((template, index) => {
                  const historyCount = template.histories?.length || 0;

                  return (
                    <tr key={template.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 text-center font-bold text-slate-400">{index + 1}</td>
                      <td className="px-5 py-4 font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-500 shrink-0"/>
                          <span className="truncate max-w-[200px]" title={template.name}>{template.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-md text-[11px]">
                          {template.keys.length} từ khóa
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button 
                          onClick={() => downloadExcelTemplate(template)}
                          className="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-bold px-3 py-1.5 rounded-lg transition-colors text-xs"
                        >
                          <Download className="w-4 h-4" /> Tải Excel
                        </button>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button 
                          onClick={() => openHistoryModal(template)}
                          className={`inline-flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-lg transition-colors text-xs ${historyCount > 0 ? 'text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700' : 'text-slate-400 hover:bg-slate-100'}`}
                        >
                          <History className="w-4 h-4" /> {historyCount} lần
                        </button>
                      </td>
                      <td className="px-5 py-4 text-center">
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
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL SỬ DỤNG MẪU (Tải Data & Xuất ZIP) */}
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

      {/* MODAL LỊCH SỬ (XEM DANH SÁCH LẦN XUẤT) */}
      {isHistoryModalOpen && historyTemplate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600"/> Lịch sử xuất: <span className="truncate max-w-[300px] font-medium ml-1">{historyTemplate.name}</span>
              </h2>
              <button onClick={() => setIsHistoryModalOpen(false)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-0">
              {(!historyTemplate.histories || historyTemplate.histories.length === 0) ? (
                <div className="py-16 text-center text-slate-400">
                  <CalendarClock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="font-medium text-base text-slate-500">Mẫu này chưa được sử dụng lần nào</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-500 sticky top-0 border-b border-slate-200 text-xs uppercase tracking-wider z-10">
                    <tr>
                      <th className="px-6 py-3 font-bold w-12 text-center">Lần</th>
                      <th className="px-6 py-3 font-bold">Thời gian xuất</th>
                      <th className="px-6 py-3 font-bold">File Excel Nguồn</th>
                      <th className="px-6 py-3 font-bold text-center">Số VB</th>
                      <th className="px-6 py-3 font-bold text-center">Nội dung đã đẩy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyTemplate.histories.map((hist, i) => (
                      <tr key={hist.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-center font-bold text-slate-400">{historyTemplate.histories.length - i}</td>
                        <td className="px-6 py-4 font-semibold text-slate-700">
                          {new Date(hist.date).toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'})}
                        </td>
                        <td className="px-6 py-4 font-medium text-indigo-700 flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-500"/> {hist.excelName}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full text-xs">
                            +{hist.recordCount} file
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {hist.dataSnapshot && hist.dataSnapshot.length > 0 ? (
                            <button 
                              onClick={() => setPreviewData(hist.dataSnapshot!)}
                              className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold px-3 py-1.5 rounded-lg transition-colors text-xs border border-blue-200"
                            >
                              <Table className="w-4 h-4" /> Xem dữ liệu
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Không có data</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
              <button onClick={() => setIsHistoryModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 shadow-sm">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XEM CHI TIẾT DỮ LIỆU ĐÃ ĐẨY */}
      {previewData && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-800 text-white">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Table className="w-5 h-5 text-blue-400"/> Chi tiết dữ liệu đã đẩy
              </h2>
              <button onClick={() => setPreviewData(null)} className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="overflow-auto flex-1 p-0">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-100 text-slate-600 sticky top-0 border-b border-slate-300 text-xs uppercase tracking-wider z-10 shadow-sm">
                  <tr>
                    <th className="px-4 py-3 font-bold text-center w-12 border-r border-slate-200">STT</th>
                    {Object.keys(previewData[0]).map((key, i) => (
                      <th key={i} className="px-4 py-3 font-bold border-r border-slate-200">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {previewData.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-4 py-3 text-center font-bold text-slate-400 border-r border-slate-100">{rowIndex + 1}</td>
                      {Object.keys(previewData[0]).map((key, colIndex) => (
                        <td key={colIndex} className="px-4 py-3 text-slate-700 font-medium border-r border-slate-100 max-w-[250px] truncate" title={row[key]}>
                          {row[key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}