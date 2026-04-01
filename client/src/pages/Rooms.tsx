import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Edit2, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type RoomStatus = "vacant" | "occupied" | "reserved" | "maintenance";
type RoomType = "daily" | "monthly";
type WaterBillingType = "per_unit" | "flat_rate";

const statusLabel: Record<RoomStatus, string> = {
  vacant: "ว่าง", occupied: "ไม่ว่าง", reserved: "จอง", maintenance: "ซ่อม",
};
const typeLabel: Record<RoomType, string> = { daily: "รายวัน", monthly: "รายเดือน" };
const waterBillingLabel: Record<WaterBillingType, string> = { per_unit: "ตามมิเตอร์", flat_rate: "เหมาจ่าย" };

function RoomForm({ initial, onSubmit, onClose, loading }: {
  initial?: any; onSubmit: (data: any) => void; onClose: () => void; loading?: boolean;
}) {
  const [form, setForm] = useState({
    roomNumber: initial?.roomNumber ?? "",
    floor: initial?.floor ?? "",
    building: initial?.building ?? "",
    type: initial?.type ?? "monthly",
    status: initial?.status ?? "vacant",
    pricePerMonth: initial?.pricePerMonth ?? "",
    pricePerDay: initial?.pricePerDay ?? "",
    waterBillingType: initial?.waterBillingType ?? "per_unit",
    waterRatePerUnit: initial?.waterRatePerUnit ?? "18",
    waterFlatRate: initial?.waterFlatRate ?? "0",
    electricityRatePerUnit: initial?.electricityRatePerUnit ?? "8",
    depositAmount: initial?.depositAmount ?? "",
    description: initial?.description ?? "",
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white border-4 border-black w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ boxShadow: "8px 8px 0px rgba(0,0,0,0.5)" }}>
        <div className="flex items-center justify-between p-6 border-b-4 border-black">
          <h2 className="text-xl font-black uppercase">{initial ? "แก้ไขห้อง" : "เพิ่มห้องพัก"}</h2>
          <button onClick={onClose}><X className="w-6 h-6" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="brut-label">เลขห้อง *</label>
              <input className="brut-input" value={form.roomNumber} onChange={e => set("roomNumber", e.target.value)} placeholder="101" />
            </div>
            <div>
              <label className="brut-label">ชั้น</label>
              <input className="brut-input" value={form.floor} onChange={e => set("floor", e.target.value)} placeholder="1" />
            </div>
          </div>
          <div>
            <label className="brut-label">อาคาร</label>
            <input className="brut-input" value={form.building} onChange={e => set("building", e.target.value)} placeholder="อาคาร A" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="brut-label">ประเภทห้อง</label>
              <select className="brut-input" value={form.type} onChange={e => set("type", e.target.value)}>
                <option value="monthly">รายเดือน</option>
                <option value="daily">รายวัน</option>
              </select>
            </div>
            <div>
              <label className="brut-label">สถานะ</label>
              <select className="brut-input" value={form.status} onChange={e => set("status", e.target.value)}>
                <option value="vacant">ว่าง</option>
                <option value="occupied">ไม่ว่าง</option>
                <option value="reserved">จอง</option>
                <option value="maintenance">ซ่อม</option>
              </select>
            </div>
          </div>
          {form.type === "monthly" ? (
            <div>
              <label className="brut-label">ราคาต่อเดือน (บาท)</label>
              <input className="brut-input" type="number" value={form.pricePerMonth} onChange={e => set("pricePerMonth", e.target.value)} placeholder="3000" />
            </div>
          ) : (
            <div>
              <label className="brut-label">ราคาต่อคืน (บาท)</label>
              <input className="brut-input" type="number" value={form.pricePerDay} onChange={e => set("pricePerDay", e.target.value)} placeholder="500" />
            </div>
          )}

          {/* Water billing section */}
          <div className="border-2 border-black p-4 space-y-3">
            <div className="text-xs font-black uppercase tracking-widest border-l-4 border-black pl-3">ค่าน้ำ</div>
            <div>
              <label className="brut-label">รูปแบบคิดค่าน้ำ</label>
              <select className="brut-input" value={form.waterBillingType} onChange={e => set("waterBillingType", e.target.value)}>
                <option value="per_unit">ตามมิเตอร์ (ต่อหน่วย)</option>
                <option value="flat_rate">เหมาจ่าย (คงที่ต่อเดือน)</option>
              </select>
            </div>
            {form.waterBillingType === "per_unit" ? (
              <div>
                <label className="brut-label">ค่าน้ำต่อหน่วย (บาท)</label>
                <input className="brut-input" type="number" value={form.waterRatePerUnit} onChange={e => set("waterRatePerUnit", e.target.value)} placeholder="18" />
              </div>
            ) : (
              <div>
                <label className="brut-label">ค่าน้ำเหมาจ่าย (บาท/เดือน)</label>
                <input className="brut-input" type="number" value={form.waterFlatRate} onChange={e => set("waterFlatRate", e.target.value)} placeholder="200" />
                <div className="text-xs font-mono text-muted-foreground mt-1">จำนวนเงินคงที่ที่เรียกเก็บทุกเดือน ไม่ต้องอ่านมิเตอร์น้ำ</div>
              </div>
            )}
          </div>

          <div>
            <label className="brut-label">ค่าไฟต่อหน่วย (บาท)</label>
            <input className="brut-input" type="number" value={form.electricityRatePerUnit} onChange={e => set("electricityRatePerUnit", e.target.value)} />
          </div>
          <div>
            <label className="brut-label">เงินประกัน (บาท)</label>
            <input className="brut-input" type="number" value={form.depositAmount} onChange={e => set("depositAmount", e.target.value)} placeholder="6000" />
          </div>
          <div>
            <label className="brut-label">หมายเหตุ</label>
            <textarea className="brut-input" rows={2} value={form.description} onChange={e => set("description", e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t-4 border-black">
          <button onClick={() => onSubmit(form)} disabled={loading || !form.roomNumber} className="brut-btn flex-1">
            {loading ? "กำลังบันทึก..." : "บันทึก"}
          </button>
          <button onClick={onClose} className="px-6 py-2.5 border-2 border-black font-bold text-sm uppercase hover:bg-gray-100">ยกเลิก</button>
        </div>
      </div>
    </div>
  );
}

export default function Rooms() {
  const utils = trpc.useUtils();
  const { data: rooms = [], isLoading } = trpc.rooms.list.useQuery();
  const createRoom = trpc.rooms.create.useMutation({ onSuccess: () => { utils.rooms.list.invalidate(); toast.success("เพิ่มห้องสำเร็จ"); setShowForm(false); }, onError: (err) => { toast.error("เพิ่มห้องไม่สำเร็จ: " + err.message); } });
  const updateRoom = trpc.rooms.update.useMutation({ onSuccess: () => { utils.rooms.list.invalidate(); toast.success("แก้ไขห้องสำเร็จ"); setEditRoom(null); }, onError: (err) => { toast.error("แก้ไขห้องไม่สำเร็จ: " + err.message); } });
  const deleteRoom = trpc.rooms.delete.useMutation({ onSuccess: () => { utils.rooms.list.invalidate(); toast.success("ลบห้องสำเร็จ"); } });

  const [showForm, setShowForm] = useState(false);
  const [editRoom, setEditRoom] = useState<any>(null);
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all" ? rooms : rooms.filter(r => r.status === filter || r.type === filter);

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">— จัดการ</div>
          <h1 className="text-5xl font-black uppercase tracking-tighter">ห้องพัก</h1>
          <div className="h-1 w-24 bg-black mt-3" />
        </div>
        <button onClick={() => setShowForm(true)} className="brut-btn gap-2">
          <Plus className="w-4 h-4" />เพิ่มห้อง
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { value: "all", label: "ทั้งหมด" },
          { value: "vacant", label: "ว่าง" },
          { value: "occupied", label: "ไม่ว่าง" },
          { value: "monthly", label: "รายเดือน" },
          { value: "daily", label: "รายวัน" },
          { value: "maintenance", label: "ซ่อม" },
        ].map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 text-xs font-bold uppercase border-2 border-black transition-all ${filter === f.value ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="brut-card animate-pulse h-40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="brut-card text-center py-16">
          <div className="text-6xl font-black text-gray-200 mb-4">0</div>
          <div className="font-bold uppercase text-muted-foreground">ไม่พบห้องพัก</div>
          <button onClick={() => setShowForm(true)} className="brut-btn mt-4">เพิ่มห้องแรก</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(room => (
            <div key={room.id} className="brut-card-hover group">
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl font-black">{room.roomNumber}</div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditRoom(room)} className="p-1.5 border-2 border-black hover:bg-black hover:text-white transition-all">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => { if (confirm("ลบห้องนี้?")) deleteRoom.mutate({ id: room.id }); }}
                    className="p-1.5 border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {room.building && <div className="text-xs font-mono text-muted-foreground mb-2">{room.building}{room.floor ? ` · ชั้น ${room.floor}` : ""}</div>}
              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className={`badge-${room.status}`}>{statusLabel[room.status as RoomStatus]}</span>
                <span className={`badge-${room.type}`}>{typeLabel[room.type as RoomType]}</span>
              </div>
              <div className="text-sm font-bold">
                {room.type === "monthly"
                  ? `฿${Number(room.pricePerMonth || 0).toLocaleString()}/เดือน`
                  : `฿${Number(room.pricePerDay || 0).toLocaleString()}/คืน`}
              </div>
              <div className="text-xs font-mono text-muted-foreground mt-1">
                {(room as any).waterBillingType === "flat_rate"
                  ? `น้ำ ฿${Number((room as any).waterFlatRate || 0).toLocaleString()} เหมาจ่าย`
                  : `น้ำ ฿${room.waterRatePerUnit}/หน่วย`}
                {" · "}ไฟ ฿{room.electricityRatePerUnit}/หน่วย
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <RoomForm
          onSubmit={(data) => createRoom.mutate(data)}
          onClose={() => setShowForm(false)}
          loading={createRoom.isPending}
        />
      )}
      {editRoom && (
        <RoomForm
          initial={editRoom}
          onSubmit={(data) => updateRoom.mutate({ id: editRoom.id, ...data })}
          onClose={() => setEditRoom(null)}
          loading={updateRoom.isPending}
        />
      )}
    </DashboardLayout>
  );
}
