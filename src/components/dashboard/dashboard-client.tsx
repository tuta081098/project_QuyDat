"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Building2, FileWarning, ClipboardList, Clock, CheckCircle2, History, Plus, Info, Activity, Edit3, Save } from "lucide-react";

const OPTION_TIENDO = ["Đấu giá", "HTKT", "Trường", "Đường", "Ngoài ngân sách", "Trung ương"];
const OPTION_CHITIET = ["Chưa nhận mốc", "Đã nhận mốc", "Chưa có mốc"];

export default function DashboardClient({ initialProjects }: any) {
  const router = useRouter();
  
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // CẬP NHẬT 1: Đổi tab mặc định từ DETAILS sang PROGRESS
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'PROGRESS' | 'HISTORY'>('PROGRESS');
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CHUA_BAN_HANH' | 'CHUA_KIEM_KE' | 'DANG_GIAI_QUYET'>('ALL');

  const [formProgress, setFormProgress] = useState({
    chuaBanHanhCount: 0, chuaKiemKeCount: 0, xacNhanCount: 0, duThaoCount: 0, thamDinhCount: 0, pheDuyetCount: 0
  });

  const defaultDetails = { name: "", code: "", tienDoDuAn: "Đấu giá", chiTiet: "Chưa nhận mốc", donViDoDac: "", canBoGPMB: "", mo: "", ghiChu: "" };
  const [formDetails, setFormDetails] = useState(defaultDetails);

  const currentTotalLots = formProgress.chuaBanHanhCount + formProgress.chuaKiemKeCount + formProgress.xacNhanCount + formProgress.duThaoCount + formProgress.thamDinhCount + formProgress.pheDuyetCount;

  const filteredProjects = initialProjects.filter((project: any) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'CHUA_BAN_HANH') return project.chuaBanHanhCount > 0;
    if (activeFilter === 'CHUA_KIEM_KE') return project.chuaKiemKeCount > 0;
    if (activeFilter === 'DANG_GIAI_QUYET') return (project.xacNhanCount + project.duThaoCount + project.thamDinhCount + project.pheDuyetCount) > 0;
    return true;
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
      tienDoDuAn: freshProject.details?.tienDoDuAn || "Đấu giá", chiTiet: freshProject.details?.chiTiet || "Chưa nhận mốc",
      donViDoDac: freshProject.details?.donViDoDac || "", canBoGPMB: freshProject.details?.canBoGPMB || "",
      mo: freshProject.details?.mo || "", ghiChu: freshProject.details?.ghiChu || ""
    });
    
    setIsEditingDetails(false);
    // CẬP NHẬT 2: Mỗi lần bấm mở dự án, luôn đặt tab Tiến độ làm màn hình đầu tiên
    setActiveTab('PROGRESS'); 
    setIsModalOpen(true);
  };

  const handleCloseAll = () => {
    setIsModalOpen(false);
    setIsCreateModalOpen(false);
    setIsLoading(false); 
    router.refresh(); 
  };

  const handleCreateProject = async () => {
    if (!formDetails.name) return alert("Vui lòng nhập tên dự án!");
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formDetails) });
      if (res.ok) handleCloseAll();
      else alert("Lỗi tạo dự án.");
    } catch (error) { alert("Lỗi kết nối!"); } finally { setIsLoading(false); }
  };

  const handleUpdateProgress = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${selectedProject.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({...formProgress, action: 'UPDATE_PROGRESS'}) });
      if (res.ok) handleCloseAll();
    } catch (error) { alert("Lỗi kết nối!"); } finally { setIsLoading(false); }
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
    } catch (error) { alert("Lỗi kết nối!"); } finally { setIsLoading(false); }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Quản lý Quỹ đất</h1>
          <p className="text-slate-500 mt-1">Monitor tiến độ & thông tin dự án GPMB</p>
        </div>
        <button onClick={() => { setFormDetails(defaultDetails); setIsCreateModalOpen(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg">
          <Plus className="w-5 h-5" /> Thêm Dự án mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card onClick={() => setActiveFilter('ALL')} className={`cursor-pointer transition-all hover:scale-[102%] border-0 shadow-lg ${activeFilter === 'ALL' ? 'ring-4 ring-slate-800/30' : ''} bg-gradient-to-br from-slate-800 to-slate-900 text-white`}><CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm font-medium opacity-80">Tổng Dự Án</CardTitle><Building2 className="h-4 w-4 opacity-70" /></CardHeader><CardContent><div className="text-4xl font-bold">{totalProjects}</div></CardContent></Card>
        <Card onClick={() => setActiveFilter('CHUA_BAN_HANH')} className={`cursor-pointer transition-all hover:scale-[102%] shadow-sm ${activeFilter === 'CHUA_BAN_HANH' ? 'ring-2 ring-slate-400 bg-slate-50' : ''}`}><CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm font-medium text-slate-500">Chưa ban hành</CardTitle><FileWarning className="h-4 w-4 text-slate-400" /></CardHeader><CardContent><div className="text-3xl font-bold text-slate-700">{totalChuaBanHanh}</div></CardContent></Card>
        <Card onClick={() => setActiveFilter('CHUA_KIEM_KE')} className={`cursor-pointer transition-all hover:scale-[102%] shadow-sm ${activeFilter === 'CHUA_KIEM_KE' ? 'ring-2 ring-blue-400 bg-blue-50/50' : ''}`}><CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm font-medium text-slate-500">Chưa kiểm kê</CardTitle><ClipboardList className="h-4 w-4 text-blue-400" /></CardHeader><CardContent><div className="text-3xl font-bold text-blue-600">{totalChuaKiemKe}</div></CardContent></Card>
        <Card onClick={() => setActiveFilter('DANG_GIAI_QUYET')} className={`cursor-pointer transition-all hover:scale-[102%] shadow-sm ${activeFilter === 'DANG_GIAI_QUYET' ? 'ring-2 ring-orange-400 bg-orange-50/50' : ''}`}><CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm font-medium text-slate-500">Đang giải quyết</CardTitle><Clock className="h-4 w-4 text-orange-400" /></CardHeader><CardContent><div className="text-3xl font-bold text-orange-600">{totalDangGiaiQuyet}</div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProjects.length === 0 && <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 bg-slate-50 border-2 border-dashed rounded-2xl"><FileWarning className="w-10 h-10 mb-2 opacity-50" /><p>Không có dự án nào khớp bộ lọc.</p></div>}
        
        {filteredProjects.map((project: any) => {
          const totalDangXuLy = project.xacNhanCount + project.duThaoCount + project.thamDinhCount + project.pheDuyetCount;
          const progressPercent = project.totalLots > 0 ? Math.round((project.pheDuyetCount / project.totalLots) * 100) : 0;
          const isCompleted = project.status === "COMPLETED";

          return (
            <Card key={project.id} className={`group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden flex flex-col ${isCompleted ? 'border-green-300 bg-green-50/30' : 'hover:border-blue-400'}`} onClick={() => handleOpenModal(project)}>
              <div className={`h-1 w-full opacity-0 group-hover:opacity-100 transition-opacity ${isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-blue-400 to-indigo-500'}`} />
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <CardTitle className="text-lg text-slate-800 font-bold">{project.name}</CardTitle>
                    <p className="text-sm text-slate-500 mt-1">Phân loại: <span className="font-semibold">{project.details?.tienDoDuAn || 'Chưa cập nhật'}</span></p>
                  </div>
                  {isCompleted && <Badge className="bg-green-100 text-green-700 whitespace-nowrap"><CheckCircle2 className="w-3 h-3 mr-1"/> Hoàn thành</Badge>}
                </div>
                {!isCompleted && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {project.chuaBanHanhCount > 0 && <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">Chưa ban hành</Badge>}
                    {project.chuaKiemKeCount > 0 && <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Chưa kiểm kê</Badge>}
                    {project.xacNhanCount > 0 && <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">Xác nhận</Badge>}
                    {project.duThaoCount > 0 && <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">Dự thảo</Badge>}
                    {project.thamDinhCount > 0 && <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">Thẩm định</Badge>}
                    {project.pheDuyetCount > 0 && <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Phê duyệt một phần</Badge>}
                  </div>
                )}
              </CardHeader>
              <CardContent className="pt-4 flex-1">
                <div className="mb-6 space-y-2">
                  <div className="flex justify-between text-xs font-medium text-slate-500"><span>Tiến độ Phê duyệt</span><span>{progressPercent}% ({project.pheDuyetCount}/{project.totalLots} lô)</span></div>
                  <Progress value={progressPercent} className={`h-2 ${isCompleted ? 'bg-green-200' : ''}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* MODAL 1: TẠO MỚI DỰ ÁN */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Plus className="w-5 h-5 text-blue-600"/> Khởi tạo Dự án mới</h2>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="text-xs font-semibold text-slate-500 mb-1 block">Tên dự án *</label><input type="text" value={formDetails.name} onChange={(e) => setFormDetails({...formDetails, name: e.target.value})} className="w-full p-2.5 border rounded-lg focus:ring-2 ring-blue-500 outline-none" placeholder="Nhập tên dự án..." /></div>
                <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Mã dự án</label><input type="text" value={formDetails.code} onChange={(e) => setFormDetails({...formDetails, code: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none" placeholder="VD: DA-001" /></div>
                <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Nhóm tiến độ dự án</label>
                  <select value={formDetails.tienDoDuAn} onChange={(e) => setFormDetails({...formDetails, tienDoDuAn: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none bg-white">
                    {OPTION_TIENDO.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Tình trạng (Chi tiết)</label>
                  <select value={formDetails.chiTiet} onChange={(e) => setFormDetails({...formDetails, chiTiet: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none bg-white">
                    {OPTION_CHITIET.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Đơn vị đo đạc</label><input type="text" value={formDetails.donViDoDac} onChange={(e) => setFormDetails({...formDetails, donViDoDac: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none" /></div>
                <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Cán bộ GPMB</label><input type="text" value={formDetails.canBoGPMB} onChange={(e) => setFormDetails({...formDetails, canBoGPMB: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none" /></div>
                <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Tình trạng Mộ</label><input type="text" value={formDetails.mo} onChange={(e) => setFormDetails({...formDetails, mo: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none" placeholder="Số lượng mộ, hiện trạng..." /></div>
                <div className="col-span-2"><label className="text-xs font-semibold text-slate-500 mb-1 block">Ghi chú thêm</label><textarea value={formDetails.ghiChu} onChange={(e) => setFormDetails({...formDetails, ghiChu: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none min-h-[80px]" /></div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button onClick={handleCloseAll} className="px-5 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100">Hủy</button>
              <button onClick={handleCreateProject} disabled={isLoading} className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {isLoading ? 'Đang tạo...' : 'Lưu Dự Án Mới'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: XEM CHI TIẾT & CẬP NHẬT */}
      {isModalOpen && selectedProject && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            
            <div className="pt-6 px-6 bg-slate-50 border-b border-slate-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">{selectedProject.name}</h2>
                  <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">Mã: <Badge variant="outline">{selectedProject.code || 'N/A'}</Badge></p>
                </div>
                <button onClick={handleCloseAll} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 font-bold">✕</button>
              </div>
              
              {/* CẬP NHẬT 3: Đảo vị trí hiển thị các nút Tab */}
              <div className="flex gap-6 mt-4">
                <button onClick={() => setActiveTab('PROGRESS')} className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'PROGRESS' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><Activity className="w-4 h-4"/> Tiến độ GPMB</button>
                <button onClick={() => setActiveTab('DETAILS')} className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'DETAILS' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><Info className="w-4 h-4"/> Thông tin chung</button>
                <button onClick={() => setActiveTab('HISTORY')} className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'HISTORY' ? 'border-slate-800 text-slate-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><History className="w-4 h-4"/> Lịch sử</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-white">
              
              {/* TAB 1: CẬP NHẬT TIẾN ĐỘ */}
              {activeTab === 'PROGRESS' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                    <label className="text-sm font-semibold text-slate-600 block">Quy mô Tổng (Tự động cộng)</label>
                    <div className="text-2xl font-bold text-slate-800">{currentTotalLots} lô</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs font-semibold text-slate-500 block mb-1">Chưa ban hành</label><input type="number" min="0" value={formProgress.chuaBanHanhCount} onChange={(e) => setFormProgress({...formProgress, chuaBanHanhCount: parseInt(e.target.value) || 0})} className="w-full p-2 border rounded-md" /></div>
                    <div><label className="text-xs font-semibold text-slate-500 block mb-1">Chưa kiểm kê</label><input type="number" min="0" value={formProgress.chuaKiemKeCount} onChange={(e) => setFormProgress({...formProgress, chuaKiemKeCount: parseInt(e.target.value) || 0})} className="w-full p-2 border rounded-md" /></div>
                  </div>
                  <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                    <h3 className="text-sm font-semibold text-orange-800 mb-3">Nhóm Đang giải quyết</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-xs font-medium text-slate-600 block mb-1">Xác nhận</label><input type="number" min="0" value={formProgress.xacNhanCount} onChange={(e) => setFormProgress({...formProgress, xacNhanCount: parseInt(e.target.value) || 0})} className="w-full p-2 border rounded-md" /></div>
                      <div><label className="text-xs font-medium text-slate-600 block mb-1">Dự thảo</label><input type="number" min="0" value={formProgress.duThaoCount} onChange={(e) => setFormProgress({...formProgress, duThaoCount: parseInt(e.target.value) || 0})} className="w-full p-2 border rounded-md" /></div>
                      <div><label className="text-xs font-medium text-slate-600 block mb-1">Thẩm định</label><input type="number" min="0" value={formProgress.thamDinhCount} onChange={(e) => setFormProgress({...formProgress, thamDinhCount: parseInt(e.target.value) || 0})} className="w-full p-2 border rounded-md" /></div>
                      <div><label className="text-xs font-medium text-green-600 block mb-1">Đã Phê duyệt</label><input type="number" min="0" value={formProgress.pheDuyetCount} onChange={(e) => setFormProgress({...formProgress, pheDuyetCount: parseInt(e.target.value) || 0})} className="w-full p-2 border border-green-300 bg-green-50 rounded-md font-bold text-green-700" /></div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-4"><button onClick={handleUpdateProgress} disabled={isLoading} className="px-6 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50 shadow-md"> {isLoading ? 'Đang lưu...' : 'Lưu Tiến Độ'} </button></div>
                </div>
              )}

              {/* TAB 2: THÔNG TIN CHI TIẾT */}
              {activeTab === 'DETAILS' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 text-lg">Hồ sơ Dự án</h3>
                    {!isEditingDetails ? 
                      <button onClick={() => setIsEditingDetails(true)} className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md hover:bg-blue-100 font-medium"><Edit3 className="w-4 h-4"/> Chỉnh sửa</button>
                      : 
                      <button onClick={handleUpdateDetails} disabled={isLoading} className="flex items-center gap-2 text-sm text-white bg-green-600 px-4 py-1.5 rounded-md hover:bg-green-700 font-medium disabled:opacity-50"><Save className="w-4 h-4"/> {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
                    }
                  </div>

                  <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Nhóm tiến độ (Phân loại)</label>
                      {isEditingDetails ? (
                        <select value={formDetails.tienDoDuAn} onChange={(e) => setFormDetails({...formDetails, tienDoDuAn: e.target.value})} className="w-full p-2 border rounded-md outline-none bg-slate-50 text-sm font-medium">
                          {OPTION_TIENDO.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : <div className="font-semibold text-slate-800">{formDetails.tienDoDuAn}</div>}
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Tình trạng chi tiết</label>
                      {isEditingDetails ? (
                        <select value={formDetails.chiTiet} onChange={(e) => setFormDetails({...formDetails, chiTiet: e.target.value})} className="w-full p-2 border rounded-md outline-none bg-slate-50 text-sm font-medium">
                          {OPTION_CHITIET.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200">{formDetails.chiTiet}</Badge>}
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Đơn vị đo đạc</label>
                      {isEditingDetails ? <input type="text" value={formDetails.donViDoDac} onChange={(e) => setFormDetails({...formDetails, donViDoDac: e.target.value})} className="w-full p-2 border rounded-md outline-none bg-slate-50 text-sm font-medium" /> 
                      : <div className="font-medium text-slate-700">{formDetails.donViDoDac || '---'}</div>}
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Cán bộ phụ trách GPMB</label>
                      {isEditingDetails ? <input type="text" value={formDetails.canBoGPMB} onChange={(e) => setFormDetails({...formDetails, canBoGPMB: e.target.value})} className="w-full p-2 border rounded-md outline-none bg-slate-50 text-sm font-medium" /> 
                      : <div className="font-medium text-slate-700">{formDetails.canBoGPMB || '---'}</div>}
                    </div>

                    <div className="col-span-2 border-t border-slate-100 pt-4">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Tình trạng Mộ</label>
                      {isEditingDetails ? <input type="text" value={formDetails.mo} onChange={(e) => setFormDetails({...formDetails, mo: e.target.value})} className="w-full p-2 border rounded-md outline-none bg-slate-50 text-sm font-medium" /> 
                      : <div className="font-medium text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">{formDetails.mo || 'Không có ghi nhận'}</div>}
                    </div>

                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Ghi chú</label>
                      {isEditingDetails ? <textarea value={formDetails.ghiChu} onChange={(e) => setFormDetails({...formDetails, ghiChu: e.target.value})} className="w-full p-2 border rounded-md outline-none bg-slate-50 text-sm font-medium min-h-[80px]" /> 
                      : <div className="font-medium text-slate-600 bg-yellow-50 p-3 rounded-lg border border-yellow-100 italic">{formDetails.ghiChu || 'Không có ghi chú'}</div>}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: LỊCH SỬ */}
              {activeTab === 'HISTORY' && (
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent animate-in fade-in slide-in-from-bottom-2">
                  {selectedProject.histories && selectedProject.histories.length > 0 ? (
                    selectedProject.histories.map((hist: any) => (
                      <div key={hist.id} className="relative flex items-start justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm z-10 text-sm ml-6">
                        <div className="absolute w-3 h-3 bg-slate-300 rounded-full -left-[1.35rem] top-5 ring-4 ring-white"></div>
                        <div className="flex flex-col gap-1.5 w-full">
                          <span className="text-xs font-bold text-slate-400">{new Date(hist.createdAt).toLocaleString('vi-VN')}</span>
                          <div className="text-slate-700 leading-relaxed font-medium">
                            {hist.note.split(' | ').map((line: string, i: number) => (<div key={i}>• {line}</div>))}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : <p className="text-sm text-slate-400 italic text-center py-10">Chưa có lịch sử cập nhật nào.</p>}
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}