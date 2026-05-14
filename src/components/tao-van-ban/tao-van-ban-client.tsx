"use client";

import { useState, useEffect, useRef } from "react";
import { 
  FileText, Upload, LockKeyhole, User, FileSpreadsheet, 
  Download, PlayCircle, Trash2, X, PlusCircle, History, 
  Table, Loader2, CheckCircle2, AlertCircle, FileArchive,
  CalendarClock
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
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [historyTemplate, setHistoryTemplate] = useState<TemplateItem | null>(null);
  
  // Đã thêm lại dòng này để fix lỗi
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
          showToast("Không tìm thấy từ khóa {key} nào trong file", "error");
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
          showToast("Đã thêm mẫu văn bản mới", "success");
        } else {
          showToast("Lỗi lưu trữ mẫu lên hệ thống", "error");
        }
      } catch (err) {
        showToast("Lỗi đọc định dạng file Word", "error");
      } finally {
        setIsLoadingDB(false);
      }
    } else if (file) {
      showToast("Chỉ hỗ trợ định dạng .docx", "error");
    }
  };

  const removeTemplate = async (id: string) => {
    if(confirm("Bạn có chắc muốn xóa mẫu này?")) {
      setTemplates(templates.filter(t => t.id !== id));
      await fetch(`/api/tao-van-ban?id=${id}`, { method: 'DELETE' });
      showToast("Đã xóa mẫu văn bản", "info");
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
    saveAs(dataBlob, `Data_Mau_${template.name.replace('.docx', '')}.xlsx`);
  };

  const triggerProcess = (template: TemplateItem) => {
    setActiveTemplate(template);
    if (excelInputRef.current) excelInputRef.current.click();
  };

  const handleExcelAutoProcess = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeTemplate) return;
    if (excelInputRef.current) excelInputRef.current.value = '';

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      showToast("Chỉ hỗ trợ file Excel (.xlsx, .xls)", "error");
      return;
    }

    setProcessingId(activeTemplate.id);
    showToast("Đang kết xuất dữ liệu...", "info");

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);

      if (jsonData.length === 0) {
        showToast("File Excel không có dữ liệu", "error");
        setProcessingId(null);
        return;
      }

      const response = await fetch(activeTemplate.fileBase64);
      const wordBuffer = await response.arrayBuffer();
      const zipOutput = new JSZip();

      jsonData.forEach((row: any, index: number) => {
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
      
      const res = await fetch('/api/tao-van-ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SAVE_HISTORY',
          templateId: activeTemplate.id,
          excelName: file.name,
          recordCount: jsonData.length,
          dataSnapshot: jsonData
        })
      });

      if (res.ok) {
        const newHistory = await res.json();
        setTemplates(prev => prev.map(t => t.id === activeTemplate.id ? { ...t, histories: [newHistory, ...t.histories] } : t));
        showToast(`Xuất thành công ${jsonData.length} văn bản`, "success");
      }
    } catch (error) {
      showToast("Lỗi trộn dữ liệu, kiểm tra lại biến trong file mẫu", "error");
    } finally {
      setProcessingId(null);
    }
  };

  if (isChecking) return null;

  if (!isLoggedIn) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-slate-100 p-4 rounded-full mb-4"><LockKeyhole className="w-8 h-8 text-slate-800" /></div>
            <h1 className="text-2xl font-bold text-slate-800">Truy Cập Hệ Thống</h1>
            <p className="text-sm text-slate-500 mt-1">Trình kết xuất văn bản tự động</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Tài khoản" className="w-full pl-10 p-3.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 font-medium focus:ring-2 focus:ring-slate-800 outline-none transition-all" />
            </div>
            <div className="relative">
              <LockKeyhole className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mật khẩu" className="w-full pl-10 p-3.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 font-medium focus:ring-2 focus:ring-slate-800 outline-none transition-all" />
            </div>
            <button type="submit" className="w-full py-3.5 mt-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-md transition-all">Đăng Nhập</button>
          </form>
        </div>
        
        {toast && (
          <div className={`fixed top-6 right-6 px-4 py-3 rounded-lg shadow-xl border flex items-center gap-3 animate-in slide-in-from-right-full z-50 ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            <span className="font-semibold text-sm">{toast.msg}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      
      {toast && (
        <div className={`fixed top-6 right-6 px-4 py-3 rounded-lg shadow-xl border flex items-center gap-3 animate-in slide-in-from-right-full z-[100] ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <Loader2 className="w-5 h-5 animate-spin" />}
          <span className="font-semibold text-sm">{toast.msg}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            Quản Lý Mẫu Văn Bản {isLoadingDB && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Kết xuất hàng loạt với 1 click tải lên Excel</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="file" ref={wordInputRef} onChange={handleWordSelect} accept=".docx" className="hidden" />
          <button 
            onClick={() => wordInputRef.current?.click()} 
            disabled={isLoadingDB}
            className="flex items-center gap-2 px-5 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-lg font-bold transition-all shadow-sm text-sm"
          >
            <PlusCircle className="w-4 h-4" /> Tải lên File Mẫu (.docx)
          </button>
          <button onClick={handleLogout} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Đăng xuất</button>
        </div>
      </div>

      <input type="file" ref={excelInputRef} onChange={handleExcelAutoProcess} accept=".xlsx, .xls" className="hidden" />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-5 py-4 font-bold w-12 text-center">STT</th>
                <th className="px-5 py-4 font-bold">Tên Mẫu</th>
                <th className="px-5 py-4 font-bold text-center">Thống kê</th>
                <th className="px-5 py-4 font-bold text-right">Thao tác xử lý</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {templates.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-slate-400">
                    <FileArchive className="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-1" />
                    <p className="font-medium text-base text-slate-500">{isLoadingDB ? 'Đang đồng bộ...' : 'Chưa có mẫu văn bản'}</p>
                  </td>
                </tr>
              ) : (
                templates.map((template, index) => {
                  const isProcessing = processingId === template.id;
                  return (
                    <tr key={template.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4 text-center font-bold text-slate-400">{index + 1}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText className="w-5 h-5"/></div>
                          <div>
                            <p className="font-bold text-slate-800 truncate max-w-[250px]">{template.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{template.keys.length} từ khóa được định nghĩa</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button 
                          onClick={() => {setHistoryTemplate(template); setIsHistoryModalOpen(true);}}
                          className="inline-flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-lg transition-colors text-xs text-slate-600 hover:bg-slate-100"
                        >
                          <History className="w-4 h-4" /> {template.histories?.length || 0} lần xuất
                        </button>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => downloadExcelTemplate(template)}
                            className="flex items-center gap-1.5 px-3 py-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 font-semibold rounded-lg transition-all shadow-sm text-xs"
                          >
                            <Download className="w-4 h-4" /> Excel Mẫu
                          </button>
                          <button 
                            onClick={() => triggerProcess(template)}
                            disabled={isProcessing || processingId !== null}
                            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg transition-all shadow-sm text-xs"
                          >
                            {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin"/> Đang xử lý</> : <><PlayCircle className="w-4 h-4" /> Ghép dữ liệu</>}
                          </button>
                          <button 
                            onClick={() => removeTemplate(template.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-colors"
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

      {isHistoryModalOpen && historyTemplate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <History className="w-5 h-5 text-slate-500"/> Lịch sử: <span className="truncate max-w-[300px] font-medium ml-1">{historyTemplate.name}</span>
              </h2>
              <button onClick={() => setIsHistoryModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-0">
              {(!historyTemplate.histories || historyTemplate.histories.length === 0) ? (
                <div className="py-16 text-center text-slate-400"><CalendarClock className="w-12 h-12 mx-auto mb-3 text-slate-200" /><p className="font-medium text-base">Chưa có dữ liệu xuất</p></div>
              ) : (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-white text-slate-500 sticky top-0 border-b border-slate-200 text-xs uppercase tracking-wider z-10 shadow-sm">
                    <tr><th className="px-6 py-4 font-bold w-12 text-center">Lần</th><th className="px-6 py-4 font-bold">Thời gian</th><th className="px-6 py-4 font-bold">Nguồn Excel</th><th className="px-6 py-4 font-bold text-center">Số VB</th><th className="px-6 py-4 font-bold text-right">Chi tiết</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyTemplate.histories.map((hist, i) => (
                      <tr key={hist.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-center font-bold text-slate-400">{historyTemplate.histories.length - i}</td>
                        <td className="px-6 py-4 font-medium text-slate-600">{new Date(hist.createdAt).toLocaleString('vi-VN')}</td>
                        <td className="px-6 py-4 font-medium text-slate-800 flex items-center gap-2"><FileSpreadsheet className="w-4 h-4 text-slate-400"/> {hist.excelName}</td>
                        <td className="px-6 py-4 text-center"><span className="bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-md text-xs">{hist.recordCount} file</span></td>
                        <td className="px-6 py-4 text-right">
                          {hist.dataSnapshot && hist.dataSnapshot.length > 0 ? (
                            <button onClick={() => setPreviewData(hist.dataSnapshot!)} className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 bg-white font-bold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 shadow-sm"><Table className="w-4 h-4" /> Xem data</button>
                          ) : <span className="text-xs text-slate-400">Trống</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {previewData && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <div className="p-4 border-b bg-slate-800 text-white flex justify-between items-center"><h2 className="text-base font-bold flex items-center gap-2"><Table className="w-4 h-4 text-slate-400"/> Dữ liệu nội dung</h2><button onClick={() => setPreviewData(null)} className="p-1.5 hover:bg-slate-700 rounded-lg"><X className="w-5 h-5" /></button></div>
            <div className="overflow-auto flex-1 p-0">
              <table className="w-full text-left text-sm whitespace-nowrap"><thead className="bg-slate-50 sticky top-0 border-b text-xs uppercase z-10 shadow-sm text-slate-600"><tr><th className="px-4 py-3 font-bold text-center w-12 border-r">STT</th>{Object.keys(previewData[0]).map((key, i) => <th key={i} className="px-4 py-3 font-bold border-r">{key}</th>)}</tr></thead><tbody className="divide-y">
                {previewData.map((row, rowIndex) => <tr key={rowIndex} className="hover:bg-slate-50"><td className="px-4 py-3 text-center font-bold text-slate-400 border-r">{rowIndex + 1}</td>{Object.keys(previewData[0]).map((key, colIndex) => <td key={colIndex} className="px-4 py-3 text-slate-700 border-r max-w-[300px] truncate" title={row[key]}>{row[key]}</td>)}</tr>)}
              </tbody></table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}