import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Building2, ChevronRight, Gauge, Key, Receipt, Shield, Users, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663502056857/PMxXmdG42CmMAogAwxrBf2/logo-icon-RfHo4pW6zEbJdn8myLGAqi.webp";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const adminLoginUrl = getLoginUrl("/dashboard");
  const tenantLoginUrl = getLoginUrl("/portal");
  const bootstrapStatus = trpc.bootstrap.status.useQuery();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bootstrapName, setBootstrapName] = useState("");
  const [bootstrapEmail, setBootstrapEmail] = useState("");
  const [bootstrapPassword, setBootstrapPassword] = useState("");
  const localLogin = trpc.auth.localLogin.useMutation({
    onSuccess: () => {
      toast.success("เข้าสู่ระบบสำเร็จ");
      window.location.reload();
    },
    onError: (err) => toast.error(err.message),
  });
  const bootstrapAdmin = trpc.bootstrap.createFirstAdmin.useMutation({
    onSuccess: () => {
      toast.success("สร้างแอดมินครั้งแรกสำเร็จ");
      window.location.reload();
    },
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (user?.role === "admin") {
        navigate("/dashboard");
      } else {
        navigate("/portal");
      }
    }
  }, [loading, isAuthenticated, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-5xl font-black animate-pulse tracking-tighter">หอพักโปร</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left: Big text block + Login buttons */}
        <div className="flex-1 p-8 lg:p-16 flex flex-col justify-center border-r-0 lg:border-r-4 border-black">
          <div className="max-w-xl">
            <div className="flex items-center gap-3 mb-6">
              <img src={LOGO_URL} alt="หอพักโปร" className="w-12 h-12 border-2 border-black" />
              <div className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground border-l-4 border-black pl-4">
                ระบบจัดการหอพัก / อพาร์ทเม้นท์
              </div>
            </div>
            <h1 className="text-7xl lg:text-9xl font-black leading-none tracking-tighter mb-8">
              หอพัก<br />
              <span className="text-black/20">โปร</span>
            </h1>
            <p className="text-lg font-medium text-muted-foreground mb-10 max-w-md leading-relaxed">
              บริหารหอพักและอพาร์ทเม้นท์แบบครบวงจร จัดการห้อง ผู้เช่า บิล และมิเตอร์ในที่เดียว
            </p>

            {/* ── Login Section: 2 Groups ── */}
            <div className="space-y-6">
              <div className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground border-l-4 border-black pl-3">
                เลือกเข้าสู่ระบบ
              </div>

              {bootstrapStatus.data?.canCreateFirstAdmin && (
                <div className="border-4 border-black p-4 bg-yellow-50 space-y-3">
                  <div className="text-xs font-mono font-bold uppercase tracking-widest">ตั้งค่าแอดมินครั้งแรก</div>
                  <div className="grid grid-cols-1 gap-3">
                    <input
                      type="text"
                      className="brut-input"
                      placeholder="ชื่อแอดมิน"
                      value={bootstrapName}
                      onChange={(e) => setBootstrapName(e.target.value)}
                    />
                    <input
                      type="email"
                      className="brut-input"
                      placeholder="อีเมล"
                      value={bootstrapEmail}
                      onChange={(e) => setBootstrapEmail(e.target.value)}
                    />
                    <input
                      type="password"
                      className="brut-input"
                      placeholder="รหัสผ่าน"
                      value={bootstrapPassword}
                      onChange={(e) => setBootstrapPassword(e.target.value)}
                    />
                  </div>
                  <button
                    className="brut-btn"
                    disabled={bootstrapAdmin.isPending || !bootstrapName || !bootstrapEmail || !bootstrapPassword}
                    onClick={() => bootstrapAdmin.mutate({ name: bootstrapName, email: bootstrapEmail, password: bootstrapPassword })}
                  >
                    {bootstrapAdmin.isPending ? "กำลังสร้างแอดมิน..." : "สร้างแอดมินคนแรก"}
                  </button>
                </div>
              )}

              <div className="border-4 border-black p-4 bg-gray-50 space-y-3">
                <div className="text-xs font-mono font-bold uppercase tracking-widest">เข้าสู่ระบบด้วยบัญชีหอพัก</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="email"
                    className="brut-input"
                    placeholder="อีเมล"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <input
                    type="password"
                    className="brut-input"
                    placeholder="รหัสผ่าน"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <button
                  className="brut-btn"
                  disabled={localLogin.isPending || !email || !password}
                  onClick={() => localLogin.mutate({ email, password })}
                >
                  {localLogin.isPending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ (บัญชีที่แอดมินสร้าง)"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Owner / Admin Login */}
                <button
                  onClick={() => {
                    if (adminLoginUrl) {
                      window.location.href = adminLoginUrl;
                      return;
                    }
                    toast.error("ยังไม่ได้ตั้งค่า OAuth login");
                  }}
                  disabled={!adminLoginUrl}
                  className="group relative border-4 border-black p-6 text-left hover:bg-black hover:text-white transition-all"
                  style={{ boxShadow: "6px 6px 0px rgba(0,0,0,0.3)" }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 border-2 border-current flex items-center justify-center">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-lg font-black uppercase tracking-tight">เจ้าของ / แอดมิน</div>
                      <div className="text-xs font-mono text-muted-foreground group-hover:text-white/60 uppercase">Owner / Admin</div>
                    </div>
                  </div>
                  <ul className="text-xs font-mono space-y-1 text-muted-foreground group-hover:text-white/60 mb-4">
                    <li>• จัดการห้องพัก ผู้เช่า</li>
                    <li>• ออกบิล บันทึกมิเตอร์</li>
                    <li>• ดูรายงาน รายรับ-รายจ่าย</li>
                  </ul>
                  <div className="flex items-center gap-2 font-black text-sm uppercase tracking-widest">
                    เข้าสู่ระบบ <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* Tenant Login */}
                <button
                  onClick={() => {
                    if (tenantLoginUrl) {
                      window.location.href = tenantLoginUrl;
                      return;
                    }
                    toast.error("ยังไม่ได้ตั้งค่า OAuth login");
                  }}
                  disabled={!tenantLoginUrl}
                  className="group relative border-4 border-black/40 p-6 text-left hover:border-black hover:bg-black hover:text-white transition-all"
                  style={{ boxShadow: "6px 6px 0px rgba(0,0,0,0.15)" }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 border-2 border-current flex items-center justify-center">
                      <Key className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-lg font-black uppercase tracking-tight">ผู้เช่า</div>
                      <div className="text-xs font-mono text-muted-foreground group-hover:text-white/60 uppercase">Tenant</div>
                    </div>
                  </div>
                  <ul className="text-xs font-mono space-y-1 text-muted-foreground group-hover:text-white/60 mb-4">
                    <li>• ดูบิลค่าเช่า ค่าน้ำ ค่าไฟ</li>
                    <li>• สแกน QR ชำระเงิน</li>
                    <li>• แจ้งชำระ ส่งสลิป</li>
                  </ul>
                  <div className="flex items-center gap-2 font-black text-sm uppercase tracking-widest">
                    เข้าสู่ระบบ <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Feature cards */}
        <div className="lg:w-96 p-8 lg:p-12 flex flex-col justify-center gap-6 bg-black text-white">
          <div className="text-xs font-mono uppercase tracking-widest text-white/40 mb-2">
            — ฟีเจอร์หลัก
          </div>
          {[
            { icon: Building2, title: "จัดการห้องพัก", desc: "ห้องรายวัน/รายเดือน สถานะห้อง ราคา" },
            { icon: Users, title: "จัดการผู้เช่า", desc: "ข้อมูลผู้เช่า สัญญา ประวัติ" },
            { icon: Receipt, title: "ระบบบิล & ชำระเงิน", desc: "QR PromptPay บิลอัตโนมัติ" },
            { icon: Gauge, title: "มิเตอร์น้ำ/ไฟ", desc: "บันทึกมิเตอร์ OCR อัตโนมัติ" },
            { icon: Zap, title: "ค่าน้ำเหมาจ่าย", desc: "เลือกคิดตามมิเตอร์หรือเหมาจ่าย" },
          ].map((f) => (
            <div key={f.title} className="border-2 border-white/20 p-5 hover:border-white transition-all">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 border-2 border-white/40 flex items-center justify-center shrink-0">
                  <f.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-black uppercase text-sm tracking-wide">{f.title}</div>
                  <div className="text-xs text-white/50 mt-1 font-mono">{f.desc}</div>
                </div>
              </div>
            </div>
          ))}

          <div className="mt-4 border-t-2 border-white/20 pt-4">
            <div className="text-xs font-mono text-white/40 uppercase tracking-widest">
              รองรับ 2 ฝั่ง
            </div>
            <div className="flex gap-3 mt-2">
              <span className="px-3 py-1 border-2 border-white text-xs font-black uppercase">เจ้าของ</span>
              <span className="px-3 py-1 border-2 border-white/40 text-xs font-black uppercase text-white/60">ผู้เช่า</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-4 border-black px-8 py-4 flex items-center justify-between">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">หอพักโปร © 2025</span>
        <span className="text-xs font-mono text-muted-foreground">v1.0</span>
      </div>
    </div>
  );
}
