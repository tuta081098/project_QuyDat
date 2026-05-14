"use client";

import { useState, useEffect, useRef } from "react";
import { 
  FileText, Upload, LockKeyhole, User, FileSpreadsheet, 
  Download, PlayCircle, Trash2, X, PlusCircle, History, 
  Table, Loader2, CheckCircle2, AlertCircle, FileArchive
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

  const handleExcelAutoProcess = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeTemplate) return;
    if (excelInputRef.current) excelInputRef.current.value = '';

    setProcessingId(activeTemplate.id);
    showToast("Đang kết xuất...", "info");

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);

      if (jsonData.length === 0) {
        showToast("Excel trống", "error");
        setProcessingId(null);
        return;
      }

      const response = await fetch(activeTemplate.fileBase64);
      const wordBuffer = await response.arrayBuffer();
      const zipOutput = new JSZip();

      jsonData.forEach((row: any, index: number) => {
        const zip = new PizZip(wordBuffer);
        const doc = new Docxtemplater(zip, { 
          paragraphLoop: true, 
          linebreaks: true,
          // Nếu dữ liệu trống thì trả về chuỗi rỗng
          nullGetter() { return ""; } 
        });
        
        doc.render(row);
        const outDocBuffer = doc.getZip().generate({
          type: "blob",
          mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
        const personName = row['HoTen'] || row['Tên'] || row['Name'] || `File_${index + 1}`;
        zipOutput.file(`${personName}.docx`, outDocBuffer);
      });

      const zipBlob = await zipOutput.generateAsync({ type: "blob" });
      saveAs(zipBlob, `KetXuat_${activeTemplate.name.split('.')[0]}.zip`);
      
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
        showToast(`Thành công ${jsonData.length} văn bản`, "success");
      }
    } catch {
      showToast("Lỗi kết xuất dữ liệu", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const removeTemplate = async (id: string) => {
    if(confirm("Xác nhận xóa mẫu?")) {
      setTemplates(templates.filter(t => t.id !== id));
      await fetch(`/api/tao-van-ban?id=${id}`, { method: 'DELETE' });
      showToast("Đã xóa", "info");
    }
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
            <div className="relative">
              <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Tài khoản" className="w-full pl-10 p-3.5 border rounded-xl outline-none focus:ring-2 focus:ring-slate-800 transition-all" />
            </div>
            <div className="relative">
              <LockKeyhole className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mật khẩu" className="w-full pl-10 p-3.5 border rounded-xl outline-none focus:ring-2 focus:ring-slate-800 transition-all" />
            </div>
            <button type="submit" className="w-full py-3.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-all">Đăng Nhập</button>
          </form>
        </div>
        {toast && <div className="fixed top-6 right-6 px-4 py-3 rounded-lg shadow-xl bg-white border animate-in slide-in-from-right-full z-50 flex items-center gap-2"><span className="text-sm font-bold">{toast.msg}</span></div>}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 animate-in fade-in">
      {toast && <div className={`fixed top-6 right-6 px-4 py-3 rounded-lg shadow-xl border flex items-center gap-3 z-[100] animate-in slide-in-from-right-full ${toast.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}><span className="font-bold text-sm">{toast.msg}</span></div>}

      <div className="bg-white p-5 rounded-2xl shadow-sm border flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Quản Lý Mẫu Văn Bản</h1>
          <p className="text-sm text-slate-500">Tự động để trống nếu dữ liệu Excel không tồn tại</p>
        </div>
        <div className="flex gap-3">
          <input type="file" ref={wordInputRef} onChange={handleWordSelect} accept=".docx" className="hidden" />
          <button onClick={() => wordInputRef.current?.click()} className="px-5 py-2 bg-slate-800 text-white rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-900 transition-all"><PlusCircle className="w-4 h-4" /> Thêm Mẫu</button>
          <button onClick={handleLogout} className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-red-500 transition-colors">Đăng xuất</button>
        </div>
      </div>

      <input type="file" ref={excelInputRef} onChange={handleExcelAutoProcess} accept=".xlsx, .xls" className="hidden" />

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
            <tr>
              <th className="px-6 py-4 font-bold w-12">STT</th>
              <th className="px-6 py-4 font-bold">Tên Mẫu</th>
              <th className="px-6 py-4 font-bold text-center">Lịch sử</th>
              <th className="px-6 py-4 font-bold text-right">Hành động</th>
            </tr>
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
                    <button onClick={() => {setHistoryTemplate(template); setIsHistoryModalOpen(true);}} className="text-blue-600 font-bold hover:underline flex items-center gap-1 mx-auto"><History className="w-4 h-4"/> {template.histories?.length || 0} lần</button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => {setActiveTemplate(template); excelInputRef.current?.click();}} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-emerald-700 transition-all flex items-center gap-1">{processingId === template.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <PlayCircle className="w-3 h-3"/>} Ghép dữ liệu</button>
                      <button onClick={() => removeTemplate(template.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isHistoryModalOpen && historyTemplate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-800">Lịch sử: {historyTemplate.name}</h2>
              <button onClick={() => setIsHistoryModalOpen(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
            </div>
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left text-sm">
                <thead className="bg-white sticky top-0 border-b text-slate-500 uppercase text-[10px]">
                  <tr><th className="px-6 py-4">Thời gian</th><th className="px-6 py-4">File Excel</th><th className="px-6 py-4 text-center">Số lượng</th><th className="px-6 py-4 text-right">Dữ liệu</th></tr>
                </thead>
                <tbody className="divide-y">
                  {historyTemplate.histories.map((hist) => (
                    <tr key={hist.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium">{new Date(hist.createdAt).toLocaleString('vi-VN')}</td>
                      <td className="px-6 py-4 text-slate-600">{hist.excelName}</td>
                      <td className="px-6 py-4 text-center font-bold">{hist.recordCount} file</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => setPreviewData(hist.dataSnapshot!)} className="text-xs font-bold border px-2 py-1 rounded hover:bg-slate-50">Xem chi tiết</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {previewData && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <div className="p-4 border-b bg-slate-800 text-white flex justify-between items-center font-bold">
              <span>Dữ liệu đã nạp</span>
              <button onClick={() => setPreviewData(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-auto flex-1">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 sticky top-0 border-b">
                  <tr>
                    <th className="px-4 py-3 border-r w-10 text-center">STT</th>
                    {Object.keys(previewData[0] || {}).map((key) => <th key={key} className="px-4 py-3 border-r font-bold">{key}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {previewData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/30">
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