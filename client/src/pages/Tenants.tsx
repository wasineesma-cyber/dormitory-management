import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Edit2, Phone, Plus, Trash2, User, X, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function TenantForm({ initial, rooms, accounts, onSubmit, onClose, loading }: {
  initial?: any; rooms: any[]; accounts: any[]; onSubmit: (data: any) => void; onClose: () => void; loading?: boolean;
}) {
  const [form, setForm] = useState({
    userId: initial?.userId ? String(initial.userId) : "",
    firstName: initial?.firstName ?? "",
    lastName: initial?.lastName ?? "",
    phone: initial?.phone ?? "",
    email: initial?.email ?? "",
    idCardNumber: initial?.idCardNumber ?? "",
    passportNumber: initial?.passportNumber ?? "",
    roomId: initial?.roomId ? String(initial.roomId) : "",
    contractStartDate: initial?.contractStartDate ?? "",
    contractEndDate: initial?.contractEndDate ?? "",
    checkInDate: initial?.checkInDate ?? "",
    checkOutDate: initial?.checkOutDate ?? "",
    depositPaid: initial?.depositPaid ?? "",
    depositStatus: initial?.depositStatus ?? "pending",
    status: initial?.status ?? "active",
    notes: initial?.notes ?? "",
    emergencyContact: initial?.emergencyContact ?? "",
    emergencyPhone: initial?.emergencyPhone ?? "",
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white border-4 border-black w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ boxShadow: "8px 8px 0px rgba(0,0,0,0.5)" }}>
        <div className="flex items-center justify-between p-6 border-b-4 border-black">
          <h2 className="text-xl font-black uppercase">{initial ? "แก้ไขผู้เช่า" : "เพิ่มผู้เช่า"}</h2>
          <button onClick={onClose}><X className="w-6 h-6" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="text-xs font-mono font-bold uppercase tracking-widest border-l-4 border-black pl-3 mb-2">ข้อมูลส่วนตัว</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="brut-label">ชื่อ *</label>
              <input className="brut-input" value={form.firstName} onChange={e => set("firstName", e.target.value)} />
            </div>
            <div>
              <label className="brut-label">นามสกุล *</label>
              <input className="brut-input" value={form.lastName} onChange={e => set("lastName", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="brut-label">บัญชีลูกหอ</label>
              <select className="brut-input" value={form.userId} onChange={e => set("userId", e.target.value)}>
                <option value="">-- ไม่ผูกบัญชี --</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={String(acc.id)}>{acc.name || acc.email || `user-${acc.id}`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="brut-label">เบอร์โทร</label>
              <input className="brut-input" value={form.phone} onChange={e => set("phone", e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="brut-label">อีเมล</label>
              <input className="brut-input" type="email" value={form.email} onChange={e => set("email", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="brut-label">เลขบัตรประชาชน</label>
              <input className="brut-input" value={form.idCardNumber} onChange={e => set("idCardNumber", e.target.value)} />
            </div>
            <div>
              <label className="brut-label">เลขพาสปอร์ต</label>
              <input className="brut-input" value={form.passportNumber} onChange={e => set("passportNumber", e.target.value)} />
            </div>
          </div>

          <div className="text-xs font-mono font-bold uppercase tracking-widest border-l-4 border-black pl-3 mt-4 mb-2">ข้อมูลห้องและสัญญา</div>
          <div>
            <label className="brut-label">ห้องพัก</label>
            <select className="brut-input" value={form.roomId} onChange={e => set("roomId", e.target.value)}>
              <option value="">-- เลือกห้อง --</option>
              {rooms.map(r => (
                <option key={r.id} value={String(r.id)}>
                  ห้อง {r.roomNumber}{r.building ? ` (${r.building})` : ""} — {r.status === 'vacant' ? 'ว่าง' : 'ไม่ว่าง'}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="brut-label">วันเริ่มสัญญา</label>
              <input className="brut-input" type="date" value={form.contractStartDate} onChange={e => set("contractStartDate", e.target.value)} />
            </div>
            <div>
              <label className="brut-label">วันสิ้นสุดสัญญา</label>
              <input className="brut-input" type="date" value={form.contractEndDate} onChange={e => set("contractEndDate", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="brut-label">วันเข้าพัก</label>
              <input className="brut-input" type="date" value={form.checkInDate} onChange={e => set("checkInDate", e.target.value)} />
            </div>
            <div>
              <label className="brut-label">วันออก</label>
              <input className="brut-input" type="date" value={form.checkOutDate} onChange={e => set("checkOutDate", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="brut-label">เงินประกัน (บาท)</label>
              <input className="brut-input" type="number" value={form.depositPaid} onChange={e => set("depositPaid", e.target.value)} />
            </div>
            <div>
              <label className="brut-label">สถานะเงินประกัน</label>
              <select className="brut-input" value={form.depositStatus} onChange={e => set("depositStatus", e.target.value)}>
                <option value="pending">รอชำระ</option>
                <option value="paid">ชำระแล้ว</option>
                <option value="refunded">คืนแล้ว</option>
              </select>
            </div>
          </div>
          {initial && (
            <div>
              <label className="brut-label">สถานะผู้เช่า</label>
              <select className="brut-input" value={form.status} onChange={e => set("status", e.target.value)}>
                <option value="active">อยู่อาศัย</option>
                <option value="inactive">ไม่ใช้งาน</option>
                <option value="checked_out">ออกแล้ว</option>
              </select>
            </div>
          )}

          <div className="text-xs font-mono font-bold uppercase tracking-widest border-l-4 border-black pl-3 mt-4 mb-2">ผู้ติดต่อฉุกเฉิน</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="brut-label">ชื่อ</label>
              <input className="brut-input" value={form.emergencyContact} onChange={e => set("emergencyContact", e.target.value)} />
            </div>
            <div>
              <label className="brut-label">เบอร์โทร</label>
              <input className="brut-input" value={form.emergencyPhone} onChange={e => set("emergencyPhone", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="brut-label">หมายเหตุ</label>
            <textarea className="brut-input" rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t-4 border-black">
          <button onClick={() => onSubmit({ ...form, userId: form.userId ? parseInt(form.userId) : undefined, roomId: form.roomId ? parseInt(form.roomId) : undefined })}
            disabled={loading || !form.firstName || !form.lastName} className="brut-btn flex-1">
            {loading ? "กำลังบันทึก..." : "บันทึก"}
          </button>
          <button onClick={onClose} className="px-6 py-2.5 border-2 border-black font-bold text-sm uppercase hover:bg-gray-100">ยกเลิก</button>
        </div>
      </div>
    </div>
  );
}

function CreateContractModal({ tenant, onClose }: { tenant: any, onClose: () => void }) {
  const [terms, setTerms] = useState(`สัญญาเช่าห้องพักสำหรับผู้เช่า: ${tenant.firstName} ${tenant.lastName}\nสัญญานี้ทำขึ้นเพื่อตกลงเงื่อนไขการเช่าห้องพัก...\n\n1. ผู้เช่าตกลงชำระค่าเช่าตรงตามเวลาที่กำหนดในแต่ละรอบบิล\n2. ผู้เช่าต้องรักษากฎระเบียบความสงบเรียบร้อยของหอพัก\n3. เงินประกันจะถูกยึดหากผู้เช่าออกก่อนกำหนดสัญญา\n\nลงชื่อผู้เช่า ..........................................`);
  const create = trpc.contracts.create.useMutation({
    onSuccess: () => { toast.success("ร่างสัญญาสำเร็จ ให้ผู้เช่าเข้าสู่ระบบเพื่อเซ็นได้เลย"); onClose(); },
    onError: (e) => toast.error(e.message)
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white border-4 border-black w-full max-w-2xl max-h-[90vh] flex flex-col" style={{ boxShadow: "8px 8px 0px rgba(0,0,0,0.5)" }}>
        <div className="flex items-center justify-between p-6 border-b-4 border-black">
          <h2 className="text-xl font-black uppercase tracking-tighter">สร้างร่างสัญญาใหม่</h2>
          <button onClick={onClose}><X className="w-6 h-6" /></button>
        </div>
        <div className="p-6 flex-1 overflow-y-auto">
          <label className="brut-label block mb-2">รายละเอียดสัญญา</label>
          <textarea
            className="brut-input font-mono w-full min-h-[300px]"
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
          />
        </div>
        <div className="flex gap-3 p-6 border-t-4 border-black">
          <button onClick={() => create.mutate({ tenantId: tenant.id, roomId: tenant.roomId || 0, termsData: terms })} disabled={create.isPending || !tenant.roomId} className="brut-btn flex-1">
            {create.isPending ? "กำลังบันทึก..." : "ส่งให้ลูกบ้านลูกบ้านเซ็นผ่านระบบ"}
          </button>
          <button onClick={onClose} className="px-6 py-2.5 border-2 border-black font-bold text-sm uppercase hover:bg-gray-100">ยกเลิก</button>
        </div>
      </div>
    </div>
  );
}

export default function Tenants() {
  const utils = trpc.useUtils();
  const { data: tenants = [], isLoading } = trpc.tenants.list.useQuery();
  const { data: rooms = [] } = trpc.rooms.list.useQuery();
  const { data: accounts = [] } = trpc.userManagement.list.useQuery();
  const createTenant = trpc.tenants.create.useMutation({ onSuccess: () => { utils.tenants.list.invalidate(); utils.rooms.list.invalidate(); toast.success("เพิ่มผู้เช่าสำเร็จ"); setShowForm(false); }, onError: (err) => toast.error(`เพิ่มผู้เช่าไม่สำเร็จ: ${err.message}`) });
  const updateTenant = trpc.tenants.update.useMutation({ onSuccess: () => { utils.tenants.list.invalidate(); toast.success("แก้ไขสำเร็จ"); setEditTenant(null); }, onError: (err) => toast.error(`แก้ไขไม่สำเร็จ: ${err.message}`) });
  const deleteTenant = trpc.tenants.delete.useMutation({ onSuccess: () => { utils.tenants.list.invalidate(); utils.rooms.list.invalidate(); toast.success("ลบสำเร็จ"); } });

  const [showForm, setShowForm] = useState(false);
  const [editTenant, setEditTenant] = useState<any>(null);
  const [contractTenant, setContractTenant] = useState<any>(null);

  const roomMap = Object.fromEntries(rooms.map(r => [r.id, r]));

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">— จัดการ</div>
          <h1 className="text-5xl font-black uppercase tracking-tighter">ผู้เช่า</h1>
          <div className="h-1 w-24 bg-black mt-3" />
        </div>
        <button onClick={() => setShowForm(true)} className="brut-btn gap-2">
          <Plus className="w-4 h-4" />เพิ่มผู้เช่า
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="brut-card animate-pulse h-24" />)}
        </div>
      ) : tenants.length === 0 ? (
        <div className="brut-card text-center py-16">
          <div className="text-6xl font-black text-gray-200 mb-4">0</div>
          <div className="font-bold uppercase text-muted-foreground">ไม่พบผู้เช่า</div>
          <button onClick={() => setShowForm(true)} className="brut-btn mt-4">เพิ่มผู้เช่าแรก</button>
        </div>
      ) : (
        <div className="space-y-3">
          {tenants.map(tenant => {
            const room = tenant.roomId ? roomMap[tenant.roomId] : null;
            return (
              <div key={tenant.id} className="brut-card-hover group flex items-center gap-4">
                <div className="w-12 h-12 border-2 border-black flex items-center justify-center shrink-0 bg-black text-white">
                  <User className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-lg">{tenant.firstName} {tenant.lastName}</div>
                  <div className="flex flex-wrap gap-3 mt-1">
                    {tenant.phone && <span className="flex items-center gap-1 text-xs font-mono text-muted-foreground"><Phone className="w-3 h-3" />{tenant.phone}</span>}
                    {room && <span className="text-xs font-bold border-2 border-black px-2 py-0.5">ห้อง {room.roomNumber}</span>}
                    <span className={`badge-${tenant.status === 'active' ? 'occupied' : tenant.status === 'checked_out' ? 'maintenance' : 'reserved'}`}>
                      {tenant.status === 'active' ? 'อยู่อาศัย' : tenant.status === 'checked_out' ? 'ออกแล้ว' : 'ไม่ใช้งาน'}
                    </span>
                  </div>
                  {tenant.contractStartDate && (
                    <div className="text-xs font-mono text-muted-foreground mt-1">
                      สัญญา: {String(tenant.contractStartDate)} {tenant.contractEndDate ? `→ ${String(tenant.contractEndDate)}` : ""}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => setContractTenant(tenant)} title="สร้างสัญญาให้ผู้เช่า" className="p-2 border-2 border-black hover:bg-black hover:text-[#d7b56d] transition-all">
                    <FileText className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditTenant(tenant)} title="แก้ไขข้อมูล" className="p-2 border-2 border-black hover:bg-black hover:text-white transition-all">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => { if (window.confirm("ลบผู้เช่านี้?")) deleteTenant.mutate({ id: tenant.id }); }}
                    className="p-2 border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <TenantForm rooms={rooms} accounts={accounts.filter((u: any) => u.role === "user")} onSubmit={(data) => createTenant.mutate(data)} onClose={() => setShowForm(false)} loading={createTenant.isPending} />
      )}
      {editTenant && (
        <TenantForm initial={editTenant} rooms={rooms} accounts={accounts.filter((u: any) => u.role === "user")} onSubmit={(data) => updateTenant.mutate({ id: editTenant.id, ...data })}
          onClose={() => setEditTenant(null)} loading={updateTenant.isPending} />
      )}
      {contractTenant && <CreateContractModal tenant={contractTenant} onClose={() => setContractTenant(null)} />}
    </DashboardLayout>
  );
}
