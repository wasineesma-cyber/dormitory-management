import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Building2, CheckCircle, ChevronRight, Clock, Package, Receipt, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const statusLabel: Record<string, string> = {
  unpaid: "ยังไม่จ่าย", paid: "จ่ายแล้ว", partial: "จ่ายบางส่วน",
  pending_verification: "รอตรวจสอบ", overdue: "เกินกำหนด",
};

function SlipUploadModal({ bill, onClose }: { bill: any; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [slipUrl, setSlipUrl] = useState("");
  const [note, setNote] = useState("");

  const submitSlip = trpc.tenants.submitPaymentSlip.useMutation({
    onSuccess: () => { utils.bills.list.invalidate(); toast.success("ส่งหลักฐานการชำระเงินสำเร็จ รอการตรวจสอบ"); onClose(); },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white border-4 border-black w-full max-w-md" style={{ boxShadow: "8px 8px 0px rgba(0,0,0,0.5)" }}>
        <div className="flex items-center justify-between p-6 border-b-4 border-black">
          <h2 className="text-xl font-black uppercase">แจ้งชำระเงิน</h2>
          <button onClick={onClose}><X className="w-6 h-6" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-black text-white p-4">
            <div className="text-xs font-mono uppercase">บิล {bill.billNumber}</div>
            <div className="text-3xl font-black mt-1">฿{Number(bill.totalAmount).toLocaleString()}</div>
          </div>
          <div>
            <label className="brut-label">URL สลิปโอนเงิน *</label>
            <input className="brut-input font-mono text-xs" value={slipUrl} onChange={e => setSlipUrl(e.target.value)}
              placeholder="https://..." />
            <div className="text-xs font-mono text-muted-foreground mt-1">อัปโหลดรูปสลิปไปยัง Google Drive หรือ Imgur แล้วใส่ลิงก์ที่นี่</div>
          </div>
          <div>
            <label className="brut-label">หมายเหตุ</label>
            <input className="brut-input" value={note} onChange={e => setNote(e.target.value)} placeholder="เช่น โอนเมื่อ 14:30 น." />
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t-4 border-black">
          <button onClick={() => submitSlip.mutate({ billId: bill.id, slipImageUrl: slipUrl, notes: note || undefined })}
            disabled={submitSlip.isPending || !slipUrl} className="brut-btn flex-1">
            {submitSlip.isPending ? "กำลังส่ง..." : "ส่งหลักฐาน"}
          </button>
          <button onClick={onClose} className="px-6 py-2.5 border-2 border-black font-bold text-sm uppercase hover:bg-gray-100">ยกเลิก</button>
        </div>
      </div>
    </div>
  );
}

export default function TenantPortal() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { data: myInfo, isLoading: loadingInfo } = trpc.tenants.myInfo.useQuery();
  const { data: bills = [], isLoading: loadingBills } = trpc.bills.list.useQuery({});
  const { data: packages = [], isLoading: loadingPackages } = trpc.packages.myList.useQuery();
  const [selectedBill, setSelectedBill] = useState<any>(null);

  const unpaidBills = bills.filter(b => b.status !== "paid");
  const paidBills = bills.filter(b => b.status === "paid");

  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">— ยินดีต้อนรับ</div>
        <h1 className="text-4xl font-black uppercase tracking-tighter">
          {user?.name || "ผู้เช่า"}
        </h1>
        <div className="h-1 w-24 bg-black mt-3" />
      </div>

      {/* Room info */}
      {loadingInfo ? (
        <div className="brut-card animate-pulse h-32 mb-6" />
      ) : myInfo ? (
        <div className="brut-card mb-6">
          <div className="text-xs font-mono font-bold uppercase tracking-widest mb-4 border-l-4 border-black pl-3">ข้อมูลห้องของคุณ</div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <div className="text-xs font-mono text-muted-foreground uppercase">ห้อง</div>
              <div className="text-3xl font-black">{myInfo.room?.roomNumber ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs font-mono text-muted-foreground uppercase">อาคาร</div>
              <div className="font-bold">{myInfo.room?.building ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs font-mono text-muted-foreground uppercase">ค่าเช่า</div>
              <div className="font-black text-xl">฿{Number(myInfo.room?.pricePerMonth ?? myInfo.room?.pricePerDay ?? 0).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs font-mono text-muted-foreground uppercase">สัญญา</div>
              <div className="font-bold text-sm">
                {myInfo.contractStartDate ? String(myInfo.contractStartDate).split("T")[0] : "—"}
                {myInfo.contractEndDate ? ` → ${String(myInfo.contractEndDate).split("T")[0]}` : ""}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="brut-card mb-6 text-center py-8">
          <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <div className="font-bold text-muted-foreground">ยังไม่ได้เชื่อมกับห้องพัก</div>
          <div className="text-xs font-mono text-muted-foreground mt-1">กรุณาติดต่อเจ้าของหอพัก</div>
        </div>
      )}

      {/* Unpaid bills */}
      <div className="mb-6">
        <div className="text-xs font-mono font-bold uppercase tracking-widest mb-3 border-l-4 border-black pl-3">
          บิลที่ต้องชำระ ({unpaidBills.length})
        </div>
        {loadingBills ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="brut-card animate-pulse h-20" />)}</div>
        ) : unpaidBills.length === 0 ? (
          <div className="brut-card text-center py-8">
            <CheckCircle className="w-10 h-10 mx-auto text-green-500 mb-2" />
            <div className="font-bold text-muted-foreground">ไม่มีบิลค้างชำระ</div>
          </div>
        ) : (
          <div className="space-y-3">
            {unpaidBills.map(bill => (
              <div key={bill.id} className="brut-card-hover">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black font-mono text-sm">{bill.billNumber}</span>
                      <span className={`badge-${bill.status}`}>{statusLabel[bill.status]}</span>
                      {bill.billingPeriod && <span className="text-xs border-2 border-black px-2 py-0.5 font-mono">{bill.billingPeriod}</span>}
                    </div>
                    {bill.dueDate && (
                      <div className="flex items-center gap-1 mt-1 text-xs font-mono text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        ครบกำหนด: {String(bill.dueDate).split("T")[0]}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black">฿{Number(bill.totalAmount).toLocaleString()}</div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => navigate(`/portal/bills/${bill.id}`)}
                        className="px-3 py-1.5 border-2 border-black text-xs font-bold uppercase hover:bg-gray-100 transition-all flex items-center gap-1">
                        ดูรายละเอียด <ChevronRight className="w-3 h-3" />
                      </button>
                      {bill.status !== "paid" && (
                        <button onClick={() => setSelectedBill(bill)}
                          className="px-3 py-1.5 bg-black text-white text-xs font-bold uppercase hover:bg-gray-800 transition-all">
                          แจ้งชำระ
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-6">
        <div className="text-xs font-mono font-bold uppercase tracking-widest mb-3 border-l-4 border-black pl-3">
          พัสดุของฉัน ({packages.length})
        </div>
        {loadingPackages ? (
          <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="brut-card animate-pulse h-20" />)}</div>
        ) : packages.length === 0 ? (
          <div className="brut-card text-center py-8">
            <Package className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            <div className="font-bold text-muted-foreground">ยังไม่มีพัสดุมาถึง</div>
          </div>
        ) : (
          <div className="space-y-3">
            {packages.map((parcel: any) => (
              <div key={parcel.id} className="brut-card">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black">{parcel.itemName}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 border-2 ${parcel.status === "picked_up" ? "border-green-700 text-green-700" : "border-black text-black"}`}>
                        {parcel.status === "picked_up" ? "รับแล้ว" : "มาถึงแล้ว"}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-3">
                      {parcel.carrier && <span>ขนส่ง: {parcel.carrier}</span>}
                      {parcel.trackingNumber && <span className="font-mono">#{parcel.trackingNumber}</span>}
                    </div>
                    <div className="text-xs font-mono text-muted-foreground mt-1">
                      วันที่มาถึง: {parcel.arrivedAt ? String(parcel.arrivedAt).split("T")[0] : "-"}
                      {parcel.pickedUpAt ? ` • รับของแล้ว: ${String(parcel.pickedUpAt).split("T")[0]}` : ""}
                    </div>
                  </div>
                  <Package className={`w-8 h-8 shrink-0 ${parcel.status === "picked_up" ? "text-green-600" : "text-black"}`} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Paid bills history */}
      {paidBills.length > 0 && (
        <div>
          <div className="text-xs font-mono font-bold uppercase tracking-widest mb-3 border-l-4 border-black pl-3">
            ประวัติการชำระ ({paidBills.length})
          </div>
          <div className="space-y-2">
            {paidBills.map(bill => (
              <div key={bill.id} className="brut-card flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-green-600" />
                    <span className="font-mono text-sm">{bill.billNumber}</span>
                    {bill.billingPeriod && <span className="text-xs text-muted-foreground font-mono">{bill.billingPeriod}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold font-mono">฿{Number(bill.totalAmount).toLocaleString()}</span>
                  <span className="badge-paid">จ่ายแล้ว</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedBill && <SlipUploadModal bill={selectedBill} onClose={() => setSelectedBill(null)} />}
    </DashboardLayout>
  );
}
