"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, FileWarning, ClipboardList, Clock, 
  CheckCircle2, History, Plus, Info, Activity, 
  Edit3, Save, Calendar, AlertTriangle, BellRing, X,
  LayoutGrid, List // MỚI: Icon cho nút chuyển đổi giao diện
} from "lucide-react";
import { DASHBOARD_TEXT as T } from "@/src/constants/dashboard-text";

const OPTION_TIENDO = ["Đấu giá", "HTKT", "Trường", "Đường", "Ngoài ngân sách", "Trung ương"];
const OPTION_CHITIET = ["Chưa nhận mốc", "Đã nhận mốc", "Chưa có mốc"];

const inputStyles = "w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all";
const numberInputStyles = "w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 font-bold text-lg focus:ring-2 focus:ring-orange-500 outline-none shadow-sm transition-all";

const formatForInput = (dateStr: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function DashboardClient({ initialProjects }: any) {
  const router = useRouter();
  
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'PROGRESS' | 'HISTORY'>('PROGRESS');
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CHUA_BAN_HANH' | 'CHUA_KIEM_KE' | 'DANG_GIAI_QUYET'>('ALL');

  // MỚI: State quản lý chế độ xem (Lưới hoặc Bảng)
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('LIST'); // Mặc định mở Dạng Bảng cho gọn

  const [formProgress, setFormProgress] = useState({
    chuaBanHanhCount: 0, chuaKiemKeCount: 0, xacNhanCount: 0, duThaoCount: 0, thamDinhCount: 0, pheDuyetCount: 0
  });

  const defaultDetails = { 
    name: "", code: "", deadline: "", 
    tienDoDuAn: OPTION_TIENDO[0], chiTiet: OPTION_CHITIET[0], 
    donViDoDac: "", canBoGPMB: "", mo: "", ghiChu: "" 
  };
  const [formDetails, setFormDetails] = useState(defaultDetails);

  const [overdueProjects, setOverdueProjects] = useState<any[]>([]);
  const [dismissedNotifs, setDismissedNotifs] = useState<string[]>([]);
  
  useEffect(() => {
    const scanDeadlines = () => {
      const now = new Date().getTime();
      const overdue = initialProjects.filter((p: any) => {
        if (dismissedNotifs.includes(p.id)) return false; 
        if (!p.deadline) return false;
        const isNotFinished = p.pheDuyetCount < p.totalLots || p.totalLots === 0;
        const hasPassed = new Date(p.deadline).getTime() < now;
        return isNotFinished && hasPassed;
      });
      setOverdueProjects(overdue);
    };

    scanDeadlines(); 
    const interval = setInterval(scanDeadlines, 60000); 
    return () => clearInterval(interval);
  }, [initialProjects, dismissedNotifs]);

  const handleDismissNotif = (projectId: string) => setDismissedNotifs((prev) => [...prev, projectId]);

  const currentTotalLots = formProgress.chuaBanHanhCount + formProgress.chuaKiemKeCount + formProgress.xacNhanCount + formProgress.duThaoCount + formProgress.thamDinhCount + formProgress.pheDuyetCount;

  const filteredProjects = initialProjects.filter((project: any) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'CHUA_BAN_HANH') return project.chuaBanHanhCount > 0;
    if (activeFilter === 'CHUA_KIEM_KE') return project.chuaKiemKeCount > 0;
    if (activeFilter === 'DANG_GIAI_QUYET') return (project.xacNhanCount + project.duThaoCount + project.thamDinhCount + project.pheDuyetCount) > 0;
    return true;
  });

  const sortedProjects = [...filteredProjects].sort((a: any, b: any) => {
    const now = new Date().getTime();
    const isOverdueA = a.deadline && new Date(a.deadline).getTime() < now && a.status !== "COMPLETED";
    const isOverdueB = b.deadline && new Date(b.deadline).getTime() < now && b.status !== "COMPLETED";
    if (isOverdueA && !isOverdueB) return -1;
    if (!isOverdueA && isOverdueB) return 1;
    return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
  });

  const totalProjects = initialProjects.length;
  const totalChuaBanHanh = initialProjects.reduce((sum: number, p: any) => sum + (p.chuaBanHanhCount || 0), 0);
  const totalChuaKiemKe = initialProjects.reduce((sum: number, p: any) => sum + (p.chuaKiemKeCount || 0), 0);
  const totalDangGiaiQuyet = initialProjects.reduce((sum: number, p: any) => sum + (p.xacNhanCount || 0) + (p.duThaoCount || 0) + (p.thamDinhCount || 0) + (p.pheDuyetCount || 0), 0);

  const handleOpenModal = (project: any) => {
    const freshProject = initialProjects.find((p: any) => p.id === project.id) || project;
    setSelectedProject(freshProject);
    setFormProgress({
      chuaBanHanhCount: freshProject.chuaBanHanhCount, chuaKiemKeCount: freshProject.chuaKiemKeCount,
      xacNhanCount: freshProject.xacNhanCount, duThaoCount: freshProject.duThaoCount,
      thamDinhCount: freshProject.thamDinhCount, pheDuyetCount: freshProject.pheDuyetCount
    });
    setFormDetails({
      name: freshProject.name, code: freshProject.code || "",
      deadline: freshProject.deadline ? formatForInput(freshProject.deadline) : "",
      tienDoDuAn: freshProject.details?.tienDoDuAn || OPTION_TIENDO[0], chiTiet: freshProject.details?.chiTiet || OPTION_CHITIET[0],
      donViDoDac: freshProject.details?.donViDoDac || "", canBoGPMB: freshProject.details?.canBoGPMB || "",
      mo: freshProject.details?.mo || "", ghiChu: freshProject.details?.ghiChu || ""
    });
    setIsEditingDetails(false);
    setActiveTab('PROGRESS'); 
    setIsModalOpen(true);
  };

  const handleCloseAll = () => { setIsModalOpen(false); setIsCreateModalOpen(false); setIsLoading(false); router.refresh(); };

  const handleCreateProject = async () => {
    if (!formDetails.name) return alert(T.NOTIFICATIONS.ERR_MISSING_NAME);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formDetails) });
      if (res.ok) handleCloseAll();
      else alert(T.NOTIFICATIONS.ERR_CREATE);
    } catch (error) { alert(T.NOTIFICATIONS.ERR_CONNECT); } finally { setIsLoading(false); }
  };

  const handleUpdateProgress = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${selectedProject.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({...formProgress, deadline: formDetails.deadline, action: 'UPDATE_PROGRESS'}) });
      if (res.ok) handleCloseAll();
    } catch (error) { alert(T.NOTIFICATIONS.ERR_CONNECT); } finally { setIsLoading(false); }
  };

  const handleUpdateDetails = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${selectedProject.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({...formDetails, action: 'UPDATE_DETAILS'}) });
      if (res.ok) {
        setIsEditingDetails(false);
        router.refresh();
        const updated = initialProjects.find((p: any) => p.id === selectedProject.id);
        if(updated) handleOpenModal(updated); 
      }
    } catch (error) { alert(T.NOTIFICATIONS.ERR_CONNECT); } finally { setIsLoading(false); }
  };

  return (
    <div className="space-y-6 relative">
      
      {/* THÔNG BÁO QUÁ HẠN */}
      {overdueProjects.length > 0 && (
        <div className="fixed top-6 right-6 z-[60] w-80 space-y-3 pointer-events-none">
          {overdueProjects.map((p: any) => (
            <div key={p.id} className="pointer-events-auto animate-in slide-in-from-right-full bg-white border-l-4 border-red-600 shadow-2xl p-4 pr-10 rounded-xl flex items-start gap-3 ring-1 ring-black/5 relative group">
              <button onClick={() => handleDismissNotif(p.id)} className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"><X className="w-4 h-4" /></button>
              <div className="bg-red-100 p-2 rounded-full animate-pulse shrink-0"><BellRing className="w-4 h-4 text-red-600" /></div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{p.name}</h4>
                <p className="text-xs text-red-600 font-bold mt-0.5">{T.NOTIFICATIONS.OVERDUE_TITLE}</p>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1"><Clock className="w-3 h-3" /><span>{T.NOTIFICATIONS.DEADLINE_LABEL} {new Date(p.deadline).toLocaleString('vi-VN', {hour: '2-digit', minute:'2-digit', day: '2-digit', month: '2-digit', year: 'numeric'})}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* HEADER THU GỌN LẠI */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{T.HEADER.TITLE}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{T.HEADER.SUBTITLE}</p>
        </div>
        
        {/* KHU VỰC CÔNG CỤ: TOGGLE VIEW & NÚT THÊM MỚI */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center bg-slate-200/60 p-1 rounded-lg">
            <button onClick={() => setViewMode('GRID')} title="Dạng Lưới" className={`p-1.5 rounded-md flex items-center justify-center transition-all ${viewMode === 'GRID' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('LIST')} title="Dạng Bảng" className={`p-1.5 rounded-md flex items-center justify-center transition-all ${viewMode === 'LIST' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>
              <List className="w-4 h-4" />
            </button>
          </div>

          <button onClick={() => { setFormDetails({...defaultDetails, deadline: ""}); setIsCreateModalOpen(true); }} className="flex-1 md:flex-none flex justify-center items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all shadow-md text-sm">
            <Plus className="w-4 h-4" /> {T.HEADER.BTN_ADD_NEW}
          </button>
        </div>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card onClick={() => setActiveFilter('ALL')} className={`cursor-pointer transition-all hover:shadow-md border-0 shadow-sm ${activeFilter === 'ALL' ? 'ring-2 ring-slate-800/30' : ''} bg-gradient-to-br from-slate-800 to-slate-900 text-white`}><CardHeader className="p-4 pb-1 flex flex-row items-center justify-between"><CardTitle className="text-xs font-medium opacity-80">{T.METRICS.TOTAL_PROJECTS}</CardTitle><Building2 className="h-4 w-4 opacity-70" /></CardHeader><CardContent className="p-4 pt-0"><div className="text-2xl font-bold">{totalProjects}</div></CardContent></Card>
        <Card onClick={() => setActiveFilter('CHUA_BAN_HANH')} className={`cursor-pointer transition-all hover:shadow-md shadow-sm ${activeFilter === 'CHUA_BAN_HANH' ? 'ring-2 ring-slate-400 bg-slate-50' : ''}`}><CardHeader className="p-4 pb-1 flex flex-row items-center justify-between"><CardTitle className="text-xs font-medium text-slate-500">{T.METRICS.CHUA_BAN_HANH}</CardTitle><FileWarning className="h-4 w-4 text-slate-400" /></CardHeader><CardContent className="p-4 pt-0"><div className="text-2xl font-bold text-slate-700">{totalChuaBanHanh}</div></CardContent></Card>
        <Card onClick={() => setActiveFilter('CHUA_KIEM_KE')} className={`cursor-pointer transition-all hover:shadow-md shadow-sm ${activeFilter === 'CHUA_KIEM_KE' ? 'ring-2 ring-blue-400 bg-blue-50/50' : ''}`}><CardHeader className="p-4 pb-1 flex flex-row items-center justify-between"><CardTitle className="text-xs font-medium text-slate-500">{T.METRICS.CHUA_KIEM_KE}</CardTitle><ClipboardList className="h-4 w-4 text-blue-400" /></CardHeader><CardContent className="p-4 pt-0"><div className="text-2xl font-bold text-blue-600">{totalChuaKiemKe}</div></CardContent></Card>
        <Card onClick={() => setActiveFilter('DANG_GIAI_QUYET')} className={`cursor-pointer transition-all hover:shadow-md shadow-sm ${activeFilter === 'DANG_GIAI_QUYET' ? 'ring-2 ring-orange-400 bg-orange-50/50' : ''}`}><CardHeader className="p-4 pb-1 flex flex-row items-center justify-between"><CardTitle className="text-xs font-medium text-slate-500">{T.METRICS.DANG_GIAI_QUYET}</CardTitle><Clock className="h-4 w-4 text-orange-400" /></CardHeader><CardContent className="p-4 pt-0"><div className="text-2xl font-bold text-orange-600">{totalDangGiaiQuyet}</div></CardContent></Card>
      </div>

      {sortedProjects.length === 0 && <div className="py-12 flex flex-col items-center justify-center text-slate-400 bg-slate-50 border-2 border-dashed rounded-xl"><FileWarning className="w-8 h-8 mb-2 opacity-50" /><p className="text-sm">{T.PROJECT_CARD.EMPTY_STATE}</p></div>}

      {/* HIỂN THỊ DANH SÁCH DỰ ÁN DỰA VÀO TOGGLE */}
      {sortedProjects.length > 0 && (
        viewMode === 'LIST' ? (
          /* =========================================
             GIAO DIỆN 1: DẠNG BẢNG (TABLE VIEW) 
             ========================================= */
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 font-bold">Tên dự án</th>
                    <th className="px-4 py-3 font-bold">Trạng thái</th>
                    <th className="px-4 py-3 font-bold">Hạn chót</th>
                    <th className="px-4 py-3 font-bold w-48">Tiến độ</th>
                    <th className="px-4 py-3 font-bold text-center">CBH</th>
                    <th className="px-4 py-3 font-bold text-center">CKK</th>
                    <th className="px-4 py-3 font-bold text-center">ĐGQ</th>
                    <th className="px-4 py-3 font-bold text-right">Tổng lô</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedProjects.map(project => {
                    const totalDangXuLy = project.xacNhanCount + project.duThaoCount + project.thamDinhCount + project.pheDuyetCount;
                    const progressPercent = project.totalLots > 0 ? Math.round((project.pheDuyetCount / project.totalLots) * 100) : 0;
                    const isCompleted = project.status === "COMPLETED";
                    const isOverdue = project.deadline && new Date(project.deadline).getTime() < new Date().getTime() && !isCompleted;

                    return (
                      <tr key={project.id} onClick={() => handleOpenModal(project)} className={`cursor-pointer transition-colors hover:bg-slate-50 ${isOverdue ? 'bg-red-50/40' : ''}`}>
                        <td className="px-4 py-3.5 font-bold text-slate-800 max-w-[250px] truncate" title={project.name}>{project.name}</td>
                        <td className="px-4 py-3.5">
                          {isCompleted ? <Badge className="bg-green-100 text-green-700 font-bold border-0 hover:bg-green-100">{T.PROJECT_CARD.COMPLETED}</Badge> : isOverdue ? <Badge className="bg-red-500 text-white font-bold border-0 animate-pulse hover:bg-red-500">{T.PROJECT_CARD.OVERDUE_BADGE}</Badge> : <Badge variant="outline" className="text-slate-500 font-bold bg-white">Đang xử lý</Badge>}
                        </td>
                        <td className={`px-4 py-3.5 font-semibold text-xs ${isOverdue ? 'text-red-600' : 'text-slate-500'}`}>
                          {project.deadline ? new Date(project.deadline).toLocaleDateString('vi-VN') : '---'}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <Progress value={progressPercent} className={`h-1.5 w-full ${isCompleted ? 'bg-green-200' : isOverdue ? 'bg-red-200' : ''}`} />
                            <span className="text-[10px] font-bold text-slate-600 w-6 text-right">{progressPercent}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-slate-500">{project.chuaBanHanhCount}</td>
                        <td className="px-4 py-3.5 text-center font-bold text-blue-600">{project.chuaKiemKeCount}</td>
                        <td className="px-4 py-3.5 text-center font-bold text-orange-500">{totalDangXuLy}</td>
                        <td className="px-4 py-3.5 text-right font-black text-slate-800 text-base">{project.totalLots}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* =========================================
             GIAO DIỆN 2: DẠNG LƯỚI THU GỌN (COMPACT GRID) 
             ========================================= */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 animate-in fade-in zoom-in-95 duration-200">
            {sortedProjects.map((project: any) => {
              const totalDangXuLy = project.xacNhanCount + project.duThaoCount + project.thamDinhCount + project.pheDuyetCount;
              const progressPercent = project.totalLots > 0 ? Math.round((project.pheDuyetCount / project.totalLots) * 100) : 0;
              const isCompleted = project.status === "COMPLETED";
              const isOverdue = project.deadline && new Date(project.deadline).getTime() < new Date().getTime() && !isCompleted;

              return (
                <Card key={project.id} className={`group hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden flex flex-col border border-slate-200 ${isCompleted ? 'bg-green-50/20' : isOverdue ? 'border-red-300 bg-red-50/30' : 'hover:border-blue-400'}`} onClick={() => handleOpenModal(project)}>
                  <div className={`h-1 w-full transition-opacity ${isCompleted ? 'bg-green-500 opacity-100' : isOverdue ? 'bg-red-500 opacity-100' : 'bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100'}`} />
                  
                  {/* PADDING THU GỌN XUỐNG p-4 */}
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <div className="overflow-hidden">
                        <CardTitle className="text-sm text-slate-800 font-bold truncate" title={project.name}>{project.name}</CardTitle>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Calendar className={`w-3 h-3 shrink-0 ${isOverdue ? 'text-red-600' : 'text-slate-400'}`} />
                          <span className={`text-[10px] font-bold truncate ${isOverdue ? 'text-red-600' : 'text-slate-500'}`}>
                            {project.deadline ? new Date(project.deadline).toLocaleDateString('vi-VN') : T.PROJECT_CARD.NO_DEADLINE}
                          </span>
                        </div>
                      </div>
                      {isCompleted && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />}
                      {isOverdue && <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 animate-bounce" />}
                    </div>
                  </CardHeader>
                  
                  {/* BỎ CÁC BADGE THỪA MÀU SẮC DÀI DÒNG, TẬP TRUNG VÀO SỐ LIỆU GỐC */}
                  <CardContent className="p-4 pt-2 flex-1 flex flex-col justify-end">
                    <div className="mb-3 space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider"><span>Tiến độ</span><span className="text-slate-700">{progressPercent}%</span></div>
                      <Progress value={progressPercent} className={`h-1.5 ${isCompleted ? 'bg-green-200' : isOverdue ? 'bg-red-200' : ''}`} />
                    </div>
                    {/* BẢNG TÓM TẮT SỐ LÔ SIÊU GỌN */}
                    <div className="grid grid-cols-3 gap-1 bg-slate-50 rounded-lg p-2 border border-slate-100">
                      <div className="flex flex-col items-center"><span className="text-[9px] text-slate-400 uppercase font-bold mb-0.5">CBH</span><span className="text-sm font-bold text-slate-700">{project.chuaBanHanhCount}</span></div>
                      <div className="flex flex-col items-center border-l border-slate-200"><span className="text-[9px] text-slate-400 uppercase font-bold mb-0.5">CKK</span><span className="text-sm font-bold text-blue-600">{project.chuaKiemKeCount}</span></div>
                      <div className="flex flex-col items-center border-l border-slate-200"><span className="text-[9px] text-slate-400 uppercase font-bold mb-0.5">ĐGQ</span><span className="text-sm font-bold text-orange-600">{totalDangXuLy}</span></div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      )}

      {/* MODAL 1: TẠO MỚI */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center"><h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Plus className="w-5 h-5 text-blue-600"/> {T.FORM.TITLE_CREATE}</h2></div>
            <div className="p-6 overflow-y-auto space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">{T.FIELDS.NAME}</label><input type="text" value={formDetails.name} onChange={(e) => setFormDetails({...formDetails, name: e.target.value})} className={inputStyles} placeholder={T.PLACEHOLDERS.NAME} /></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">{T.FIELDS.CODE}</label><input type="text" value={formDetails.code} onChange={(e) => setFormDetails({...formDetails, code: e.target.value})} className={inputStyles} placeholder={T.PLACEHOLDERS.CODE} /></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">{T.FIELDS.DEADLINE}</label><input type="datetime-local" value={formDetails.deadline} onChange={(e) => setFormDetails({...formDetails, deadline: e.target.value})} className={inputStyles} /></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">{T.FIELDS.TIEN_DO_GROUP}</label><select value={formDetails.tienDoDuAn} onChange={(e) => setFormDetails({...formDetails, tienDoDuAn: e.target.value})} className={inputStyles}>{OPTION_TIENDO.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">{T.FIELDS.CHI_TIET_STATUS}</label><select value={formDetails.chiTiet} onChange={(e) => setFormDetails({...formDetails, chiTiet: e.target.value})} className={inputStyles}>{OPTION_CHITIET.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">{T.FIELDS.DON_VI_DO_DAC}</label><input type="text" value={formDetails.donViDoDac} onChange={(e) => setFormDetails({...formDetails, donViDoDac: e.target.value})} className={inputStyles} placeholder={T.PLACEHOLDERS.DON_VI} /></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">{T.FIELDS.CAN_BO}</label><input type="text" value={formDetails.canBoGPMB} onChange={(e) => setFormDetails({...formDetails, canBoGPMB: e.target.value})} className={inputStyles} placeholder={T.PLACEHOLDERS.CAN_BO} /></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">{T.FIELDS.MO}</label><input type="text" value={formDetails.mo} onChange={(e) => setFormDetails({...formDetails, mo: e.target.value})} className={inputStyles} placeholder={T.PLACEHOLDERS.MO} /></div>
                <div className="col-span-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">{T.FIELDS.GHI_CHU}</label><textarea value={formDetails.ghiChu} onChange={(e) => setFormDetails({...formDetails, ghiChu: e.target.value})} className={`${inputStyles} min-h-[80px]`} placeholder={T.PLACEHOLDERS.GHI_CHU} /></div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button onClick={handleCloseAll} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-100">{T.FORM.BTN_CANCEL}</button>
              <button onClick={handleCreateProject} disabled={isLoading} className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">{isLoading ? T.FORM.CREATING : T.FORM.BTN_SAVE_NEW}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CẬP NHẬT */}
      {isModalOpen && selectedProject && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="pt-6 px-6 bg-slate-50 border-b border-slate-200">
              <div className="flex justify-between items-start mb-4">
                <div><h2 className="text-2xl font-bold text-slate-800">{selectedProject.name}</h2><p className="text-slate-500 text-sm mt-1 flex items-center gap-2">Mã: <Badge variant="outline" className="font-bold bg-white">{selectedProject.code || T.PLACEHOLDERS.EMPTY_FIELD}</Badge></p></div>
                <button onClick={handleCloseAll} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 hover:text-red-500 font-bold">✕</button>
              </div>
              <div className="flex gap-6 mt-4">
                <button onClick={() => setActiveTab('PROGRESS')} className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'PROGRESS' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><Activity className="w-4 h-4"/> {T.MODAL_TABS.PROGRESS}</button>
                <button onClick={() => setActiveTab('DETAILS')} className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'DETAILS' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><Info className="w-4 h-4"/> {T.MODAL_TABS.DETAILS}</button>
                <button onClick={() => setActiveTab('HISTORY')} className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'HISTORY' ? 'border-slate-800 text-slate-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><History className="w-4 h-4"/> {T.MODAL_TABS.HISTORY}</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-white">
              {activeTab === 'PROGRESS' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 shadow-sm">
                    <div className="flex-1"><label className="text-sm font-bold text-slate-700 block mb-2">{T.FIELDS.DEADLINE_DATETIME}</label><input type="datetime-local" value={formDetails.deadline} onChange={(e) => setFormDetails({...formDetails, deadline: e.target.value})} className="w-full sm:w-auto px-4 py-2.5 border-2 border-slate-300 rounded-xl font-bold text-slate-800 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none" /></div>
                    <div className="sm:text-right bg-white px-6 py-3 rounded-xl border border-slate-200 shadow-sm min-w-[200px]"><label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">{T.FIELDS.TOTAL_SCALE}</label><div className="text-3xl font-extrabold text-slate-800">{currentTotalLots} <span className="text-lg font-bold text-slate-400">{T.PROJECT_CARD.UNIT_LOT}</span></div></div>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">{T.FIELDS.CHUA_BAN_HANH}</label><input type="number" min="0" value={formProgress.chuaBanHanhCount} onChange={(e) => setFormProgress({...formProgress, chuaBanHanhCount: parseInt(e.target.value) || 0})} className={numberInputStyles} /></div>
                    <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">{T.FIELDS.CHUA_KIEM_KE}</label><input type="number" min="0" value={formProgress.chuaKiemKeCount} onChange={(e) => setFormProgress({...formProgress, chuaKiemKeCount: parseInt(e.target.value) || 0})} className={numberInputStyles} /></div>
                  </div>
                  <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-100">
                    <h3 className="text-sm font-bold text-orange-800 uppercase tracking-wide mb-4">{T.FIELDS.GROUP_DANG_GIAI_QUYET}</h3>
                    <div className="grid grid-cols-2 gap-5">
                      <div><label className="text-xs font-bold text-slate-600 uppercase block mb-1.5">{T.FIELDS.XAC_NHAN}</label><input type="number" min="0" value={formProgress.xacNhanCount} onChange={(e) => setFormProgress({...formProgress, xacNhanCount: parseInt(e.target.value) || 0})} className={numberInputStyles} /></div>
                      <div><label className="text-xs font-bold text-slate-600 uppercase block mb-1.5">{T.FIELDS.DU_THAO}</label><input type="number" min="0" value={formProgress.duThaoCount} onChange={(e) => setFormProgress({...formProgress, duThaoCount: parseInt(e.target.value) || 0})} className={numberInputStyles} /></div>
                      <div><label className="text-xs font-bold text-slate-600 uppercase block mb-1.5">{T.FIELDS.THAM_DINH}</label><input type="number" min="0" value={formProgress.thamDinhCount} onChange={(e) => setFormProgress({...formProgress, thamDinhCount: parseInt(e.target.value) || 0})} className={numberInputStyles} /></div>
                      <div><label className="text-xs font-bold text-green-700 uppercase block mb-1.5">{T.FIELDS.PHE_DUYET}</label><input type="number" min="0" value={formProgress.pheDuyetCount} onChange={(e) => setFormProgress({...formProgress, pheDuyetCount: parseInt(e.target.value) || 0})} className={`${numberInputStyles} !border-green-400 !text-green-700 focus:!ring-green-500`} /></div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2"><button onClick={handleUpdateProgress} disabled={isLoading} className="px-8 py-3 text-sm font-bold text-white bg-orange-500 rounded-xl hover:bg-orange-600 disabled:opacity-50 shadow-lg shadow-orange-500/30 transition-all hover:-translate-y-0.5">{isLoading ? T.FORM.LOADING : T.FORM.BTN_SAVE_PROGRESS}</button></div>
                </div>
              )}

              {activeTab === 'DETAILS' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 text-lg">{T.FORM.TITLE_UPDATE}</h3>
                    {!isEditingDetails ? <button onClick={() => setIsEditingDetails(true)} className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 font-bold transition-colors"><Edit3 className="w-4 h-4"/> {T.FORM.BTN_EDIT}</button>
                      : <button onClick={handleUpdateDetails} disabled={isLoading} className="flex items-center gap-2 text-sm text-white bg-green-600 px-5 py-2 rounded-lg hover:bg-green-700 font-bold disabled:opacity-50 shadow-md"><Save className="w-4 h-4"/> {isLoading ? T.FORM.LOADING : T.FORM.BTN_SAVE_CHANGES}</button>}
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <div><label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">{T.FIELDS.TIEN_DO_GROUP}</label>{isEditingDetails ? (<select value={formDetails.tienDoDuAn} onChange={(e) => setFormDetails({...formDetails, tienDoDuAn: e.target.value})} className={inputStyles}>{OPTION_TIENDO.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select>) : <div className="font-bold text-slate-800 text-base">{formDetails.tienDoDuAn}</div>}</div>
                    <div><label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">{T.FIELDS.CHI_TIET_STATUS}</label>{isEditingDetails ? (<select value={formDetails.chiTiet} onChange={(e) => setFormDetails({...formDetails, chiTiet: e.target.value})} className={inputStyles}>{OPTION_CHITIET.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select>) : <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-200 font-bold">{formDetails.chiTiet}</Badge>}</div>
                    <div><label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">{T.FIELDS.DON_VI_DO_DAC}</label>{isEditingDetails ? <input type="text" value={formDetails.donViDoDac} onChange={(e) => setFormDetails({...formDetails, donViDoDac: e.target.value})} className={inputStyles} /> : <div className="font-semibold text-slate-700 text-base">{formDetails.donViDoDac || T.PLACEHOLDERS.EMPTY_FIELD}</div>}</div>
                    <div><label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">{T.FIELDS.CAN_BO}</label>{isEditingDetails ? <input type="text" value={formDetails.canBoGPMB} onChange={(e) => setFormDetails({...formDetails, canBoGPMB: e.target.value})} className={inputStyles} /> : <div className="font-semibold text-slate-700 text-base">{formDetails.canBoGPMB || T.PLACEHOLDERS.EMPTY_FIELD}</div>}</div>
                    <div className="col-span-2 border-t border-slate-100 pt-5"><label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">{T.FIELDS.MO}</label>{isEditingDetails ? <input type="text" value={formDetails.mo} onChange={(e) => setFormDetails({...formDetails, mo: e.target.value})} className={inputStyles} /> : <div className="font-medium text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">{formDetails.mo || T.PLACEHOLDERS.NO_MO}</div>}</div>
                    <div className="col-span-2"><label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">{T.FIELDS.GHI_CHU}</label>{isEditingDetails ? <textarea value={formDetails.ghiChu} onChange={(e) => setFormDetails({...formDetails, ghiChu: e.target.value})} className={`${inputStyles} min-h-[100px]`} /> : <div className="font-medium text-slate-700 bg-yellow-50 p-4 rounded-xl border border-yellow-200/60 italic">{formDetails.ghiChu || T.PLACEHOLDERS.NO_NOTES}</div>}</div>
                  </div>
                </div>
              )}

              {activeTab === 'HISTORY' && (
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent animate-in fade-in slide-in-from-bottom-2 pt-2">
                  {selectedProject.histories && selectedProject.histories.length > 0 ? (
                    selectedProject.histories.map((hist: any) => (
                      <div key={hist.id} className="relative flex items-start justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm z-10 text-sm ml-8 transition-all hover:shadow-md hover:border-slate-300">
                        <div className="absolute w-3.5 h-3.5 bg-slate-400 rounded-full -left-[1.5rem] top-5 ring-4 ring-white"></div>
                        <div className="flex flex-col gap-2 w-full"><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{new Date(hist.createdAt).toLocaleString('vi-VN')}</span><div className="text-slate-800 leading-relaxed font-medium">{hist.note.split(' | ').map((line: string, i: number) => (<div key={i} className="mb-1">• {line}</div>))}</div></div>
                      </div>
                    ))
                  ) : <p className="text-sm text-slate-400 italic text-center py-10 font-medium">{T.HISTORY.EMPTY}</p>}
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}