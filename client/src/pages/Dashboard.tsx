import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Building2, Calendar, DollarSign, Gauge, TrendingUp, Users } from "lucide-react";
import { useLocation } from "wouter";

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: string | number; icon: any; accent?: string }) {
  return (
    <div className="brut-card flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 border-2 border-black flex items-center justify-center ${accent || "bg-black text-white"}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground text-right">{label}</div>
      </div>
      <div className="text-5xl font-black tabular-nums leading-none">{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const [, navigate] = useLocation();

  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">— ภาพรวม</div>
        <h1 className="text-5xl font-black uppercase tracking-tighter">DASHBOARD</h1>
        <div className="h-1 w-24 bg-black mt-3" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="brut-card animate-pulse">
              <div className="h-10 w-10 bg-gray-200 mb-3" />
              <div className="h-12 bg-gray-200" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="ห้องทั้งหมด" value={stats?.totalRooms ?? 0} icon={Building2} accent="bg-black text-white" />
            <StatCard label="ห้องว่าง" value={stats?.vacantRooms ?? 0} icon={Building2} accent="bg-green-100 text-green-800 border-green-600" />
            <StatCard label="ห้องไม่ว่าง" value={stats?.occupiedRooms ?? 0} icon={Users} accent="bg-red-100 text-red-800 border-red-600" />
            <StatCard label="บิลค้างชำระ" value={stats?.unpaidCount ?? 0} icon={AlertCircle} accent="bg-yellow-100 text-yellow-800 border-yellow-600" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <StatCard label="ห้องรายวัน" value={stats?.dailyRooms ?? 0} icon={Calendar} accent="bg-blue-100 text-blue-800 border-blue-600" />
            <StatCard label="ห้องรายเดือน" value={stats?.monthlyRooms ?? 0} icon={Gauge} accent="bg-purple-100 text-purple-800 border-purple-600" />
            <StatCard
              label="รายรับเดือนนี้"
              value={`฿${(stats?.monthlyIncome ?? 0).toLocaleString("th-TH", { minimumFractionDigits: 0 })}`}
              icon={TrendingUp}
              accent="bg-black text-white"
            />
          </div>

          {/* Quick actions */}
          <div className="border-t-4 border-black pt-6">
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">— ทางลัด</div>
            <div className="flex flex-wrap gap-3">
              {[
                { label: "เพิ่มห้องพัก", path: "/rooms" },
                { label: "เพิ่มผู้เช่า", path: "/tenants" },
                { label: "บันทึกมิเตอร์", path: "/meters" },
                { label: "ออกบิล", path: "/bills" },
                { label: "ดูรายงาน", path: "/reports" },
              ].map((action) => (
                <button
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  className="px-5 py-2.5 border-2 border-black text-sm font-bold uppercase tracking-wide hover:bg-black hover:text-white transition-all"
                  style={{ boxShadow: "2px 2px 0px rgba(0,0,0,0.3)" }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
