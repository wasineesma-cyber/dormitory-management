import { useAuth } from "@/_core/hooks/useAuth";
import BrandMark from "@/components/BrandMark";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Building2, ChevronRight, Gauge, Key, Receipt, Shield, Users, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { ArrowRight, Check } from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const adminLoginUrl = getLoginUrl("/dashboard");
  const tenantLoginUrl = getLoginUrl("/portal");
  const bootstrapStatus = trpc.bootstrap.status.useQuery();

  const [showSplash, setShowSplash] = useState(false);
  const [splashStep, setSplashStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem("hasSeenAppIntro")) {
      setShowSplash(true);
    }
  }, []);

  const completeSplash = () => {
    setShowSplash(false);
    localStorage.setItem("hasSeenAppIntro", "true");
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bootstrapName, setBootstrapName] = useState("");
  const [bootstrapEmail, setBootstrapEmail] = useState("");
  const [bootstrapPassword, setBootstrapPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const localLogin = trpc.auth.localLogin.useMutation({
    onSuccess: () => {
      toast.success("เข้าสู่ระบบสำเร็จ");
      window.location.reload();
    },
    onError: (err) => toast.error(err.message),
  });
  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      toast.success("สร้างบัญชีและหอพักใหม่สำเร็จ! ยินดีต้อนรับครับ 🎉");
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
        <div className="flex items-center gap-4 rounded-full border border-black/10 bg-white px-6 py-4 shadow-[0_18px_50px_rgba(0,0,0,0.08)]">
          <BrandMark size="md" />
          <div className="text-4xl font-black tracking-tighter">หอพักโปร</div>
        </div>
      </div>
    );
  }

  const splashScreens = [
    {
      image: "/intro_manager.png",
      title: "จัดการหอพักง่ายๆ ด้วยปลายนิ้ว",
      desc: "เจ้าของหอพักจัดการทุกอย่างได้จากที่เดียว ไม่ว่าจะเป็นห้องว่าง สัญญา หรือบิลเรียกเก็บเงิน"
    },
    {
      image: "/intro_tenant.png",
      title: "ผู้เช่าดูบิลและชำระออนไลน์",
      desc: "สะดวกสำหรับผู้เช่า ตรวจสอบบิลค่าน้ำค่าไฟ สแกน QR PromptPay แจ้งโอนได้ทันที"
    },
    {
      image: "/intro_success.png",
      title: "รับฟรี! ทดลองใช้งาน 90 วัน",
      desc: "ลดภาระงาน เพิ่มความโปร่งใส เริ่มต้นตั้งค่าหอพักของคุณได้ฟรีเลยยาวดุจใจถึง 3 เดือน!"
    }
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.05),transparent_30%),linear-gradient(180deg,#fcfcfc_0%,#f5f5f5_100%)] flex flex-col relative">

      {showSplash && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center mt-12">
            <div className="w-64 h-64 md:w-96 md:h-96 rounded-[3rem] overflow-hidden mb-8 border-4 border-black/5 shadow-2xl relative">
              {splashScreens.map((s, i) => (
                <img
                  key={i}
                  src={s.image}
                  alt={s.title}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${i === splashStep ? "opacity-100" : "opacity-0"}`}
                />
              ))}
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight transition-all duration-300">
              {splashScreens[splashStep].title}
            </h2>
            <p className="text-muted-foreground text-sm md:text-lg max-w-lg mb-8 font-medium">
              {splashScreens[splashStep].desc}
            </p>

            <div className="flex gap-2 mb-12">
              {splashScreens.map((_, i) => (
                <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === splashStep ? "w-8 bg-[#d7b56d]" : "w-2 bg-black/10"}`} />
              ))}
            </div>
          </div>

          <div className="p-8 border-t border-black/10 flex justify-between items-center bg-slate-50/50">
            <button
              onClick={completeSplash}
              className="text-muted-foreground hover:text-black font-bold uppercase tracking-widest text-xs transition-colors"
            >
              ข้าม
            </button>
            <button
              onClick={() => {
                if (splashStep === splashScreens.length - 1) completeSplash();
                else setSplashStep(prev => prev + 1);
              }}
              className="px-8 py-3 bg-black text-white rounded-full font-black uppercase text-sm tracking-widest flex items-center gap-2 hover:bg-black/80 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              {splashStep === splashScreens.length - 1 ? (
                <>เริ่มใช้งาน <Check className="w-4 h-4" /></>
              ) : (
                <>ถัดไป <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left: Big text block + Login buttons */}
        <div className="flex-1 p-8 lg:p-16 flex flex-col justify-center border-r-0 lg:border-r border-black/10">
          <div className="max-w-xl">
            <div className="flex items-center gap-4 mb-8">
              <BrandMark size="lg" />
              <div className="text-xs font-mono font-bold uppercase tracking-[0.25em] text-muted-foreground border-l border-black/15 pl-4">
                ระบบจัดการหอพัก / อพาร์ทเม้นท์
              </div>
            </div>
            <h1 className="text-6xl lg:text-8xl font-black leading-none tracking-tighter mb-6">
              หอพัก<br />
              <span className="text-[#d7b56d]">โปร</span>
            </h1>
            <p className="text-lg font-medium text-muted-foreground mb-10 max-w-lg leading-relaxed">
              บริหารหอพักและอพาร์ทเม้นท์แบบครบวงจร จัดการห้อง ผู้เช่า บิล และมิเตอร์ในที่เดียว
            </p>

            {/* ── Login Section: 2 Groups ── */}
            <div className="space-y-6">
              <div className="text-xs font-mono font-bold uppercase tracking-[0.25em] text-muted-foreground border-l border-black/15 pl-3">
                เลือกเข้าสู่ระบบ
              </div>

              {bootstrapStatus.data?.canCreateFirstAdmin && (
                <div className="rounded-[28px] border border-black/10 p-5 bg-white/95 backdrop-blur-sm space-y-3 shadow-[0_18px_40px_rgba(0,0,0,0.06)]">
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

              <div className="rounded-[28px] border border-black/10 p-5 bg-white/95 backdrop-blur-sm space-y-3 shadow-[0_18px_40px_rgba(0,0,0,0.06)] relative overflow-hidden">
                {/* Ribbon */}
                <div className="absolute -right-[1.5rem] top-[0.6rem] rotate-45 bg-[#d7b56d] text-white font-black text-[10px] uppercase tracking-widest px-8 py-0.5 shadow-sm">
                  FREE 90 DAYS
                </div>

                <div className="flex gap-4 border-b border-black/10 pb-2 mb-3">
                  <button
                    className={`text-xs font-mono font-bold uppercase tracking-widest pb-1 border-b-2 transition-colors ${authMode === 'login' ? 'border-black text-black' : 'border-transparent text-muted-foreground'}`}
                    onClick={() => setAuthMode('login')}
                  >
                    เข้าสู่ระบบ
                  </button>
                  <button
                    className={`text-xs font-mono font-bold uppercase tracking-widest pb-1 border-b-2 transition-colors ${authMode === 'register' ? 'border-[#d7b56d] text-[#d7b56d]' : 'border-transparent text-muted-foreground'}`}
                    onClick={() => setAuthMode('register')}
                  >
                    เปิดตึกใหม่ (ทดลองฟรี 90 วัน)
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {authMode === 'register' && (
                    <input
                      type="text"
                      className="brut-input"
                      placeholder="ชื่อ-นามสกุล / ชื่อหอพักของคุณ"
                      value={bootstrapName}
                      onChange={(e) => setBootstrapName(e.target.value)}
                    />
                  )}
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

                {authMode === 'register' && (
                  <p className="text-[11px] font-mono text-muted-foreground text-center">
                    ทดลองใช้งานฟรี 90 วัน จากนั้นเริ่มเพียง <span className="font-bold text-black border-b border-black">89 บาท/เดือน</span> (ห้องละ 5 บาท)
                  </p>
                )}

                <button
                  className="brut-btn bg-black text-white hover:bg-black/80"
                  disabled={(authMode === 'login' ? localLogin.isPending : registerMutation.isPending) || !email || !password || (authMode === 'register' && !bootstrapName)}
                  onClick={() => {
                    if (authMode === 'login') {
                      localLogin.mutate({ email, password });
                    } else {
                      registerMutation.mutate({ name: bootstrapName, email, password });
                    }
                  }}
                >
                  {authMode === 'login'
                    ? (localLogin.isPending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบไปยังหอพักของคุณ")
                    : (registerMutation.isPending ? "กำลังสร้างระบบหอพัก..." : "สมัครสมาชิกและเริ่มทดลองใช้งานฟรี!")
                  }
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
                  className="group relative rounded-[28px] border border-black/10 bg-white p-6 text-left hover:bg-black hover:text-white transition-all duration-200"
                  style={{ boxShadow: "0 18px 40px rgba(0,0,0,0.08)" }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl border border-current flex items-center justify-center">
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
                  className="group relative rounded-[28px] border border-black/10 bg-white p-6 text-left hover:border-black hover:bg-black hover:text-white transition-all duration-200"
                  style={{ boxShadow: "0 18px 40px rgba(0,0,0,0.08)" }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl border border-current flex items-center justify-center">
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
        <div className="lg:w-[28rem] p-8 lg:p-12 flex flex-col justify-center gap-6 bg-black text-white">
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3 w-fit">
            <BrandMark size="sm" inverted />
            <div>
              <div className="text-sm font-black tracking-tight">Minimal Black</div>
              <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#d7b56d]">Dormitory OS</div>
            </div>
          </div>
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
            <div key={f.title} className="rounded-[24px] border border-white/15 bg-white/[0.03] p-5 hover:border-white/35 transition-all duration-200">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl border border-white/20 flex items-center justify-center shrink-0 bg-white/[0.04]">
                  <f.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-black uppercase text-sm tracking-wide">{f.title}</div>
                  <div className="text-xs text-white/50 mt-1 font-mono">{f.desc}</div>
                </div>
              </div>
            </div>
          ))}

          <div className="mt-4 border-t border-white/10 pt-4">
            <div className="text-xs font-mono text-white/40 uppercase tracking-widest">
              รองรับ 2 ฝั่ง
            </div>
            <div className="flex gap-3 mt-2">
              <span className="px-3 py-1 rounded-full border border-white text-xs font-black uppercase">เจ้าของ</span>
              <span className="px-3 py-1 rounded-full border border-white/30 text-xs font-black uppercase text-white/60">ผู้เช่า</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-black/10 px-8 py-4 flex items-center justify-between bg-white/70 backdrop-blur-sm">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">หอพักโปร © 2025</span>
        <span className="text-xs font-mono text-muted-foreground">v1.0</span>
      </div>
    </div>
  );
}
