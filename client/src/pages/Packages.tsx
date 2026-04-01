import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Edit2, Package, Plus, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

function PackageForm({ initial, tenants, rooms, onSubmit, onClose, loading }: {
  initial?: any;
  tenants: any[];
  rooms: any[];
  onSubmit: (data: any) => void;
  onClose: () => void;
  loading?: boolean;
}) {
  const [form, setForm] = useState({
    tenantId: initial?.tenantId ? String(initial.tenantId) : "",
    roomId: initial?.roomId ? String(initial.roomId) : "",
    carrier: initial?.carrier ?? "",
    trackingNumber: initial?.trackingNumber ?? "",
    itemName: initial?.itemName ?? "",
    recipientName: initial?.recipientName ?? "",
    status: initial?.status ?? "arrived",
    arrivedAt: initial?.arrivedAt ? String(initial.arrivedAt).split("T")[0] : new Date().toISOString().split("T")[0],
    pickedUpAt: initial?.pickedUpAt ? String(initial.pickedUpAt).split("T")[0] : "",
    notes: initial?.notes ?? "",
  });

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white border-4 border-black w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ boxShadow: "8px 8px 0px rgba(0,0,0,0.5)" }}>
        <div className="flex items-center justify-between p-6 border-b-4 border-black">
          <h2 className="text-xl font-black uppercase">{initial ? "แก้ไขพัสดุ" : "เพิ่มพัสดุ"}</h2>
          <button onClick={onClose}><X className="w-6 h-6" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="brut-label">สิ่งของ / พัสดุ *</label>
              <input className="brut-input" value={form.itemName} onChange={(e) => set("itemName", e.target.value)} />
            </div>
            <div>
              <label className="brut-label">ชื่อผู้รับ</label>
              <input className="brut-input" value={form.recipientName} onChange={(e) => set("recipientName", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="brut-label">ลูกหอ</label>
              <select className="brut-input" value={form.tenantId} onChange={(e) => set("tenantId", e.target.value)}>
                <option value="">-- เลือกลูกหอ --</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={String(tenant.id)}>
                    {tenant.firstName} {tenant.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="brut-label">ห้องพัก</label>
              <select className="brut-input" value={form.roomId} onChange={(e) => set("roomId", e.target.value)}>
                <option value="">-- เลือกห้อง --</option>
                {rooms.map((room) => (
                  <option key={room.id} value={String(room.id)}>
                    ห้อง {room.roomNumber}{room.building ? ` (${room.building})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="brut-label">ขนส่ง</label>
              <input className="brut-input" value={form.carrier} onChange={(e) => set("carrier", e.target.value)} placeholder="เช่น Flash, Kerry, ไปรษณีย์ไทย" />
            </div>
            <div>
              <label className="brut-label">เลขพัสดุ</label>
              <input className="brut-input font-mono" value={form.trackingNumber} onChange={(e) => set("trackingNumber", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="brut-label">สถานะ</label>
              <select className="brut-input" value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="arrived">มาถึงแล้ว</option>
                <option value="picked_up">รับแล้ว</option>
              </select>
            </div>
            <div>
              <label className="brut-label">วันที่มาถึง</label>
              <input className="brut-input" type="date" value={form.arrivedAt} onChange={(e) => set("arrivedAt", e.target.value)} />
            </div>
            <div>
              <label className="brut-label">วันที่รับของ</label>
              <input className="brut-input" type="date" value={form.pickedUpAt} onChange={(e) => set("pickedUpAt", e.target.value)} disabled={form.status !== "picked_up"} />
            </div>
          </div>

          <div>
            <label className="brut-label">หมายเหตุ</label>
            <textarea className="brut-input" rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t-4 border-black">
          <button
            onClick={() => onSubmit({
              ...form,
              tenantId: form.tenantId ? parseInt(form.tenantId) : undefined,
              roomId: form.roomId ? parseInt(form.roomId) : undefined,
              pickedUpAt: form.status === "picked_up" ? form.pickedUpAt || undefined : undefined,
            })}
            disabled={loading || !form.itemName}
            className="brut-btn flex-1"
          >
            {loading ? "กำลังบันทึก..." : "บันทึก"}
          </button>
          <button onClick={onClose} className="px-6 py-2.5 border-2 border-black font-bold text-sm uppercase hover:bg-gray-100">ยกเลิก</button>
        </div>
      </div>
    </div>
  );
}

export default function Packages() {
  const utils = trpc.useUtils();
  const { data: packages = [], isLoading } = trpc.packages.list.useQuery();
  const { data: tenants = [] } = trpc.tenants.list.useQuery();
  const { data: rooms = [] } = trpc.rooms.list.useQuery();

  const createPackage = trpc.packages.create.useMutation({
    onSuccess: () => {
      utils.packages.list.invalidate();
      toast.success("เพิ่มพัสดุสำเร็จ");
      setShowForm(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const updatePackage = trpc.packages.update.useMutation({
    onSuccess: () => {
      utils.packages.list.invalidate();
      toast.success("แก้ไขพัสดุสำเร็จ");
      setEditingPackage(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const deletePackage = trpc.packages.delete.useMutation({
    onSuccess: () => {
      utils.packages.list.invalidate();
      toast.success("ลบพัสดุสำเร็จ");
    },
    onError: (err) => toast.error(err.message),
  });

  const [showForm, setShowForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);

  const tenantMap = useMemo(() => Object.fromEntries(tenants.map((tenant) => [tenant.id, tenant])), [tenants]);
  const roomMap = useMemo(() => Object.fromEntries(rooms.map((room) => [room.id, room])), [rooms]);

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">— จัดการ</div>
          <h1 className="text-5xl font-black uppercase tracking-tighter">พัสดุ</h1>
          <div className="h-1 w-24 bg-black mt-3" />
        </div>
        <button onClick={() => setShowForm(true)} className="brut-btn gap-2">
          <Plus className="w-4 h-4" />เพิ่มพัสดุ
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="brut-card animate-pulse h-24" />)}</div>
      ) : packages.length === 0 ? (
        <div className="brut-card text-center py-16">
          <Package className="w-14 h-14 mx-auto text-gray-300 mb-4" />
          <div className="font-bold text-muted-foreground">ยังไม่มีพัสดุในระบบ</div>
          <button onClick={() => setShowForm(true)} className="brut-btn mt-4">เพิ่มพัสดุแรก</button>
        </div>
      ) : (
        <div className="space-y-3">
          {packages.map((parcel) => {
            const tenant = parcel.tenantId ? tenantMap[parcel.tenantId] : null;
            const room = parcel.roomId ? roomMap[parcel.roomId] : null;
            return (
              <div key={parcel.id} className="brut-card-hover group flex items-center gap-4">
                <div className={`w-12 h-12 border-2 border-black flex items-center justify-center shrink-0 ${parcel.status === "picked_up" ? "bg-green-600 text-white" : "bg-black text-white"}`}>
                  <Package className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="font-black text-lg">{parcel.itemName}</div>
                    <span className={`text-xs font-bold px-2 py-0.5 border-2 ${parcel.status === "picked_up" ? "border-green-700 text-green-700" : "border-black text-black"}`}>
                      {parcel.status === "picked_up" ? "รับแล้ว" : "มาถึงแล้ว"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
                    {tenant && <span>{tenant.firstName} {tenant.lastName}</span>}
                    {room && <span>ห้อง {room.roomNumber}</span>}
                    {parcel.carrier && <span>ขนส่ง: {parcel.carrier}</span>}
                    {parcel.trackingNumber && <span className="font-mono">#{parcel.trackingNumber}</span>}
                  </div>
                  <div className="text-xs font-mono text-muted-foreground mt-1">
                    มาถึง: {parcel.arrivedAt ? String(parcel.arrivedAt).split("T")[0] : "-"}
                    {parcel.pickedUpAt ? ` • รับของ: ${String(parcel.pickedUpAt).split("T")[0]}` : ""}
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => setEditingPackage(parcel)} className="p-2 border-2 border-black hover:bg-black hover:text-white transition-all">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => { if (confirm("ลบพัสดุชิ้นนี้?")) deletePackage.mutate({ id: parcel.id }); }} className="p-2 border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <PackageForm
          tenants={tenants}
          rooms={rooms}
          onSubmit={(data) => createPackage.mutate(data)}
          onClose={() => setShowForm(false)}
          loading={createPackage.isPending}
        />
      )}
      {editingPackage && (
        <PackageForm
          initial={editingPackage}
          tenants={tenants}
          rooms={rooms}
          onSubmit={(data) => updatePackage.mutate({ id: editingPackage.id, ...data })}
          onClose={() => setEditingPackage(null)}
          loading={updatePackage.isPending}
        />
      )}
    </DashboardLayout>
  );
}
