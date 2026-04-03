import { useAuth } from "@/_core/hooks/useAuth";
import BrandMark from "@/components/BrandMark";
import OnboardingTutorial from "./Onboarding/OnboardingTutorial";
import NotificationsBell from "@/components/NotificationsBell";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Building2, FileText, Gauge, Home, LogOut, Menu, Package, Receipt, Settings, Users, X } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const [location, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const logoutMutation = trpc.auth.logout.useMutation();
  const settingsQuery = trpc.settings.getAll.useQuery(undefined, { enabled: isAuthenticated === true });
  const dormName = settingsQuery.data?.["dormitory_name"] || "";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl font-black mb-4 tracking-tighter">หอพักโปร</div>
          <div className="text-sm font-mono text-muted-foreground">กำลังโหลด...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl() || "/";
    return null;
  }

  const isAdmin = user?.role === "admin";

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = "/";
  };

  const adminNavItems = [
    { icon: Home, label: "แดชบอร์ด", path: "/dashboard" },
    { icon: Building2, label: "ห้องพัก", path: "/rooms" },
    { icon: Users, label: "ผู้เช่า", path: "/tenants" },
    { icon: Package, label: "พัสดุ", path: "/packages" },
    { icon: Gauge, label: "มิเตอร์น้ำ/ไฟ", path: "/meters" },
    { icon: Receipt, label: "บิล", path: "/bills" },
    { icon: FileText, label: "รายงาน", path: "/reports" },
    { icon: Settings, label: "ตั้งค่า", path: "/settings" },
  ];

  const tenantNavItems = [
    { icon: Home, label: "พอร์ทัลผู้เช่า", path: "/portal" },
  ];

  const navItems = isAdmin ? adminNavItems : tenantNavItems;

  const NavContent = () => (
    <>
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <BrandMark size="sm" inverted />
          <div>
            <div className="text-2xl font-black tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-white to-[#d7b56d]">
              หอพัก<span className="text-[#d7b56d]">โปร</span>
            </div>
            <div className="text-[10px] font-bold text-[#d7b56d]/80 uppercase tracking-widest mt-1.5">
              Modern Premium
            </div>
          </div>
        </div>
        {dormName && (
          <div className="text-sm font-bold text-white/80 mt-1 truncate">{dormName}</div>
        )}
        <div className="text-xs font-mono text-white/40 mt-1 uppercase tracking-widest">
          {isAdmin ? "— Admin Panel" : "— Tenant Portal"}
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
          return (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
              className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${isActive
                ? "bg-[#d7b56d]/10 text-[#d7b56d] shadow-sm border border-[#d7b56d]/30"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="mb-3 px-2">
          <div className="text-xs font-mono text-white/40 uppercase tracking-widest">ผู้ใช้งาน</div>
          <div className="text-sm font-bold truncate text-white mt-1">{user?.name || user?.email || "User"}</div>
          {isAdmin && (
            <span className="text-xs font-black uppercase mt-1 inline-block rounded-full px-2.5 py-1 bg-white text-black">
              ADMIN
            </span>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all"
        >
          <LogOut className="w-4 h-4" />
          ออกจากระบบ
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 bg-slate-950 text-white flex-col shrink-0 border-r border-slate-800 shadow-xl">
        <NavContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-slate-950 text-white flex flex-col border-r border-slate-800 shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <NavContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white/80 backdrop-blur-md text-slate-900 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="p-1 rounded-md hover:bg-slate-100 transition-colors">
              <Menu className="w-6 h-6" />
            </button>
            <BrandMark size="sm" />
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-[#d7b56d]">หอพักโปร</span>
          </div>
          <NotificationsBell />
        </div>

        <main className="flex-1 overflow-auto p-4 lg:p-8">
          <div className="hidden lg:flex justify-end mb-4">
            <NotificationsBell />
          </div>
          {children}
        </main>
        <OnboardingTutorial />
      </div>
    </div>
  );
}
