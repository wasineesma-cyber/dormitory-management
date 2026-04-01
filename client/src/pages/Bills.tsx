import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Eye, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const statusLabel: Record<string, string> = {
  unpaid: "ยังไม่จ่าย", paid: "จ่ายแล้ว", partial: "จ่ายบางส่วน",
  pending_verification: "รอตรวจสอบ", overdue: "เกินกำหนด",
};

function CreateBillForm({ rooms, tenants, onClose }: { rooms: any[]; tenants: any[]; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    roomId: "",
    tenantId: "",
    billingPeriod: new Date().toISOString().slice(0, 7),
    rentAmount: "",
    waterAmount: "",
    electricityAmount: "",
    otherCharges: "0",
    discount: "0",
    penalty: "0",
    dueDate: "",
    promptPayId: "",
    notes: "",
    waterMeterBefore: "",
    waterMeterAfter: "",
    electricityMeterBefore: "",
    electricityMeterAfter: "",
  });
  type ItemType = "rent" | "water" | "electricity" | "service" | "other" | "discount" | "penalty";
  const [items, setItems] = useState<Array<{ description: string; quantity: string; unitPrice: string; amount: string; itemType: ItemType }>>([]);
  const [newItem, setNewItem] = useState<{ description: string; quantity: string; unitPrice: string; amount: string; itemType: ItemType }>({ description: "", quantity: "1", unitPrice: "", amount: "", itemType: "service" });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  // Auto-fill from room
  const selectedRoom = rooms.find(r => String(r.id) === form.roomId);
  const selectedTenant = tenants.find(t => String(t.id) === form.tenantId);

  const handleRoomChange = (roomId: string) => {
    const room = rooms.find(r => String(r.id) === roomId);
    if (room) {
      const updates: Record<string, string> = { roomId };
      if (room.type === "monthly") updates.rentAmount = String(room.pricePerMonth || "");
      else updates.rentAmount = String(room.pricePerDay || "");
      // Auto-fill water amount for flat rate rooms
      if ((room as any).waterBillingType === "flat_rate") {
        updates.waterAmount = String((room as any).waterFlatRate || "0");
      } else {
        updates.waterAmount = "";
      }
      // Auto-fill tenant
      const tenant = tenants.find(t => t.roomId === room.id && t.status === "active");
      if (tenant) updates.tenantId = String(tenant.id);
      setForm(f => ({ ...f, ...updates }));
    } else {
      set("roomId", roomId);
    }
  };

  const total = (
    parseFloat(form.rentAmount || "0") +
    parseFloat(form.waterAmount || "0") +
    parseFloat(form.electricityAmount || "0") +
    parseFloat(form.otherCharges || "0") +
    items.reduce((s, i) => s + parseFloat(i.amount || "0"), 0) -
    parseFloat(form.discount || "0") +
    parseFloat(form.penalty || "0")
  );

  const addItem = () => {
    if (!newItem.description || !newItem.unitPrice) return;
    const amount = String(parseFloat(newItem.quantity || "1") * parseFloat(newItem.unitPrice));
    setItems(prev => [...prev, { ...newItem, amount }]);
    setNewItem({ description: "", quantity: "1", unitPrice: "", amount: "", itemType: "service" });
  };

  const createBill = trpc.bills.create.useMutation({
    onSuccess: () => { utils.bills.list.invalidate(); toast.success("ออกบิลสำเร็จ"); onClose(); },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = () => {
    if (!form.roomId) return toast.error("กรุณาเลือกห้อง");
    if (!form.rentAmount) return toast.error("กรุณากรอกค่าเช่า");
    type ItemType2 = "rent" | "water" | "electricity" | "service" | "other" | "discount" | "penalty";
    const allItems: Array<{ description: string; quantity: string; unitPrice: string; amount: string; itemType: ItemType2 }> = [
      { description: "ค่าเช่า", quantity: "1", unitPrice: form.rentAmount, amount: form.rentAmount, itemType: "rent" as ItemType2 },
      ...(parseFloat(form.waterAmount) > 0 ? [{ description: "ค่าน้ำ", quantity: "1", unitPrice: form.waterAmount, amount: form.waterAmount, itemType: "water" as ItemType2 }] : []),
      ...(parseFloat(form.electricityAmount) > 0 ? [{ description: "ค่าไฟ", quantity: "1", unitPrice: form.electricityAmount, amount: form.electricityAmount, itemType: "electricity" as ItemType2 }] : []),
      ...items,
    ];
    createBill.mutate({
      roomId: parseInt(form.roomId),
      tenantId: form.tenantId ? parseInt(form.tenantId) : undefined,
      billingPeriod: form.billingPeriod,
      rentAmount: form.rentAmount,
      waterAmount: form.waterAmount || "0",
      electricityAmount: form.electricityAmount || "0",
      otherCharges: form.otherCharges || "0",
      discount: form.discount || "0",
      penalty: form.penalty || "0",
      dueDate: form.dueDate || undefined,
      promptPayId: form.promptPayId || undefined,
      notes: form.notes || undefined,
      waterMeterBefore: form.waterMeterBefore || undefined,
      waterMeterAfter: form.waterMeterAfter || undefined,
      waterUnitsUsed: form.waterMeterBefore && form.waterMeterAfter ? String(parseFloat(form.waterMeterAfter) - parseFloat(form.waterMeterBefore)) : undefined,
      electricityMeterBefore: form.electricityMeterBefore || undefined,
      electricityMeterAfter: form.electricityMeterAfter || undefined,
      electricityUnitsUsed: form.electricityMeterBefore && form.electricityMeterAfter ? String(parseFloat(form.electricityMeterAfter) - parseFloat(form.electricityMeterBefore)) : undefined,
      items: allItems,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white border-4 border-black w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ boxShadow: "8px 8px 0px rgba(0,0,0,0.5)" }}>
        <div className="flex items-center justify-between p-6 border-b-4 border-black">
          <h2 className="text-xl font-black uppercase">ออกบิล</h2>
          <button onClick={onClose}><X className="w-6 h-6" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="brut-label">ห้องพัก *</label>
              <select className="brut-input" value={form.roomId} onChange={e => handleRoomChange(e.target.value)}>
                <option value="">-- เลือกห้อง --</option>
                {rooms.map(r => <option key={r.id} value={String(r.id)}>ห้อง {r.roomNumber}{r.building ? ` (${r.building})` : ""}</option>)}
              </select>
            </div>
            <div>
              <label className="brut-label">ผู้เช่า</label>
              <select className="brut-input" value={form.tenantId} onChange={e => set("tenantId", e.target.value)}>
                <option value="">-- เลือกผู้เช่า --</option>
                {tenants.filter(t => t.status === "active").map(t => (
                  <option key={t.id} value={String(t.id)}>{t.firstName} {t.lastName}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="brut-label">รอบบิล (YYYY-MM)</label>
              <input className="brut-input font-mono" value={form.billingPeriod} onChange={e => set("billingPeriod", e.target.value)} />
            </div>
            <div>
              <label className="brut-label">วันครบกำหนด</label>
              <input className="brut-input" type="date" value={form.dueDate} onChange={e => set("dueDate", e.target.value)} />
            </div>
          </div>

          <div className="border-t-2 border-dashed border-gray-300 pt-4">
            <div className="text-xs font-mono font-bold uppercase tracking-widest mb-3">รายการค่าใช้จ่าย</div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="brut-label">ค่าเช่า *</label>
                <input className="brut-input font-mono" type="number" value={form.rentAmount} onChange={e => set("rentAmount", e.target.value)} />
              </div>
              <div>
                <label className="brut-label">
                  ค่าน้ำ
                  {selectedRoom && (selectedRoom as any).waterBillingType === "flat_rate" && (
                    <span className="ml-1 text-xs bg-black text-white px-1.5 py-0.5 font-mono">เหมาจ่าย</span>
                  )}
                </label>
                <input className="brut-input font-mono" type="number" value={form.waterAmount} onChange={e => set("waterAmount", e.target.value)}
                  readOnly={(selectedRoom as any)?.waterBillingType === "flat_rate"} />
              </div>
              <div>
                <label className="brut-label">ค่าไฟ</label>
                <input className="brut-input font-mono" type="number" value={form.electricityAmount} onChange={e => set("electricityAmount", e.target.value)} />
              </div>
            </div>

            {/* เลขมิเตอร์ก่อน-หลัง */}
            {selectedRoom && (selectedRoom as any).waterBillingType !== "flat_rate" && (
              <div className="mt-3 p-3 border-2 border-dashed border-gray-400 bg-gray-50">
                <div className="text-xs font-mono font-bold uppercase tracking-widest mb-2">เลขมิเตอร์น้ำ</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="brut-label">มิเตอร์ก่อน</label>
                    <input className="brut-input font-mono" type="number" value={form.waterMeterBefore} onChange={e => {
                      set("waterMeterBefore", e.target.value);
                      if (form.waterMeterAfter && e.target.value) {
                        const units = parseFloat(form.waterMeterAfter) - parseFloat(e.target.value);
                        const rate = parseFloat(String(selectedRoom?.waterRatePerUnit || '0'));
                        if (units >= 0) set("waterAmount", String(units * rate));
                      }
                    }} placeholder="เลขเดือนก่อน" />
                  </div>
                  <div>
                    <label className="brut-label">มิเตอร์หลัง</label>
                    <input className="brut-input font-mono" type="number" value={form.waterMeterAfter} onChange={e => {
                      set("waterMeterAfter", e.target.value);
                      if (form.waterMeterBefore && e.target.value) {
                        const units = parseFloat(e.target.value) - parseFloat(form.waterMeterBefore);
                        const rate = parseFloat(String(selectedRoom?.waterRatePerUnit || '0'));
                        if (units >= 0) set("waterAmount", String(units * rate));
                      }
                    }} placeholder="เลขเดือนนี้" />
                  </div>
                </div>
                {form.waterMeterBefore && form.waterMeterAfter && (
                  <div className="mt-1 text-xs font-mono text-gray-600">ใช้ไป {(parseFloat(form.waterMeterAfter) - parseFloat(form.waterMeterBefore)).toFixed(2)} หน่วย x หน่วยละ {selectedRoom?.waterRatePerUnit} บาท</div>
                )}
              </div>
            )}
            <div className="mt-3 p-3 border-2 border-dashed border-gray-400 bg-gray-50">
              <div className="text-xs font-mono font-bold uppercase tracking-widest mb-2">เลขมิเตอร์ไฟ</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="brut-label">มิเตอร์ก่อน</label>
                  <input className="brut-input font-mono" type="number" value={form.electricityMeterBefore} onChange={e => {
                    set("electricityMeterBefore", e.target.value);
                    if (form.electricityMeterAfter && e.target.value) {
                      const units = parseFloat(form.electricityMeterAfter) - parseFloat(e.target.value);
                      const rate = parseFloat(String(selectedRoom?.electricityRatePerUnit || '0'));
                      if (units >= 0) set("electricityAmount", String(units * rate));
                    }
                  }} placeholder="เลขเดือนก่อน" />
                </div>
                <div>
                  <label className="brut-label">มิเตอร์หลัง</label>
                  <input className="brut-input font-mono" type="number" value={form.electricityMeterAfter} onChange={e => {
                    set("electricityMeterAfter", e.target.value);
                    if (form.electricityMeterBefore && e.target.value) {
                      const units = parseFloat(e.target.value) - parseFloat(form.electricityMeterBefore);
                      const rate = parseFloat(String(selectedRoom?.electricityRatePerUnit || '0'));
                      if (units >= 0) set("electricityAmount", String(units * rate));
                    }
                  }} placeholder="เลขเดือนนี้" />
                </div>
              </div>
              {form.electricityMeterBefore && form.electricityMeterAfter && (
                <div className="mt-1 text-xs font-mono text-gray-600">ใช้ไป {(parseFloat(form.electricityMeterAfter) - parseFloat(form.electricityMeterBefore)).toFixed(2)} หน่วย x หน่วยละ {selectedRoom?.electricityRatePerUnit} บาท</div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div>
                <label className="brut-label">ค่าบริการอื่น</label>
                <input className="brut-input font-mono" type="number" value={form.otherCharges} onChange={e => set("otherCharges", e.target.value)} />
              </div>
              <div>
                <label className="brut-label">ส่วนลด</label>
                <input className="brut-input font-mono" type="number" value={form.discount} onChange={e => set("discount", e.target.value)} />
              </div>
              <div>
                <label className="brut-label">ค่าปรับ</label>
                <input className="brut-input font-mono" type="number" value={form.penalty} onChange={e => set("penalty", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Extra items */}
          <div className="border-t-2 border-dashed border-gray-300 pt-4">
            <div className="text-xs font-mono font-bold uppercase tracking-widest mb-3">รายการพิเศษ</div>
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2 mb-2 text-sm font-mono">
                <span className="flex-1">{item.description}</span>
                <span>x{item.quantity}</span>
                <span className="font-bold">฿{parseFloat(item.amount).toLocaleString()}</span>
                <button onClick={() => setItems(prev => prev.filter((_, j) => j !== i))} className="text-red-600 hover:text-red-800">✕</button>
              </div>
            ))}
            <div className="flex gap-2 mt-2">
              <input className="brut-input flex-1" placeholder="รายการ" value={newItem.description} onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))} />
              <input className="brut-input w-16 font-mono" type="number" placeholder="จำนวน" value={newItem.quantity} onChange={e => setNewItem(p => ({ ...p, quantity: e.target.value }))} />
              <input className="brut-input w-24 font-mono" type="number" placeholder="ราคา" value={newItem.unitPrice} onChange={e => setNewItem(p => ({ ...p, unitPrice: e.target.value }))} />
              <button onClick={addItem} className="px-3 border-2 border-black hover:bg-black hover:text-white transition-all font-bold">+</button>
            </div>
          </div>

          <div>
            <label className="brut-label">PromptPay ID (เบอร์/เลขบัตร)</label>
            <input className="brut-input font-mono" value={form.promptPayId} onChange={e => set("promptPayId", e.target.value)} placeholder="0812345678" />
          </div>
          <div>
            <label className="brut-label">หมายเหตุ</label>
            <textarea className="brut-input" rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} />
          </div>

          {/* Total */}
          <div className="bg-black text-white p-4 flex items-center justify-between">
            <span className="text-sm font-mono uppercase tracking-widest">ยอดรวมทั้งหมด</span>
            <span className="text-3xl font-black">฿{total.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t-4 border-black">
          <button onClick={handleSubmit} disabled={createBill.isPending} className="brut-btn flex-1">
            {createBill.isPending ? "กำลังออกบิล..." : "ออกบิล"}
          </button>
          <button onClick={onClose} className="px-6 py-2.5 border-2 border-black font-bold text-sm uppercase hover:bg-gray-100">ยกเลิก</button>
        </div>
      </div>
    </div>
  );
}

export default function Bills() {
  const [, navigate] = useLocation();
  const { data: bills = [], isLoading } = trpc.bills.list.useQuery({});
  const { data: rooms = [] } = trpc.rooms.list.useQuery();
  const { data: tenants = [] } = trpc.tenants.list.useQuery();
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = filterStatus === "all" ? bills : bills.filter(b => b.status === filterStatus);
  const roomMap = Object.fromEntries(rooms.map(r => [r.id, r]));
  const tenantMap = Object.fromEntries(tenants.map(t => [t.id, t]));

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">— จัดการ</div>
          <h1 className="text-5xl font-black uppercase tracking-tighter">บิล</h1>
          <div className="h-1 w-24 bg-black mt-3" />
        </div>
        <button onClick={() => setShowForm(true)} className="brut-btn gap-2">
          <Plus className="w-4 h-4" />ออกบิล
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { value: "all", label: "ทั้งหมด" },
          { value: "unpaid", label: "ยังไม่จ่าย" },
          { value: "paid", label: "จ่ายแล้ว" },
          { value: "partial", label: "จ่ายบางส่วน" },
          { value: "overdue", label: "เกินกำหนด" },
          { value: "pending_verification", label: "รอตรวจสอบ" },
        ].map(f => (
          <button key={f.value} onClick={() => setFilterStatus(f.value)}
            className={`px-4 py-1.5 text-xs font-bold uppercase border-2 border-black transition-all ${filterStatus === f.value ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="brut-card animate-pulse h-24" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="brut-card text-center py-16">
          <div className="text-6xl font-black text-gray-200 mb-4">฿</div>
          <div className="font-bold uppercase text-muted-foreground">ไม่พบบิล</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(bill => {
            const room = roomMap[bill.roomId];
            const tenant = bill.tenantId ? tenantMap[bill.tenantId] : null;
            return (
              <div key={bill.id} className="brut-card-hover group flex items-center gap-4 cursor-pointer" onClick={() => navigate(`/bills/${bill.id}`)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-black font-mono text-sm">{bill.billNumber}</span>
                    <span className={`badge-${bill.status}`}>{statusLabel[bill.status]}</span>
                    {bill.billingPeriod && <span className="text-xs border-2 border-black px-2 py-0.5 font-mono">{bill.billingPeriod}</span>}
                  </div>
                  <div className="flex gap-3 mt-1 flex-wrap">
                    {room && <span className="text-sm font-bold">ห้อง {room.roomNumber}</span>}
                    {tenant && <span className="text-sm text-muted-foreground">{tenant.firstName} {tenant.lastName}</span>}
                    {bill.dueDate && <span className="text-xs font-mono text-muted-foreground">ครบกำหนด: {String(bill.dueDate)}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-black">฿{Number(bill.totalAmount).toLocaleString()}</div>
                  {Number(bill.paidAmount) > 0 && (
                    <div className="text-xs font-mono text-green-700">จ่ายแล้ว ฿{Number(bill.paidAmount).toLocaleString()}</div>
                  )}
                </div>
                <button onClick={(e) => { e.stopPropagation(); navigate(`/bills/${bill.id}`); }}
                  className="p-2 border-2 border-black hover:bg-black hover:text-white transition-all opacity-0 group-hover:opacity-100 shrink-0">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showForm && <CreateBillForm rooms={rooms} tenants={tenants} onClose={() => setShowForm(false)} />}
    </DashboardLayout>
  );
}
