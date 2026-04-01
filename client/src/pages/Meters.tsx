import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Camera, Droplets, Zap, Plus, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

function MeterForm({ rooms, onClose }: { rooms: any[]; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    roomId: "",
    type: "electricity" as "water" | "electricity",
    previousReading: "",
    currentReading: "",
    readingDate: new Date().toISOString().split("T")[0],
    billingPeriod: new Date().toISOString().slice(0, 7),
    notes: "",
    imageUrl: "",
    ocrRawValue: "",
  });
  const [ocrLoading, setOcrLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: latestReading } = trpc.meters.latest.useQuery(
    { roomId: parseInt(form.roomId), type: form.type },
    { enabled: !!form.roomId }
  );

  const ocrMutation = trpc.meters.ocr.useMutation();
  const recordMutation = trpc.meters.record.useMutation({
    onSuccess: () => {
      utils.meters.list.invalidate();
      toast.success("บันทึกมิเตอร์สำเร็จ");
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const dataUrl = ev.target?.result as string;
        // Upload to S3 via server
        const formData = new FormData();
        formData.append("file", file);
        // Use base64 for OCR directly
        set("imageUrl", dataUrl);
        setOcrLoading(true);
        setUploadLoading(false);
        try {
          const result = await ocrMutation.mutateAsync({ imageUrl: dataUrl });
          if (result.value) {
            set("currentReading", result.value);
            set("ocrRawValue", result.value);
            toast.success(`OCR อ่านได้: ${result.value}`);
          } else {
            toast.warning("OCR ไม่สามารถอ่านตัวเลขได้ กรุณากรอกเอง");
          }
        } catch {
          toast.error("OCR ล้มเหลว กรุณากรอกเอง");
        } finally {
          setOcrLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadLoading(false);
      toast.error("อัปโหลดรูปล้มเหลว");
    }
  };

  const handleSubmit = () => {
    if (!form.roomId) return toast.error("กรุณาเลือกห้อง");
    if (!form.currentReading) return toast.error("กรุณากรอกเลขมิเตอร์ปัจจุบัน");
    const prev = parseFloat(form.previousReading || "0");
    const curr = parseFloat(form.currentReading);
    if (curr < prev) return toast.error("เลขมิเตอร์ใหม่ต้องไม่ต่ำกว่าเลขเดิม");
    recordMutation.mutate({
      roomId: parseInt(form.roomId),
      type: form.type,
      previousReading: form.previousReading || "0",
      currentReading: form.currentReading,
      readingDate: form.readingDate,
      billingPeriod: form.billingPeriod,
      notes: form.notes,
      imageUrl: form.imageUrl || undefined,
      ocrRawValue: form.ocrRawValue || undefined,
    });
  };

  const units = parseFloat(form.currentReading || "0") - parseFloat(form.previousReading || "0");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white border-4 border-black w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ boxShadow: "8px 8px 0px rgba(0,0,0,0.5)" }}>
        <div className="flex items-center justify-between p-6 border-b-4 border-black">
          <h2 className="text-xl font-black uppercase">บันทึกมิเตอร์</h2>
          <button onClick={onClose}><X className="w-6 h-6" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="brut-label">ห้องพัก *</label>
            <select className="brut-input" value={form.roomId} onChange={e => set("roomId", e.target.value)}>
              <option value="">-- เลือกห้อง --</option>
              {rooms.map(r => <option key={r.id} value={String(r.id)}>ห้อง {r.roomNumber}{r.building ? ` (${r.building})` : ""}</option>)}
            </select>
          </div>
          <div>
            <label className="brut-label">ประเภทมิเตอร์</label>
            <div className="flex gap-3">
              {(["electricity", "water"] as const).map(t => (
                <button key={t} onClick={() => set("type", t)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 border-2 font-bold text-sm uppercase transition-all ${form.type === t ? "bg-black text-white border-black" : "border-black hover:bg-gray-100"}`}>
                  {t === "electricity" ? <Zap className="w-4 h-4" /> : <Droplets className="w-4 h-4" />}
                  {t === "electricity" ? "ไฟฟ้า" : "น้ำประปา"}
                </button>
              ))}
            </div>
          </div>
          {latestReading && (
            <div className="bg-gray-50 border-2 border-gray-300 p-3">
              <div className="text-xs font-mono text-muted-foreground">เลขครั้งล่าสุด ({String(latestReading.readingDate)})</div>
              <div className="text-2xl font-black">{String(latestReading.currentReading)}</div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="brut-label">เลขครั้งก่อน</label>
              <input className="brut-input font-mono" type="number" value={form.previousReading}
                onChange={e => set("previousReading", e.target.value)}
                placeholder={latestReading ? String(latestReading.currentReading) : "0"} />
            </div>
            <div>
              <label className="brut-label">เลขปัจจุบัน *</label>
              <input className="brut-input font-mono" type="number" value={form.currentReading} onChange={e => set("currentReading", e.target.value)} />
            </div>
          </div>
          {units > 0 && (
            <div className="bg-black text-white p-3 flex items-center justify-between">
              <span className="text-xs font-mono uppercase">หน่วยที่ใช้</span>
              <span className="text-2xl font-black">{units.toFixed(2)} หน่วย</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="brut-label">วันที่จด</label>
              <input className="brut-input" type="date" value={form.readingDate} onChange={e => set("readingDate", e.target.value)} />
            </div>
            <div>
              <label className="brut-label">รอบบิล (YYYY-MM)</label>
              <input className="brut-input font-mono" value={form.billingPeriod} onChange={e => set("billingPeriod", e.target.value)} />
            </div>
          </div>

          {/* Camera / OCR */}
          <div className="border-2 border-dashed border-black p-4">
            <div className="text-xs font-mono font-bold uppercase tracking-widest mb-3">ถ่ายรูปมิเตอร์ (OCR)</div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageCapture} />
            <button onClick={() => fileRef.current?.click()} disabled={ocrLoading || uploadLoading}
              className="brut-btn-outline w-full gap-2">
              <Camera className="w-4 h-4" />
              {ocrLoading ? "กำลังอ่านตัวเลข..." : uploadLoading ? "กำลังอัปโหลด..." : "เปิดกล้อง / เลือกรูป"}
            </button>
            {form.imageUrl && (
              <div className="mt-3">
                <img src={form.imageUrl} alt="meter" className="w-full max-h-40 object-contain border-2 border-black" />
                {form.ocrRawValue && <div className="text-xs font-mono mt-1 text-green-700">OCR: {form.ocrRawValue}</div>}
              </div>
            )}
          </div>

          <div>
            <label className="brut-label">หมายเหตุ</label>
            <input className="brut-input" value={form.notes} onChange={e => set("notes", e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t-4 border-black">
          <button onClick={handleSubmit} disabled={recordMutation.isPending} className="brut-btn flex-1">
            {recordMutation.isPending ? "กำลังบันทึก..." : "บันทึกมิเตอร์"}
          </button>
          <button onClick={onClose} className="px-6 py-2.5 border-2 border-black font-bold text-sm uppercase hover:bg-gray-100">ยกเลิก</button>
        </div>
      </div>
    </div>
  );
}

export default function Meters() {
  const { data: readings = [], isLoading } = trpc.meters.list.useQuery({ roomId: undefined });
  const { data: rooms = [] } = trpc.rooms.list.useQuery();
  const [showForm, setShowForm] = useState(false);
  const [filterRoom, setFilterRoom] = useState<string>("all");

  const roomMap = Object.fromEntries(rooms.map(r => [r.id, r]));
  const filtered = filterRoom === "all" ? readings : readings.filter(r => String(r.roomId) === filterRoom);

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">— บันทึก</div>
          <h1 className="text-5xl font-black uppercase tracking-tighter">มิเตอร์</h1>
          <div className="h-1 w-24 bg-black mt-3" />
        </div>
        <button onClick={() => setShowForm(true)} className="brut-btn gap-2">
          <Plus className="w-4 h-4" />บันทึกมิเตอร์
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <select className="brut-input w-auto text-sm" value={filterRoom} onChange={e => setFilterRoom(e.target.value)}>
          <option value="all">ทุกห้อง</option>
          {rooms.map(r => <option key={r.id} value={String(r.id)}>ห้อง {r.roomNumber}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="brut-card animate-pulse h-20" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="brut-card text-center py-16">
          <div className="text-6xl font-black text-gray-200 mb-4">—</div>
          <div className="font-bold uppercase text-muted-foreground">ไม่พบประวัติมิเตอร์</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const room = roomMap[r.roomId];
            return (
              <div key={r.id} className="brut-card flex items-center gap-4">
                <div className={`w-12 h-12 border-2 border-black flex items-center justify-center shrink-0 ${r.type === "electricity" ? "bg-yellow-100 border-yellow-600" : "bg-blue-100 border-blue-600"}`}>
                  {r.type === "electricity" ? <Zap className="w-6 h-6 text-yellow-700" /> : <Droplets className="w-6 h-6 text-blue-700" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black">ห้อง {room?.roomNumber ?? r.roomId}</span>
                    <span className="text-xs font-mono text-muted-foreground">{String(r.readingDate)}</span>
                    {r.billingPeriod && <span className="text-xs border-2 border-black px-2 py-0.5 font-mono">{r.billingPeriod}</span>}
                  </div>
                  <div className="flex gap-4 mt-1 text-sm font-mono">
                    <span className="text-muted-foreground">ก่อน: <strong>{r.previousReading}</strong></span>
                    <span>→</span>
                    <span className="text-muted-foreground">ปัจจุบัน: <strong>{r.currentReading}</strong></span>
                    <span className="font-black text-black">= {r.unitsUsed} หน่วย</span>
                  </div>
                </div>
                {r.imageUrl && <img src={r.imageUrl} alt="meter" className="w-16 h-16 object-cover border-2 border-black shrink-0" />}
              </div>
            );
          })}
        </div>
      )}

      {showForm && <MeterForm rooms={rooms} onClose={() => setShowForm(false)} />}
    </DashboardLayout>
  );
}
