import { useAuth } from "@/_core/hooks/useAuth";
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
    window.location.href = getLoginUrl();
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
      <div className="p-6 border-b-4 border-white/20">
        <div className="text-2xl font-black uppercase tracking-tighter leading-none">
          หอพัก<span className="text-white/60">โปร</span>
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
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-wide transition-all border-l-4 ${
                isActive
                  ? "bg-white/10 border-white text-white"
                  : "border-transparent text-white/70 hover:bg-white/5 hover:text-white hover:border-white/40"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t-4 border-white/20">
        <div className="mb-3 px-2">
          <div className="text-xs font-mono text-white/40 uppercase tracking-widest">ผู้ใช้งาน</div>
          <div className="text-sm font-bold truncate text-white mt-1">{user?.name || user?.email || "User"}</div>
          {isAdmin && (
            <span className="text-xs font-black uppercase mt-1 inline-block px-2 py-0.5 bg-white text-black">
              ADMIN
            </span>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase border-2 border-white/30 text-white/70 hover:border-white hover:text-white transition-all"
        >
          <LogOut className="w-4 h-4" />
          ออกจากระบบ
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-black text-white flex-col shrink-0 border-r-4 border-black">
        <NavContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-black text-white flex flex-col border-r-4 border-black">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-white/70 hover:text-white"
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
        <div className="lg:hidden flex items-center gap-4 px-4 py-3 border-b-4 border-black bg-black text-white">
          <button onClick={() => setMobileOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-lg font-black uppercase tracking-tight">HORPAKMAX</span>
        </div>

        <main className="flex-1 overflow-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
