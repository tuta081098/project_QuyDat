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
  const [namingTemplate, setNamingTemplate] = useState<string>("");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [historyTemplate, setHistoryTemplate] = useState<TemplateItem | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'|'info'} | null>(null);

  const templateInputRef = useRef<HTMLInputElement>(null);
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
      showToast("Lỗi kết nối máy chủ", "error");
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
      showToast("Sai tài khoản hoặc mật khẩu", "error");
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

  // ===============================================
  // ĐỌC MẪU (HỖ TRỢ DOCX VÀ XLSX)
  // ===============================================
  const handleTemplateSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (templateInputRef.current) templateInputRef.current.value = ''; 
    if (!file) return;

    const isDocx = file.name.endsWith('.docx');
    const isXlsx = file.name.endsWith('.xlsx');

    if (!isDocx && !isXlsx) {
      return showToast("Chỉ hỗ trợ file mẫu .docx hoặc .xlsx", "error");
    }

    if (file.size > 3 * 1024 * 1024) return showToast("File quá lớn (>3MB)", "error");
    setIsLoadingDB(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const extractedKeys = new Set<string>();
      const regex = /\{([^}]+)\}/g; 

      if (isDocx) {
        const zip = new PizZip(arrayBuffer);
        const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
        const text = doc.getFullText();
        let match;
        while ((match = regex.exec(text)) !== null) {
          let key = match[1].trim();
          if (key.startsWith('#') || key.startsWith('/')) key = key.substring(1).trim();
          if (key.length > 0 && key.length < 50) extractedKeys.add(key);
        }
      } else if (isXlsx) {
        const wb = XLSX.read(arrayBuffer, { type: "array" });
        wb.SheetNames.forEach(sheetName => {
          const sheet = wb.Sheets[sheetName];
          for (const cell in sheet) {
            if (!cell.startsWith('!') && sheet[cell].v && typeof sheet[cell].v === 'string') {
              let match;
              while ((match = regex.exec(sheet[cell].v)) !== null) {
                let key = match[1].trim();
                if (key.length > 0 && key.length < 50) extractedKeys.add(key);
              }
            }
          }
        });
      }

      if (extractedKeys.size === 0) {
        showToast("Không tìm thấy biến {key} nào trong file", "error");
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
        const newT = await res.json();
        setTemplates(prev => [newT, ...prev]);
        showToast(`Đã thêm mẫu ${isDocx ? 'Word' : 'Excel'}`, "success");
      }
    } catch {
      showToast("Lỗi đọc file mẫu", "error");
    } finally {
      setIsLoadingDB(false);
    }
  };

  // TẢI FILE EXCEL DATA MẪU (CHIA TỐI ĐA 70 KEY 1 SHEET)
  const downloadExcelTemplate = (template: TemplateItem) => {
    if (!template.keys || template.keys.length === 0) {
      showToast("Mẫu này không có biến nào.", "error");
      return;
    }

    const workbook = XLSX.utils.book_new();
    const MAX_KEYS_PER_SHEET = 70;

    // Chia keys thành các mảng con (chunks) tối đa 70 phần tử
    for (let i = 0; i < template.keys.length; i += MAX_KEYS_PER_SHEET) {
      const chunk = template.keys.slice(i, i + MAX_KEYS_PER_SHEET);
      const headerRow: any = {};
      chunk.forEach(key => { headerRow[key] = "" });
      
      const worksheet = XLSX.utils.json_to_sheet([headerRow]);
      const sheetIndex = Math.floor(i / MAX_KEYS_PER_SHEET) + 1;
      XLSX.utils.book_append_sheet(workbook, worksheet, `Data_${sheetIndex}`);
    }

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    saveAs(dataBlob, `Mau_NhapLieu_${template.name.split('.')[0]}.xlsx`);
  };


  // ĐỌC DỮ LIỆU EXCEL TỪ TẤT CẢ CÁC SHEET VÀ GỘP LẠI THEO TỪNG DÒNG
  const handleExcelSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (excelInputRef.current) excelInputRef.current.value = '';
    if (!file) return;
    setExcelFile(file);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      
      let mergedData: any[] = [];

      // Quét qua tất cả các Sheet trong file Excel
      workbook.SheetNames.forEach(sheetName => {
        const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { raw: false });
        
        // Gộp dữ liệu của sheet hiện tại vào mergedData theo số thứ tự dòng (index)
        sheetData.forEach((rowObj: any, index: number) => {
          if (!mergedData[index]) {
            mergedData[index] = {};
          }
          mergedData[index] = { ...mergedData[index], ...rowObj };
        });
      });

      // Lọc bỏ những dòng trống hoàn toàn (nếu có)
      mergedData = mergedData.filter(row => Object.keys(row).length > 0);
      
      setExcelData(mergedData);
      
      if (mergedData.length > 0) {
        const cols = Object.keys(mergedData[0] as object);
        setExcelColumns(cols);
        const autoCol = cols.find(c => ['hoten', 'tên', 'name', 'ho_ten'].includes(c.toLowerCase()));
        setNamingTemplate(autoCol ? `File_{${autoCol}}` : "File_{index}");
      }
    } catch {
      showToast("Lỗi đọc file Excel Dữ liệu", "error");
    }
  };

  const resolveFileName = (pattern: string, row: any, index: number) => {
    if (!pattern) return `File_${index + 1}`;
    let result = pattern.replace(/\{([^}]+)\}/g, (_match: string, key: string) => {
      const cleanKey = key.trim();
      if (cleanKey.toLowerCase() === 'index') return String(index + 1);
      return row[cleanKey] !== undefined && row[cleanKey] !== null ? String(row[cleanKey]) : "";
    });
    return result.replace(/[<>:"/\\|?*]/g, '').trim() || `File_${index + 1}`;
  };

  const escapeXml = (unsafeStr: string) => {
    return unsafeStr.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  };

  // ===============================================
  // KẾT XUẤT (DOCX & XLSX)
  // ===============================================
  const handleGenerate = async () => {
    if (!activeTemplate || !excelFile || excelData.length === 0) return;
    setIsGenerating(true);
    
    try {
      const isDocx = activeTemplate.name.endsWith('.docx');
      const isXlsx = activeTemplate.name.endsWith('.xlsx');

      const response = await fetch(activeTemplate.fileBase64);
      const templateBuffer = await response.arrayBuffer();
      const zipOutput = new JSZip();

      for (let index = 0; index < excelData.length; index++) {
        const row = excelData[index];
        const finalFileName = resolveFileName(namingTemplate, row, index);

        if (isDocx) {
          const zip = new PizZip(templateBuffer);
          const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true, nullGetter() { return ""; } });
          doc.render(row);
          const outDocBuffer = doc.getZip().generate({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
          zipOutput.file(`${finalFileName}.docx`, outDocBuffer);
        } 
        else if (isXlsx) {
          const templateZip = await new JSZip().loadAsync(templateBuffer);
          const xmlFiles = Object.keys(templateZip.files).filter(name => name.endsWith('.xml'));

          for (const fileName of xmlFiles) {
            let content = await templateZip.file(fileName)?.async("string");
            
            if (content && content.includes('{')) {
              const newContent = content.replace(/\{([^}]+)\}/g, (_match: string, key: string) => {
                const cleanKey = key.trim();
                let val = "";
                if (cleanKey.toLowerCase() === 'index') {
                  val = String(index + 1);
                } else {
                  val = row[cleanKey] !== undefined && row[cleanKey] !== null ? String(row[cleanKey]) : "";
                }
                return escapeXml(val);
              });
              templateZip.file(fileName, newContent);
            }
          }

          const outBuffer = await templateZip.generateAsync({ type: "blob" });
          zipOutput.file(`${finalFileName}.xlsx`, outBuffer);
        }
      }

      const zipBlob = await zipOutput.generateAsync({ type: "blob" });
      saveAs(zipBlob, `KetXuat_${activeTemplate.name.split('.')[0]}_${new Date().getTime()}.zip`);
      
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
      showToast("Kết xuất thành công, đã giữ nguyên định dạng!", "success");
    } catch (error) {
      console.error(error);
      showToast("Lỗi trong quá trình trộn dữ liệu", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const removeTemplate = async (id: string) => {
    if (confirm("Xóa mẫu này khỏi hệ thống?")) {
      setTemplates(templates.filter(t => t.id !== id));
      await fetch(`/api/tao-van-ban?id=${id}`, { method: 'DELETE' });
    }
  };

  const openUseModal = (template: TemplateItem) => {
    setActiveTemplate(template);
    setExcelFile(null);
    setExcelData([]);
    setExcelColumns([]);
    setNamingTemplate("File_{index}");
    setIsModalOpen(true);
  };

  if (isChecking) return null;

  if (!isLoggedIn) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl border w-full max-w-md animate-in fade-in zoom-in-95">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-slate-100 p-4 rounded-2xl mb-4"><LockKeyhole className="w-8 h-8 text-slate-800" /></div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Hệ Thống Kết Xuất</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative"><User className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Tài khoản" className="w-full pl-11 p-4 border border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-800 transition-all outline-none" /></div>
            <div className="relative"><LockKeyhole className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mật khẩu" className="w-full pl-11 p-4 border border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-800 transition-all outline-none" /></div>
            <button type="submit" className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-black transition-all shadow-lg">Đăng Nhập</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      {toast && <div className={`fixed top-6 right-6 px-5 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 z-[100] animate-in slide-in-from-right-full ${toast.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-slate-900 text-white border-slate-800'}`}><span className="font-bold text-sm">{toast.msg}</span></div>}

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Quản Lý Văn Bản</h1>
          <p className="text-slate-500 text-sm font-medium">Hỗ trợ kết xuất hàng loạt ra Word & Excel</p>
        </div>
        <div className="flex gap-3">
          <input type="file" ref={templateInputRef} onChange={handleTemplateSelect} accept=".docx, .xlsx" className="hidden" />
          <button onClick={() => templateInputRef.current?.click()} className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm flex items-center gap-2 hover:scale-105 transition-all shadow-md"><PlusCircle className="w-5 h-5" /> Tải Lên Mẫu</button>
          <button onClick={handleLogout} className="p-3 text-slate-400 hover:text-red-500 transition-colors"><X className="w-6 h-6"/></button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-black tracking-widest">
              <tr><th className="px-6 py-5 w-16 text-center">STT</th><th className="px-6 py-5">Tên file mẫu</th><th className="px-6 py-5 text-center">Lịch sử</th><th className="px-6 py-5 text-right">Hành động</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {templates.length === 0 ? (
                <tr><td colSpan={4} className="py-24 text-center text-slate-300 font-bold italic">Chưa có mẫu nào trên hệ thống</td></tr>
              ) : (
                templates.map((t, i) => (
                  <tr key={t.id} className="group hover:bg-slate-50/50 transition-all">
                    <td className="px-6 py-5 text-center text-slate-400 font-bold">{i + 1}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${t.name.endsWith('.xlsx') ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                          {t.name.endsWith('.xlsx') ? <FileSpreadsheet className="w-5 h-5"/> : <FileText className="w-5 h-5"/>}
                        </div>
                        <span className="font-bold text-slate-800">{t.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button onClick={() => {setHistoryTemplate(t); setIsHistoryModalOpen(true);}} className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-[11px] font-black group-hover:bg-blue-600 group-hover:text-white transition-all">{t.histories?.length || 0} lần</button>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => downloadExcelTemplate(t)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Tải File Nhập Liệu"><Download className="w-5 h-5"/></button>
                        <button onClick={() => openUseModal(t)} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-emerald-700 shadow-sm flex items-center gap-2 transition-all active:scale-95"><PlayCircle className="w-4 h-4"/> Ghép dữ liệu</button>
                        <button onClick={() => removeTemplate(t.id)} className="p-2.5 text-slate-300 hover:text-red-500 rounded-xl transition-all"><Trash2 className="w-5 h-5"/></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <input type="file" ref={excelInputRef} onChange={handleExcelSelect} accept=".xlsx, .xls" className="hidden" />

      {isModalOpen && activeTemplate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <h2 className="font-black text-slate-900 flex items-center gap-2 uppercase text-sm tracking-tighter"><Settings className="w-5 h-5" /> Cấu hình xuất: {activeTemplate.name.endsWith('.xlsx') ? 'EXCEL' : 'WORD'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-8 space-y-6">
              <div onClick={() => excelInputRef.current?.click()} className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${excelFile ? 'border-emerald-200 bg-emerald-50/30 scale-[0.98]' : 'border-slate-100 hover:border-slate-300 bg-slate-50/50'}`}>
                {excelFile ? (<><FileSpreadsheet className="w-12 h-12 text-emerald-600 mb-3" /><p className="font-bold text-slate-900">{excelFile.name}</p><p className="text-xs text-emerald-600 font-bold mt-1">Dữ liệu: {excelData.length} bản ghi</p></>) : (<><Upload className="w-10 h-10 text-slate-200 mb-3" /><p className="font-bold text-slate-400 text-sm">Nạp data Excel (.xlsx)</p></>)}
              </div>
              {excelData.length > 0 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Quy tắc đặt tên file con</label>
                    <input type="text" value={namingTemplate} onChange={(e) => setNamingTemplate(e.target.value)} placeholder="Ví dụ: vanban_{HO_TEN}_so_{index}" className="w-full p-4 border-2 border-slate-50 rounded-2xl focus:border-slate-900 focus:bg-white bg-slate-50 outline-none font-bold text-sm transition-all" />
                    <div className="mt-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                      <p className="text-[10px] text-blue-400 font-black uppercase mb-2 flex items-center gap-1"><Info className="w-3 h-3" /> Kết quả file mẫu (Dòng 1):</p>
                      <p className="text-xs font-mono text-blue-700 font-bold break-all">{resolveFileName(namingTemplate, excelData[0], 0)}.{activeTemplate.name.endsWith('.xlsx') ? 'xlsx' : 'docx'}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2"><span className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold border border-slate-200 uppercase">{"{index}"}</span>{excelColumns.map(c => <span key={c} className="px-3 py-1.5 bg-white text-blue-600 rounded-lg text-[10px] font-bold border border-blue-100 uppercase">{"{" + c + "}"}</span>)}</div>
                </div>
              )}
            </div>
            <div className="p-6 bg-slate-50/50 flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-bold text-slate-400 hover:text-slate-600 transition-all">Hủy</button>
              <button onClick={handleGenerate} disabled={!excelFile || isGenerating} className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-slate-200 disabled:opacity-50 transition-all active:scale-95">{isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileArchive className="w-5 h-5" />} Bắt đầu tải về ZIP</button>
            </div>
          </div>
        </div>
      )}

      {isHistoryModalOpen && historyTemplate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center"><h2 className="font-black text-slate-900 uppercase text-xs tracking-widest">Lịch sử xuất: {historyTemplate.name}</h2><button onClick={() => setIsHistoryModalOpen(false)}><X className="w-6 h-6 text-slate-300" /></button></div>
            <div className="overflow-y-auto flex-1 p-0">
              <table className="w-full text-left text-sm"><thead className="bg-slate-50 sticky top-0 border-b text-[10px] font-black uppercase text-slate-400"><tr><th className="px-6 py-4">Thời gian</th><th className="px-6 py-4">Nguồn dữ liệu</th><th className="px-6 py-4 text-center">Số lượng</th><th className="px-6 py-4 text-right">Thao tác</th></tr></thead>
                <tbody className="divide-y divide-slate-50">{historyTemplate.histories.map((h, i) => (
                    <tr key={h.id} className="hover:bg-slate-50/50 transition-all"><td className="px-6 py-5 font-bold text-slate-500">{new Date(h.createdAt).toLocaleString('vi-VN')}</td><td className="px-6 py-5 font-bold text-slate-800 truncate max-w-[200px]">{h.excelName}</td><td className="px-6 py-5 text-center"><span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-black text-[10px]">{h.recordCount} file</span></td><td className="px-6 py-5 text-right"><button onClick={() => setPreviewData(h.dataSnapshot!)} className="text-[10px] font-black uppercase border-2 border-slate-100 px-3 py-1.5 rounded-xl hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all">Chi tiết</button></td></tr>
                  ))}</tbody></table>
            </div>
          </div>
        </div>
      )}

      {previewData && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-[40px] w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <div className="p-6 border-b bg-slate-900 text-white flex justify-between items-center"><div className="flex items-center gap-3"><Table className="w-5 h-5 text-blue-400" /><h2 className="font-black uppercase text-xs tracking-widest">Dữ liệu lưu trữ</h2></div><button onClick={() => setPreviewData(null)}><X className="w-6 h-6 text-slate-500" /></button></div>
            <div className="overflow-auto flex-1"><table className="w-full text-left text-[11px] whitespace-nowrap border-collapse"><thead className="bg-slate-50 sticky top-0 border-b shadow-sm"><tr><th className="px-5 py-4 font-black text-slate-400 bg-slate-50 text-center w-12 border-r">#</th>{Object.keys(previewData[0] || {}).map(k => <th key={k} className="px-5 py-4 font-black text-slate-600 bg-slate-50 border-r">{k}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">{previewData.map((row, idx) => (<tr key={idx} className="hover:bg-blue-50/30 transition-all"><td className="px-5 py-3 border-r text-center text-slate-300 font-bold">{idx + 1}</td>{Object.keys(previewData[0] || {}).map(k => <td key={k} className="px-5 py-3 border-r text-slate-600 font-medium">{row[k] !== undefined && row[k] !== null ? String(row[k]) : ""}</td>)}</tr>))}</tbody></table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}