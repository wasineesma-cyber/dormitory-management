import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { PenTool, CheckCircle, Clock, XCircle, Wrench } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Maintenance() {
    const utils = trpc.useUtils();
    const { data: requests = [], isLoading } = trpc.maintenance.list.useQuery();
    const updateStatus = trpc.maintenance.updateStatus.useMutation({
        onSuccess: () => {
            utils.maintenance.list.invalidate();
            toast.success("อัปเดตสถานะแจ้งซ่อมสำเร็จ");
        },
        onError: (e) => toast.error(e.message)
    });

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="animate-pulse space-y-4">
                    <div className="h-12 bg-gray-200 w-1/4"></div>
                    <div className="h-32 bg-gray-200 w-full"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="mb-8 flex items-center gap-4">
                <Wrench className="w-10 h-10 text-black" />
                <div>
                    <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest">— จัดการดูแล</div>
                    <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mt-1">แจ้งซ่อม</h1>
                </div>
            </div>

            {requests.length === 0 ? (
                <div className="brut-card text-center py-16">
                    <CheckCircle className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <h2 className="text-2xl font-bold">ไม่มีรายการแจ้งซ่อม</h2>
                    <p className="text-muted-foreground">ทุกอย่างปกติดีในขณะนี้</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {requests.map((req: any) => (
                        <div key={req.id} className="brut-card bg-white flex flex-col md:flex-row justify-between gap-6">
                            <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="font-mono font-bold px-2 py-0.5 border-2 border-black bg-yellow-100">
                                        ห้อง {req.roomId}
                                    </span>
                                    <span className="bg-black text-white px-2 py-0.5 text-xs font-bold uppercase tracking-widest">
                                        {req.issueType || "ทั่วไป"}
                                    </span>
                                    <span className={`text-xs font-bold px-2 py-0.5 border-2 ${req.status === 'resolved' ? 'border-green-600 text-green-600' :
                                            req.status === 'in_progress' ? 'border-[#d7b56d] text-[#b4904b]' :
                                                req.status === 'cancelled' ? 'border-red-600 text-red-600' :
                                                    'border-black text-black'
                                        }`}>
                                        {req.status === 'resolved' ? 'แก้ไขแล้ว ✓' :
                                            req.status === 'in_progress' ? 'กำลังดำเนินการ' :
                                                req.status === 'cancelled' ? 'ยกเลิก' : 'รอดำเนินการ'}
                                    </span>
                                </div>
                                <p className="text-lg font-bold">{req.description}</p>
                                <div className="text-sm font-mono text-muted-foreground">
                                    แจ้งเมื่อ: {String(req.reportedAt).replace("T", " ").split(".")[0]}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 items-center md:items-start border-t-2 md:border-t-0 md:border-l-2 border-dashed border-gray-300 pt-4 md:pt-0 md:pl-6">
                                <div className="text-xs font-mono font-bold uppercase mb-2 w-full">อัปเดตสถานะ:</div>
                                <button
                                    disabled={req.status === 'pending'}
                                    onClick={() => updateStatus.mutate({ id: req.id, status: 'pending' })}
                                    className="px-3 py-1 border-2 border-black text-xs font-bold disabled:opacity-50 disabled:bg-gray-100 hover:bg-black hover:text-white transition-all flex items-center gap-1"
                                >
                                    <Clock className="w-3 h-3" /> รอดำเนินการ
                                </button>
                                <button
                                    disabled={req.status === 'in_progress'}
                                    onClick={() => updateStatus.mutate({ id: req.id, status: 'in_progress' })}
                                    className="px-3 py-1 border-2 border-black text-xs font-bold disabled:opacity-50 disabled:bg-yellow-100 hover:bg-[#d7b56d] transition-all flex items-center gap-1"
                                >
                                    <PenTool className="w-3 h-3" /> กำลังซ่อม
                                </button>
                                <button
                                    disabled={req.status === 'resolved'}
                                    onClick={() => updateStatus.mutate({ id: req.id, status: 'resolved' })}
                                    className="px-3 py-1 border-2 border-black text-xs font-bold disabled:opacity-50 disabled:bg-green-100 hover:bg-green-600 hover:text-white transition-all flex items-center gap-1"
                                >
                                    <CheckCircle className="w-3 h-3" /> เสร็จสิ้น
                                </button>
                                <button
                                    disabled={req.status === 'cancelled'}
                                    onClick={() => updateStatus.mutate({ id: req.id, status: 'cancelled' })}
                                    className="px-3 py-1 border-2 border-black text-xs font-bold disabled:opacity-50 disabled:bg-red-100 hover:bg-red-600 hover:text-white transition-all flex items-center gap-1"
                                >
                                    <XCircle className="w-3 h-3" /> ยกเลิก
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
}
