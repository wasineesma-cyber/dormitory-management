import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Clock, Download, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation, useParams } from "wouter";

const statusLabel: Record<string, string> = {
  unpaid: "ยังไม่จ่าย", paid: "จ่ายแล้ว", partial: "จ่ายบางส่วน",
  pending_verification: "รอตรวจสอบ", overdue: "เกินกำหนด",
};

function QRCodeBlock({ bill }: { bill: any }) {
  const { data: qrData } = trpc.bills.qrCode.useQuery(
    { billId: bill.id, promptPayId: bill.promptPayId },
    { enabled: !!bill.promptPayId }
  );
  if (!bill.promptPayId) return null;
  return (
    <div className="brut-card text-center">
      <div className="text-xs font-mono font-bold uppercase tracking-widest mb-3">สแกนจ่ายผ่าน PromptPay</div>
      {qrData?.qrDataUrl ? (
        <img src={qrData.qrDataUrl} alt="QR Code" className="w-52 h-52 mx-auto border-2 border-black" />
      ) : (
        <div className="w-52 h-52 mx-auto border-2 border-black bg-gray-50 flex items-center justify-center">
          <span className="text-xs font-mono text-muted-foreground">กำลังโหลด QR...</span>
        </div>
      )}
      <div className="text-xs font-mono mt-2 text-muted-foreground">{bill.promptPayId}</div>
      <div className="text-3xl font-black mt-2">฿{Number(qrData?.amount ?? bill.totalAmount).toLocaleString()}</div>
    </div>
  );
}

function SlipModal({ bill, onClose }: { bill: any; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [slipUrl, setSlipUrl] = useState("");
  const [note, setNote] = useState("");

  const submitSlip = trpc.tenants.submitPaymentSlip.useMutation({
    onSuccess: () => {
      utils.bills.byId.invalidate();
      toast.success("ส่งหลักฐานการชำระเงินสำเร็จ รอการตรวจสอบจากเจ้าของ");
      onClose();
    },
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
            <div className="text-xs font-mono uppercase">ยอดที่ต้องชำระ</div>
            <div className="text-3xl font-black mt-1">
              ฿{(Number(bill.totalAmount) - Number(bill.paidAmount)).toLocaleString()}
            </div>
          </div>
          <div>
            <label className="brut-label">URL รูปสลิปโอนเงิน *</label>
            <input className="brut-input font-mono text-xs" value={slipUrl} onChange={e => setSlipUrl(e.target.value)}
              placeholder="https://..." />
            <div className="text-xs font-mono text-muted-foreground mt-1">
              อัปโหลดรูปสลิปไปยัง Google Drive, Imgur หรือ Dropbox แล้วใส่ลิงก์ที่นี่
            </div>
          </div>
          <div>
            <label className="brut-label">หมายเหตุ</label>
            <input className="brut-input" value={note} onChange={e => setNote(e.target.value)}
              placeholder="เช่น โอนเมื่อ 14:30 น. วันที่ 1 เม.ย." />
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t-4 border-black">
          <button
            onClick={() => submitSlip.mutate({ billId: bill.id, slipImageUrl: slipUrl, notes: note || undefined })}
            disabled={submitSlip.isPending || !slipUrl}
            className="brut-btn flex-1">
            {submitSlip.isPending ? "กำลังส่ง..." : "ส่งหลักฐาน"}
          </button>
          <button onClick={onClose} className="px-6 py-2.5 border-2 border-black font-bold text-sm uppercase hover:bg-gray-100">
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TenantBillDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { data: bill, isLoading } = trpc.bills.byId.useQuery({ id: parseInt(params.id) });
  const [showSlip, setShowSlip] = useState(false);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <div className="brut-card animate-pulse h-20" />
          <div className="brut-card animate-pulse h-48" />
        </div>
      </DashboardLayout>
    );
  }

  if (!bill) {
    return (
      <DashboardLayout>
        <div className="brut-card text-center py-16">
          <div className="text-4xl font-black text-gray-200 mb-4">404</div>
          <div className="font-bold uppercase">ไม่พบบิลนี้</div>
          <button onClick={() => navigate("/portal")} className="brut-btn mt-4">กลับ</button>
        </div>
      </DashboardLayout>
    );
  }

  const remaining = Number(bill.totalAmount) - Number(bill.paidAmount);

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center gap-4">
        <button onClick={() => navigate("/portal")} className="p-2 border-2 border-black hover:bg-black hover:text-white transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">— ใบแจ้งหนี้</div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">{bill.billNumber}</h1>
        </div>
        <span className={`badge-${bill.status} ml-2`}>{statusLabel[bill.status]}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bill details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="brut-card">
            <div className="text-xs font-mono font-bold uppercase tracking-widest mb-4 border-l-4 border-black pl-3">ข้อมูลบิล</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground font-mono text-xs uppercase">ห้อง</span>
                <div className="font-black text-2xl">{bill.room?.roomNumber ?? "—"}</div>
              </div>
              <div>
                <span className="text-muted-foreground font-mono text-xs uppercase">รอบบิล</span>
                <div className="font-bold font-mono">{bill.billingPeriod ?? "—"}</div>
              </div>
              {bill.dueDate && (
                <div className="col-span-2">
                  <span className="text-muted-foreground font-mono text-xs uppercase">วันครบกำหนด</span>
                  <div className="flex items-center gap-2 font-bold font-mono">
                    <Clock className="w-4 h-4" />
                    {String(bill.dueDate).split("T")[0]}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Meter readings */}
          {(bill.waterMeterBefore || bill.electricityMeterBefore) && (
            <div className="brut-card">
              <div className="text-xs font-mono font-bold uppercase tracking-widest mb-4 border-l-4 border-black pl-3">เลขมิเตอร์</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bill.waterMeterBefore && (
                  <div className="p-3 border-2 border-dashed border-gray-300 bg-gray-50">
                    <div className="text-xs font-mono font-bold uppercase mb-2">มิเตอร์น้ำ</div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-mono">ก่อน: <strong>{bill.waterMeterBefore}</strong></span>
                      <span className="font-mono">หลัง: <strong>{bill.waterMeterAfter}</strong></span>
                    </div>
                    <div className="text-xs font-mono text-muted-foreground mt-1">ใช้ไป {bill.waterUnitsUsed} หน่วย</div>
                  </div>
                )}
                {bill.electricityMeterBefore && (
                  <div className="p-3 border-2 border-dashed border-gray-300 bg-gray-50">
                    <div className="text-xs font-mono font-bold uppercase mb-2">มิเตอร์ไฟ</div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-mono">ก่อน: <strong>{bill.electricityMeterBefore}</strong></span>
                      <span className="font-mono">หลัง: <strong>{bill.electricityMeterAfter}</strong></span>
                    </div>
                    <div className="text-xs font-mono text-muted-foreground mt-1">ใช้ไป {bill.electricityUnitsUsed} หน่วย</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Line items */}
          <div className="brut-card">
            <div className="text-xs font-mono font-bold uppercase tracking-widest mb-4 border-l-4 border-black pl-3">รายการค่าใช้จ่าย</div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="text-left py-2 font-black uppercase text-xs">รายการ</th>
                  <th className="text-right py-2 font-black uppercase text-xs">จำนวน</th>
                </tr>
              </thead>
              <tbody>
                {bill.items?.map((item: any, i: number) => (
                  <tr key={i} className="border-b border-gray-200">
                    <td className="py-2">{item.description}</td>
                    <td className="py-2 text-right font-mono font-bold">฿{Number(item.amount).toLocaleString()}</td>
                  </tr>
                ))}
                {Number(bill.discount) > 0 && (
                  <tr className="border-b border-gray-200 text-green-700">
                    <td className="py-2">ส่วนลด</td>
                    <td className="py-2 text-right font-mono font-bold">-฿{Number(bill.discount).toLocaleString()}</td>
                  </tr>
                )}
                {Number(bill.penalty) > 0 && (
                  <tr className="border-b border-gray-200 text-red-700">
                    <td className="py-2">ค่าปรับ</td>
                    <td className="py-2 text-right font-mono font-bold">+฿{Number(bill.penalty).toLocaleString()}</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-4 border-black">
                  <td className="py-3 font-black uppercase">รวมทั้งหมด</td>
                  <td className="py-3 text-right font-black text-2xl">฿{Number(bill.totalAmount).toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Payment history */}
          {bill.payments && bill.payments.length > 0 && (
            <div className="brut-card">
              <div className="text-xs font-mono font-bold uppercase tracking-widest mb-4 border-l-4 border-black pl-3">ประวัติการชำระ</div>
              <div className="space-y-2">
                {bill.payments.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-200">
                    <div>
                      <div className="text-sm font-bold">
                        {p.paymentMethod === "cash" ? "เงินสด" : p.paymentMethod === "transfer" ? "โอนเงิน" : p.paymentMethod}
                      </div>
                      <div className="text-xs font-mono text-muted-foreground">{String(p.paymentDate)}</div>
                    </div>
                    <div className="font-black text-green-700">+฿{Number(p.amount).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {bill.notes && (
            <div className="brut-card">
              <div className="text-xs font-mono font-bold uppercase tracking-widest mb-2">หมายเหตุ</div>
              <div className="text-sm text-muted-foreground">{bill.notes}</div>
            </div>
          )}
        </div>

        {/* Right: QR + payment summary */}
        <div className="space-y-4">
          <QRCodeBlock bill={bill} />

          <div className="brut-card">
            <div className="text-xs font-mono font-bold uppercase tracking-widest mb-3">สรุปการชำระ</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ยอดรวม</span>
                <span className="font-bold">฿{Number(bill.totalAmount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-green-700">
                <span>ชำระแล้ว</span>
                <span className="font-bold">฿{Number(bill.paidAmount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t-2 border-black pt-2">
                <span className="font-black">คงค้าง</span>
                <span className="font-black text-xl">
                  {remaining > 0 ? `฿${remaining.toLocaleString()}` : "ชำระครบแล้ว ✓"}
                </span>
              </div>
            </div>
          </div>

          {bill.status !== "paid" && (
            <button onClick={() => setShowSlip(true)} className="brut-btn w-full">
              แจ้งชำระเงิน
            </button>
          )}

          <button onClick={() => window.print()} className="w-full flex items-center justify-center gap-2 px-5 py-2.5 border-2 border-black text-sm font-bold uppercase hover:bg-gray-100 transition-all">
            พิมพ์ใบแจ้งหนี้
          </button>
          <a href={`/api/bills/${bill.id}/pdf`} target="_blank" rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 border-2 border-black text-sm font-bold uppercase hover:bg-gray-100 transition-all">
            <Download className="w-4 h-4" />ดาวน์โหลด PDF
          </a>
        </div>
      </div>

      {showSlip && <SlipModal bill={bill} onClose={() => setShowSlip(false)} />}
    </DashboardLayout>
  );
}
