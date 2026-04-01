import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CheckCircle, Download, Edit2, Printer, X, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation, useParams } from "wouter";

const asArray = <T,>(value: unknown): T[] => Array.isArray(value) ? (value as T[]) : [];
const asNumber = (value: unknown) => Number(value ?? 0);
const asText = (value: unknown, fallback = "—") => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
  if (value === null || value === undefined) return fallback;
  return String(value);
};

function QRCodeCard({ bill }: { bill: any }) {
  const { data: qrData } = trpc.bills.qrCode.useQuery(
    { billId: bill.id, promptPayId: bill.promptPayId },
    { enabled: !!bill.promptPayId }
  );
  return (
    <div className="brut-card text-center">
      <div className="text-xs font-mono font-bold uppercase tracking-widest mb-3">QR PromptPay</div>
      {qrData?.qrDataUrl ? (
        <img src={qrData.qrDataUrl} alt="QR Code" className="w-48 h-48 mx-auto border-2 border-black" />
      ) : (
        <div className="w-48 h-48 mx-auto border-2 border-black bg-gray-100 flex items-center justify-center">
          <span className="text-xs font-mono text-muted-foreground">กำลังโหลด QR...</span>
        </div>
      )}
      <div className="text-xs font-mono mt-2 text-muted-foreground">{bill.promptPayId}</div>
      <div className="text-2xl font-black mt-2">฿{Number(qrData?.amount ?? bill.totalAmount).toLocaleString()}</div>
    </div>
  );
}

const statusLabel: Record<string, string> = {
  unpaid: "ยังไม่จ่าย", paid: "จ่ายแล้ว", partial: "จ่ายบางส่วน",
  pending_verification: "รอตรวจสอบ", overdue: "เกินกำหนด",
};

function PaymentModal({ bill, onClose }: { bill: any; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [amount, setAmount] = useState(String(Number(bill.totalAmount) - Number(bill.paidAmount)));
  const [method, setMethod] = useState("cash");
  const [note, setNote] = useState("");
  const [slip, setSlip] = useState("");

  const recordPayment = trpc.bills.recordPayment.useMutation({
    onSuccess: () => { utils.bills.byId.invalidate(); utils.bills.list.invalidate(); toast.success("บันทึกการชำระเงินสำเร็จ"); onClose(); },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white border-4 border-black w-full max-w-md" style={{ boxShadow: "8px 8px 0px rgba(0,0,0,0.5)" }}>
        <div className="flex items-center justify-between p-6 border-b-4 border-black">
          <h2 className="text-xl font-black uppercase">บันทึกชำระเงิน</h2>
          <button onClick={onClose}><X className="w-6 h-6" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="brut-label">จำนวนเงิน (บาท)</label>
            <input className="brut-input font-mono text-2xl" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div>
            <label className="brut-label">วิธีชำระ</label>
            <select className="brut-input" value={method} onChange={e => setMethod(e.target.value)}>
              <option value="cash">เงินสด</option>
              <option value="transfer">โอนเงิน</option>
              <option value="promptpay">PromptPay</option>
              <option value="other">อื่นๆ</option>
            </select>
          </div>
          <div>
            <label className="brut-label">URL สลิปโอนเงิน</label>
            <input className="brut-input font-mono text-xs" value={slip} onChange={e => setSlip(e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <label className="brut-label">หมายเหตุ</label>
            <input className="brut-input" value={note} onChange={e => setNote(e.target.value)} />
          </div>
          <div className="bg-black text-white p-3 flex justify-between items-center">
            <span className="text-xs font-mono uppercase">ยอดคงค้าง</span>
            <span className="text-2xl font-black">฿{(Number(bill.totalAmount) - Number(bill.paidAmount)).toLocaleString()}</span>
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t-4 border-black">
          <button onClick={() => recordPayment.mutate({ billId: bill.id, amount, paymentMethod: method as any, slipImageUrl: slip || undefined, notes: note || undefined })}
            disabled={recordPayment.isPending || !amount} className="brut-btn flex-1">
            {recordPayment.isPending ? "กำลังบันทึก..." : "บันทึกชำระเงิน"}
          </button>
          <button onClick={onClose} className="px-6 py-2.5 border-2 border-black font-bold text-sm uppercase hover:bg-gray-100">ยกเลิก</button>
        </div>
      </div>
    </div>
  );
}

function EditBillModal({ bill, onClose }: { bill: any; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    rentAmount: String(bill.rentAmount || ""),
    waterAmount: String(bill.waterAmount || ""),
    electricityAmount: String(bill.electricityAmount || ""),
    otherCharges: String(bill.otherCharges || "0"),
    discount: String(bill.discount || "0"),
    penalty: String(bill.penalty || "0"),
    dueDate: bill.dueDate ? String(bill.dueDate).split("T")[0] : "",
    promptPayId: bill.promptPayId || "",
    notes: bill.notes || "",
    editReason: "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const editBill = trpc.bills.edit.useMutation({
    onSuccess: () => { utils.bills.byId.invalidate(); utils.bills.list.invalidate(); toast.success("แก้ไขบิลสำเร็จ"); onClose(); },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white border-4 border-black w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ boxShadow: "8px 8px 0px rgba(0,0,0,0.5)" }}>
        <div className="flex items-center justify-between p-6 border-b-4 border-black">
          <h2 className="text-xl font-black uppercase">แก้ไขบิล</h2>
          <button onClick={onClose}><X className="w-6 h-6" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="brut-label">ค่าเช่า</label><input className="brut-input font-mono" type="number" value={form.rentAmount} onChange={e => set("rentAmount", e.target.value)} /></div>
            <div><label className="brut-label">ค่าน้ำ</label><input className="brut-input font-mono" type="number" value={form.waterAmount} onChange={e => set("waterAmount", e.target.value)} /></div>
            <div><label className="brut-label">ค่าไฟ</label><input className="brut-input font-mono" type="number" value={form.electricityAmount} onChange={e => set("electricityAmount", e.target.value)} /></div>
            <div><label className="brut-label">ค่าอื่นๆ</label><input className="brut-input font-mono" type="number" value={form.otherCharges} onChange={e => set("otherCharges", e.target.value)} /></div>
            <div><label className="brut-label">ส่วนลด</label><input className="brut-input font-mono" type="number" value={form.discount} onChange={e => set("discount", e.target.value)} /></div>
            <div><label className="brut-label">ค่าปรับ</label><input className="brut-input font-mono" type="number" value={form.penalty} onChange={e => set("penalty", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="brut-label">วันครบกำหนด</label><input className="brut-input" type="date" value={form.dueDate} onChange={e => set("dueDate", e.target.value)} /></div>
            <div><label className="brut-label">PromptPay ID</label><input className="brut-input" type="text" value={form.promptPayId} onChange={e => set("promptPayId", e.target.value)} placeholder="เบอร์โทร / เลขบัตร" /></div>
          </div>
          <div><label className="brut-label">หมายเหตุ</label><textarea className="brut-input" rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} /></div>
          <div>
            <label className="brut-label">เหตุผลที่แก้ไข *</label>
            <input className="brut-input" value={form.editReason} onChange={e => set("editReason", e.target.value)} placeholder="กรุณาระบุเหตุผล" />
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t-4 border-black">
          <button onClick={() => editBill.mutate({ billId: bill.id, ...form })} disabled={editBill.isPending || !form.editReason} className="brut-btn flex-1">
            {editBill.isPending ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
          </button>
          <button onClick={onClose} className="px-6 py-2.5 border-2 border-black font-bold text-sm uppercase hover:bg-gray-100">ยกเลิก</button>
        </div>
      </div>
    </div>
  );
}

export default function BillDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const billId = Number.parseInt(params.id ?? "", 10);
  const { data: bill, isLoading } = trpc.bills.byId.useQuery(
    { id: billId },
    { enabled: Number.isFinite(billId) }
  );
  const [showPayment, setShowPayment] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const utils = trpc.useUtils();
  const deleteBill = trpc.bills.delete.useMutation({
    onSuccess: () => {
      toast.success("ลบบิลสำเร็จ");
      utils.bills.list.invalidate();
      navigate("/bills");
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="brut-card animate-pulse h-64" />
      </DashboardLayout>
    );
  }

  if (!Number.isFinite(billId) || !bill) {
    return (
      <DashboardLayout>
        <div className="brut-card text-center py-16">
          <div className="text-4xl font-black text-gray-200 mb-4">404</div>
          <div className="font-bold uppercase">ไม่พบบิลนี้</div>
          <button onClick={() => navigate("/bills")} className="brut-btn mt-4">กลับ</button>
        </div>
      </DashboardLayout>
    );
  }

  const items = asArray<any>(bill.items);
  const payments = asArray<any>(bill.payments);
  const editHistory = asArray<any>(bill.editHistory);
  const status = typeof bill.status === "string" && bill.status in statusLabel ? bill.status : "unpaid";
  const totalAmount = asNumber(bill.totalAmount);
  const paidAmount = asNumber(bill.paidAmount);
  const remaining = totalAmount - paidAmount;

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center gap-4">
        <button onClick={() => navigate("/bills")} className="p-2 border-2 border-black hover:bg-black hover:text-white transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">— บิล</div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">{asText(bill.billNumber, "BILL")}</h1>
        </div>
        <span className={`badge-${status} ml-2`}>{statusLabel[status]}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Bill details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="brut-card">
            <div className="text-xs font-mono font-bold uppercase tracking-widest mb-4 border-l-4 border-black pl-3">ข้อมูลบิล</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground font-mono text-xs uppercase">ห้อง</span><div className="font-black text-lg">{asText(bill.room?.roomNumber)}</div></div>
              <div><span className="text-muted-foreground font-mono text-xs uppercase">ผู้เช่า</span><div className="font-bold">{bill.tenant ? `${asText(bill.tenant.firstName, "")} ${asText(bill.tenant.lastName, "")}`.trim() || "—" : "—"}</div></div>
              <div><span className="text-muted-foreground font-mono text-xs uppercase">รอบบิล</span><div className="font-bold font-mono">{asText(bill.billingPeriod)}</div></div>
              <div><span className="text-muted-foreground font-mono text-xs uppercase">วันครบกำหนด</span><div className="font-bold font-mono">{bill.dueDate ? String(bill.dueDate).split("T")[0] : "—"}</div></div>
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
                {items.map((item: any, i: number) => (
                  <tr key={i} className="border-b border-gray-200">
                    <td className="py-2">{asText(item?.description)}</td>
                    <td className="py-2 text-right font-mono font-bold">฿{asNumber(item?.amount).toLocaleString()}</td>
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
                  <td className="py-3 text-right font-black text-2xl">฿{totalAmount.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Payment history */}
          {payments.length > 0 && (
            <div className="brut-card">
              <div className="text-xs font-mono font-bold uppercase tracking-widest mb-4 border-l-4 border-black pl-3">ประวัติการชำระ</div>
              <div className="space-y-2">
                {payments.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-200">
                    <div>
                      <div className="text-sm font-bold">{p.paymentMethod === "cash" ? "เงินสด" : p.paymentMethod === "transfer" ? "โอนเงิน" : p.paymentMethod}</div>
                      <div className="text-xs font-mono text-muted-foreground">{String(p.paymentDate)}</div>
                    </div>
                    <div className="font-black text-green-700">+฿{Number(p.amount).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Edit history */}
          {editHistory.length > 0 && (
            <div className="brut-card">
              <div className="text-xs font-mono font-bold uppercase tracking-widest mb-4 border-l-4 border-black pl-3">ประวัติการแก้ไข</div>
              <div className="space-y-2">
                {editHistory.map((h: any, i: number) => (
                  <div key={i} className="py-2 border-b border-gray-200 text-sm">
                    <div className="font-bold">{asText(h.editReason)}</div>
                    <div className="text-xs font-mono text-muted-foreground">{asText(h.editedAt ?? h.createdAt)} — {asText(h.fieldChanged)}: {asText(h.oldValue, "")} → {asText(h.newValue, "")}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: QR + actions */}
        <div className="space-y-4">
          {/* QR Code */}
          {bill.promptPayId && (
            <QRCodeCard bill={bill} />
          )}

          {/* Status summary */}
          <div className="brut-card">
            <div className="text-xs font-mono font-bold uppercase tracking-widest mb-3">สรุปการชำระ</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">ยอดรวม</span><span className="font-bold">฿{totalAmount.toLocaleString()}</span></div>
              <div className="flex justify-between text-green-700"><span>ชำระแล้ว</span><span className="font-bold">฿{paidAmount.toLocaleString()}</span></div>
              <div className="flex justify-between border-t-2 border-black pt-2"><span className="font-black">คงค้าง</span><span className="font-black text-xl">{remaining > 0 ? `฿${remaining.toLocaleString()}` : "ชำระครบแล้ว ✓"}</span></div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {bill.status !== "paid" && (
              <button onClick={() => setShowPayment(true)} className="brut-btn w-full gap-2">
                <CheckCircle className="w-4 h-4" />บันทึกชำระเงิน
              </button>
            )}
            <button onClick={() => setShowEdit(true)} className="brut-btn-outline w-full gap-2 px-5 py-2.5 border-2 border-black font-bold text-sm uppercase flex items-center justify-center">
              <Edit2 className="w-4 h-4" />แก้ไขบิล
            </button>
            <button onClick={() => window.print()} className="w-full flex items-center justify-center gap-2 px-5 py-2.5 border-2 border-black text-sm font-bold uppercase hover:bg-gray-100 transition-all">
              <Printer className="w-4 h-4" />พิมพ์บิล
            </button>
            <a href={`/api/bills/${bill.id}/pdf`} target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 border-2 border-black text-sm font-bold uppercase hover:bg-gray-100 transition-all">
              <Download className="w-4 h-4" />ดาวน์โหลด PDF
            </a>
            <button
              disabled={deleteBill.isPending}
              onClick={() => {
                if (window.confirm("คุณต้องการลบบิลนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้")) {
                  deleteBill.mutate({ billId: bill.id });
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 border-2 border-red-600 text-red-600 text-sm font-bold uppercase hover:bg-red-50 hover:border-red-700 transition-all mt-4 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" /> {deleteBill.isPending ? "กำลังลบ..." : "ลบใบแจ้งหนี้"}
            </button>
          </div>

          {bill.notes && (
            <div className="brut-card">
              <div className="text-xs font-mono font-bold uppercase tracking-widest mb-2">หมายเหตุ</div>
              <div className="text-sm text-muted-foreground">{asText(bill.notes)}</div>
            </div>
          )}
        </div>
      </div>

      {showPayment && <PaymentModal bill={bill} onClose={() => setShowPayment(false)} />}
      {showEdit && <EditBillModal bill={bill} onClose={() => setShowEdit(false)} />}
    </DashboardLayout>
  );
}
