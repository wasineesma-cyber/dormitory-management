import { useState } from "react";
import { X, ChevronRight, Check } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function OnboardingTutorial() {
    const { user } = useAuth();
    // Safe default: only open for admin who hasn't completed onboarding, or regular user
    // Let's assume tenant and admin both see it, or only admin?
    // "สอนการดาวโหลดเว็บแอพและการใช้ง่านฟีเจอร์ต่างๆ" - applies to all possibly, but admin features are different.
    const [isOpen, setIsOpen] = useState(user && user.hasCompletedOnboarding === false);
    const [step, setStep] = useState(0);
    const completeMutation = trpc.auth.completeOnboarding.useMutation();

    if (!isOpen) return null;

    const isAdmin = user?.role === "admin";

    const adminSteps = [
        {
            title: "ยินดีต้อนรับสู่หอพักโปร!",
            description: "ระบบจัดการหอพักและอพาร์ตเมนต์ที่ทันสมัยและใช้งานง่าย ช่วยให้คุณบริหารจัดการทุกอย่างได้ในที่เดียว",
            image: "🏠",
        },
        {
            title: "ติดตั้งแอป (PWA)",
            description: "เข้าใช้งานรวดเร็วได้เหมือนแอปพลิเคชันบนมือถือ เพียงกด 'เพิ่มลงในหน้าจอหลัก' หรือเลือก Share > 'Add to Home Screen'",
            image: "📱",
        },
        {
            title: "จัดการห้องพักและผู้เช่า",
            description: "สามารถเพิ่ม ดูสถานะห้องพัก รายชื่อผู้เช่า และติดตามการชำระเงินมัดจำได้อย่างง่ายดาย",
            image: "🔑",
        },
        {
            title: "ระบบแจ้งเตือนและชำระเงิน",
            description: "สร้างบิลค่าเช่าอัตโนมัติ รองรับ QR Code ผูกพร้อมเพย์ และระบบเตือนเมื่อมีบิลหรือค้างชำระ",
            image: "💳",
        }
    ];

    const tenantSteps = [
        {
            title: "ยินดีต้อนรับ!",
            description: "แอปพลิเคชันสำหรับผู้เช่าเพื่อดูข้อมูลและจัดการบิลค่าเช่าของคุณ",
            image: "🏠",
        },
        {
            title: "ติดตั้งแอป (PWA)",
            description: "เข้าใช้งานได้ง่ายๆ เพียงติดตั้งแอปในเครื่อง โดยกด 'เพิ่มลงในหน้าจอหลัก' (Add to Home Screen)",
            image: "📱",
        },
        {
            title: "ดูบิลและชำระเงิน",
            description: "ระบบจะแจ้งเตือนบิลใหม่ คุณสามารถดูรายละเอียด สแกน QR และแนบสลิปผ่านทางแอปได้เลย",
            image: "💳",
        },
        {
            title: "อัปเดตพัสดุ",
            description: "ระบบจะแจ้งเตือนเมื่อคุณมีพัสดุมาถึง สามารถตรวจสอบสถานะพัสดุได้ตลอดเวลา",
            image: "📦",
        }
    ];

    const steps = isAdmin ? adminSteps : tenantSteps;

    const handleComplete = async () => {
        await completeMutation.mutateAsync();
        setIsOpen(false);
    };

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            handleComplete();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="relative h-48 bg-gradient-to-br from-slate-900 to-[#d7b56d] flex flex-col items-center justify-center p-6 text-white text-center">
                    <button
                        onClick={handleComplete}
                        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="text-6xl mb-4">{steps[step].image}</div>
                    <h2 className="text-2xl font-bold tracking-tight">{steps[step].title}</h2>
                </div>

                <div className="p-6">
                    <p className="text-slate-600 text-center text-sm mb-8 min-h-[60px]">
                        {steps[step].description}
                    </p>

                    <div className="flex items-center justify-between mt-4 border-t pt-4">
                        <div className="flex gap-1.5">
                            {steps.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-2 rounded-full transition-all ${i === step ? "w-4 bg-[#d7b56d]" : "w-2 bg-slate-200"
                                        }`}
                                />
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleComplete}
                                className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
                            >
                                ข้าม
                            </button>
                            <button
                                onClick={handleNext}
                                className="bg-[#d7b56d] hover:bg-[#c6a45c] text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-1 transition-colors shadow-sm"
                            >
                                {step < steps.length - 1 ? (
                                    <>ถัดไป <ChevronRight className="w-4 h-4" /></>
                                ) : (
                                    <>เริ่มใช้งาน <Check className="w-4 h-4" /></>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
