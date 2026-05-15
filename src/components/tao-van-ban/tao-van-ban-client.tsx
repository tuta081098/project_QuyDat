"use client";

import { useState, useEffect, useRef } from "react";
import { 
  FileText, Upload, LockKeyhole, User, FileSpreadsheet, 
  Download, PlayCircle, Trash2, X, PlusCircle, History, 
  Table, Loader2, CheckCircle2, AlertCircle, FileArchive, Settings, Info
} from "lucide-react";
import * as XLSX from "xlsx";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import JSZip from "jszip";
import { saveAs } from "file-saver";

interface TemplateHistory {
  id: string;
  excelName: string;
  recordCount: number;
  createdAt: string;
  dataSnapshot?: any[];
}

interface TemplateItem {
  id: string;
  name: string;
  fileBase64: string; 
  keys: string[];
  createdAt: string;
  histories: TemplateHistory[];
}

export default function TaoVanBanClient() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isLoadingDB, setIsLoadingDB] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<TemplateItem | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  
  // State mới cho đặt tên file tự do
  const [namingTemplate, setNamingTemplate] = useState<string>("");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [historyTemplate, setHistoryTemplate] = useState<TemplateItem | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'|'info'} | null>(null);

  const wordInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, type: 'success'|'error'|'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchTemplates = async () => {
    setIsLoadingDB(true);
    try {
      const res = await fetch('/api/tao-van-ban');
      const data = await res.json();
      if (Array.isArray(data)) setTemplates(data);
    } catch {
      showToast("Lỗi kết nối đến máy chủ", "error");
    } finally {
      setIsLoadingDB(false);
    }
  };

  useEffect(() => {
    const session = sessionStorage.getItem("auth_tao_van_ban");
    if (session === "true") {
      setIsLoggedIn(true);
      fetchTemplates();
    }
    setIsChecking(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "admin" && password === "admin123123") {
      sessionStorage.setItem("auth_tao_van_ban", "true");
      setIsLoggedIn(true);
      fetchTemplates();
    } else {
      showToast("Tài khoản hoặc mật khẩu không chính xác", "error");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("auth_tao_van_ban");
    setIsLoggedIn(false);
    setTemplates([]);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleWordSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (wordInputRef.current) wordInputRef.current.value = ''; 

    if (file && file.name.endsWith('.docx')) {
      if (file.size > 3 * 1024 * 1024) {
        showToast("File Word quá lớn (> 3MB)", "error");
        return;
      }
      setIsLoadingDB(true);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const zip = new PizZip(arrayBuffer);
        const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
        const text = doc.getFullText();
        const regex = /\{([^}]+)\}/g; 
        let match;
        const extractedKeys = new Set<string>();
        while ((match = regex.exec(text)) !== null) {
          let key = match[1].trim();
          if (key.startsWith('#') || key.startsWith('/')) key = key.substring(1).trim();
          if (key.length > 0 && key.length < 50) extractedKeys.add(key);
        }
        if (extractedKeys.size === 0) {
          showToast("Không tìm thấy từ khóa {key} nào", "error");
          setIsLoadingDB(false);
          return;
        }
        const base64String = await fileToBase64(file);
        const res = await fetch('/api/tao-van-ban', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'CREATE_TEMPLATE',
            name: file.name,
            fileBase64: base64String,
            keys: Array.from(extractedKeys)
          })
        });
        if (res.ok) {
          const newTemplate = await res.json();
          setTemplates(prev => [newTemplate, ...prev]);
          showToast("Đã thêm mẫu mới", "success");
        }
      } catch {
        showToast("Lỗi định dạng file", "error");
      } finally {
        setIsLoadingDB(false);
      }
    }
  };

  const openUseModal = (template: TemplateItem) => {
    setActiveTemplate(template);
    setExcelFile(null);
    setExcelData([]);
    setExcelColumns([]);
    setNamingTemplate("VanBan_{index}"); // Mặc định
    setIsModalOpen(true);
  };

  const handleExcelSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (excelInputRef.current) excelInputRef.current.value = '';
    if (!file) return;
    setExcelFile(file);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);
      setExcelData(jsonData);
      if (jsonData.length > 0) {
        const cols = Object.keys(jsonData[0] as object);
        setExcelColumns(cols);
        const nameCol = cols.find(c => ['hoten', 'họ tên', 'tên', 'name'].includes(c.toLowerCase()));
        if (nameCol) setNamingTemplate(`VanBan_{${nameCol}}`);
      }
    } catch {
      showToast("Lỗi đọc file Excel", "error");
    }
  };

  const resolveFileName = (templateStr: string, row: any, index: number) => {
    // Thay thế các biến {key} và {index}
    let name = templateStr.replace(/\{([^}]+)\}/g, (match, key) => {
      if (key.toLowerCase() === 'index') return String(index + 1);
      return row[key] !== undefined ? String(row[key]) : "";
    });
    // Làm sạch tên file để tránh lỗi hệ điều hành
    return name.replace(/[<>:"/\\|?*]/g, '').trim() || `File_${index + 1}`;
  };

  const handleGenerate = async () => {
    if (!activeTemplate || !excelFile || excelData.length === 0) return;
    setIsGenerating(true);
    try {
      const response = await fetch(activeTemplate.fileBase64);
      const wordBuffer = await response.arrayBuffer();
      const zipOutput = new JSZip();

      excelData.forEach((row, index) => {
        const zip = new PizZip(wordBuffer);
        const doc = new Docxtemplater(zip, { 
          paragraphLoop: true, linebreaks: true,
          nullGetter() { return ""; } 
        });
        doc.render(row);
        const outDocBuffer = doc.getZip().generate({
          type: "blob",
          mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
        
        const fileName = resolveFileName(namingTemplate, row, index);
        zipOutput.file(`${fileName}.docx`, outDocBuffer);
      });

      const zipBlob = await zipOutput.generateAsync({ type: "blob" });
      saveAs(zipBlob, `KetXuat_${activeTemplate.name.split('.')[0]}.zip`);
      
      await fetch('/api/tao-van-ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SAVE_HISTORY',
          templateId: activeTemplate.id,
          excelName: excelFile.name,
          recordCount: excelData.length,
          dataSnapshot: excelData
        })
      });

      fetchTemplates();
      setIsModalOpen(false);
      showToast("Kết xuất hoàn tất", "success");
    } catch {
      showToast("Lỗi trộn dữ liệu", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const removeTemplate = async (id: string) => {
    if(confirm("Xác nhận xóa mẫu này?")) {
      setTemplates(templates.filter(t => t.id !== id));
      await fetch(`/api/tao-van-ban?id=${id}`, { method: 'DELETE' });
      showToast("Đã xóa", "info");
    }
  };

  const downloadExcelTemplate = (template: TemplateItem) => {
    const headerRow: any = {};
    template.keys.forEach(key => { headerRow[key] = "" });
    const worksheet = XLSX.utils.json_to_sheet([headerRow]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data_Mau");
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    saveAs(dataBlob, `Mau_Data_${template.name.replace('.docx', '')}.xlsx`);
  };

  if (isChecking) return null;

  if (!isLoggedIn) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl border w-full max-w-md animate-in fade-in zoom-in-95">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-slate-100 p-4 rounded-full mb-4"><LockKeyhole className="w-8 h-8 text-slate-800" /></div>
            <h1 className="text-2xl font-bold text-slate-800">Truy Cập Hệ Thống</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative"><User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Tài khoản" className="w-full pl-10 p-3.5 border rounded-xl outline-none focus:ring-2 focus:ring-slate-800 transition-all" /></div>
            <div className="relative"><LockKeyhole className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mật khẩu" className="w-full pl-10 p-3.5 border rounded-xl outline-none focus:ring-2 focus:ring-slate-800 transition-all" /></div>
            <button type="submit" className="w-full py-3.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-all">Đăng Nhập</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 animate-in fade-in">
      {toast && <div className={`fixed top-6 right-6 px-4 py-3 rounded-lg shadow-2xl border flex items-center gap-3 z-[100] animate-in slide-in-from-right-full ${toast.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}><span className="font-bold text-sm">{toast.msg}</span></div>}

      <div className="bg-white p-5 rounded-2xl shadow-sm border flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Quản Lý Mẫu Văn Bản</h1>
          <p className="text-sm text-slate-500">Dữ liệu lưu trữ đồng bộ trên hệ thống đám mây</p>
        </div>
        <div className="flex gap-3">
          <input type="file" ref={wordInputRef} onChange={handleWordSelect} accept=".docx" className="hidden" />
          <button onClick={() => wordInputRef.current?.click()} className="px-5 py-2 bg-slate-800 text-white rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-900 transition-all shadow-sm"><PlusCircle className="w-4 h-4" /> Thêm Mẫu</button>
          <button onClick={handleLogout} className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-red-500 transition-colors">Đăng xuất</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-widest">
            <tr><th className="px-6 py-4 font-bold w-12">STT</th><th className="px-6 py-4 font-bold">Tên Mẫu</th><th className="px-6 py-4 font-bold text-center">Lịch sử xuất</th><th className="px-6 py-4 font-bold text-right">Thao tác</th></tr>
          </thead>
          <tbody className="divide-y">
            {templates.length === 0 ? (
              <tr><td colSpan={4} className="py-20 text-center text-slate-400 font-medium">Chưa có mẫu nào được tải lên</td></tr>
            ) : (
              templates.map((template, index) => (
                <tr key={template.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-slate-400 font-bold">{index + 1}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">{template.name}</td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => {setHistoryTemplate(template); setIsHistoryModalOpen(true);}} className="text-blue-600 font-bold hover:underline flex items-center gap-1 mx-auto bg-blue-50 px-3 py-1 rounded-full text-[11px]"><History className="w-3 h-3"/> {template.histories?.length || 0} lần</button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => downloadExcelTemplate(template)} className="text-slate-500 p-2 hover:bg-slate-100 rounded-lg" title="Tải Excel Mẫu"><Download className="w-4 h-4"/></button>
                      <button onClick={() => openUseModal(template)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-sm"><PlayCircle className="w-4 h-4"/> Ghép dữ liệu</button>
                      <button onClick={() => removeTemplate(template.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL GHÉP DỮ LIỆU TỰ DO */}
      {isModalOpen && activeTemplate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-800 flex items-center gap-2"><Settings className="w-5 h-5" /> Cấu hình kết xuất</h2>
              <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">1. Chọn file dữ liệu Excel</label>
                <div onClick={() => excelInputRef.current?.click()} className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${excelFile ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200 hover:border-slate-400'}`}>
                  <input type="file" ref={excelInputRef} onChange={handleExcelSelect} accept=".xlsx, .xls" className="hidden" />
                  {excelFile ? (
                    <>
                      <FileSpreadsheet className="w-10 h-10 text-emerald-600 mb-2" />
                      <p className="text-sm font-bold text-slate-800">{excelFile.name}</p>
                      <p className="text-xs text-emerald-500 font-bold">Phát hiện {excelData.length} dòng dữ liệu</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-300 mb-2" />
                      <p className="text-sm font-medium text-slate-500">Click để tải lên file Excel</p>
                    </>
                  )}
                </div>
              </div>

              {excelData.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">2. Đặt tên file đầu ra (Free Text)</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={namingTemplate}
                        onChange={(e) => setNamingTemplate(e.target.value)}
                        placeholder="Ví dụ: VanBan_{HoTen}_Nam2024"
                        className="w-full p-3 border-2 border-blue-100 rounded-xl outline-none focus:border-blue-500 font-medium text-sm transition-all"
                      />
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-[11px] text-blue-700 font-bold flex items-center gap-1 mb-1"><Info className="w-3 h-3"/> Xem trước tên file đầu tiên:</p>
                        <p className="text-sm font-mono text-blue-900 break-all">{resolveFileName(namingTemplate, excelData[0], 0)}.docx</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Các biến khả dụng từ Excel của bạn:</p>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-mono border border-slate-200">{"{index}"}</span>
                      {excelColumns.map(col => (
                        <span key={col} className="px-2 py-1 bg-white text-blue-600 rounded text-[10px] font-mono border border-blue-200">{"{" + col + "}"}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t flex justify-end gap-3 bg-slate-50">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-sm font-bold text-slate-400">Hủy</button>
              <button 
                onClick={handleGenerate} 
                disabled={!excelFile || isGenerating}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold text-sm flex items-center gap-2 disabled:opacity-50 shadow-md shadow-emerald-200"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin"/> : <FileArchive className="w-4 h-4" />} Bắt đầu kết xuất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LỊCH SỬ */}
      {isHistoryModalOpen && historyTemplate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-800">Lịch sử: {historyTemplate.name}</h2>
              <button onClick={() => setIsHistoryModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left text-sm">
                <thead className="bg-white sticky top-0 border-b text-slate-500 uppercase text-[10px]">
                  <tr><th className="px-6 py-4">Thời gian</th><th className="px-6 py-4">File Excel</th><th className="px-6 py-4 text-center">Số lượng</th><th className="px-6 py-4 text-right">Hành động</th></tr>
                </thead>
                <tbody className="divide-y">
                  {historyTemplate.histories.map((hist) => (
                    <tr key={hist.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium">{new Date(hist.createdAt).toLocaleString('vi-VN')}</td>
                      <td className="px-6 py-4 text-slate-600 truncate max-w-[200px]">{hist.excelName}</td>
                      <td className="px-6 py-4 text-center font-bold">{hist.recordCount}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => setPreviewData(hist.dataSnapshot!)} className="text-xs font-bold text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50">Chi tiết data</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PREVIEW DATA */}
      {previewData && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <div className="p-4 border-b bg-slate-800 text-white flex justify-between items-center font-bold">
              <div className="flex items-center gap-2"><Table className="w-4 h-4 text-blue-400" /> Dữ liệu đã đẩy</div>
              <button onClick={() => setPreviewData(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-auto flex-1 bg-slate-50">
              <table className="w-full text-left text-[11px] whitespace-nowrap border-collapse">
                <thead className="bg-white sticky top-0 border-b shadow-sm">
                  <tr>
                    <th className="px-4 py-3 border-r w-10 text-center font-bold text-slate-400 bg-white">STT</th>
                    {Object.keys(previewData[0] || {}).map((key) => <th key={key} className="px-4 py-3 border-r font-bold text-slate-600 bg-white">{key}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {previewData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/50 bg-white">
                      <td className="px-4 py-2 border-r text-center text-slate-400">{idx+1}</td>
                      {Object.keys(previewData[0] || {}).map((key) => (
                        <td key={key} className="px-4 py-2 border-r text-slate-700">
                          {row[key] !== undefined && row[key] !== null ? String(row[key]) : ""}
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