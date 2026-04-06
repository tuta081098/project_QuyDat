// File: src/app/page.tsx

import DashboardClient from "@/src/components/dashboard/dashboard-client";
import { prisma } from "@/src/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const projects = await prisma.project.findMany({
    include: {
      details: true,
      projectStates: true,
      histories: { orderBy: { createdAt: 'desc' }, take: 5 }
    },
    orderBy: { updatedAt: "desc" },
  });

  const totalProjects = projects.length;
  const totalChuaBanHanh = projects.reduce((sum: number, p: any) => sum + p.chuaBanHanhCount, 0);
  const totalChuaKiemKe = projects.reduce((sum: number, p: any) => sum + p.chuaKiemKeCount, 0);
  const totalDangGiaiQuyet = projects.reduce((sum: number, p: any) => 
    sum + p.xacNhanCount + p.duThaoCount + p.thamDinhCount + p.pheDuyetCount, 0
  );

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <DashboardClient initialProjects={projects} metrics={{totalProjects, totalChuaBanHanh, totalChuaKiemKe, totalDangGiaiQuyet}} />
      </div>
    </main>
  );
}