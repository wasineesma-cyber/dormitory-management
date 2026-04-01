import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

type Tab = "monthly" | "meters" | "edits";

const statusLabel: Record<string, string> = {
  unpaid: "ยังไม่จ่าย", paid: "จ่ายแล้ว", partial: "จ่ายบางส่วน",
  pending_verification: "รอตรวจสอบ", overdue: "เกินกำหนด",
};

const meterTypeLabel: Record<string, string> = { water: "น้ำ", electricity: "ไฟฟ้า" };

export default function Reports() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [tab, setTab] = useState<Tab>("monthly");

  const { data: monthly, isLoading: loadingMonthly } = trpc.reports.monthly.useQuery({ year, month });
  const { data: overdue = [], isLoading: loadingOverdue } = trpc.reports.overdue.useQuery();
  const { data: meterHistory = [], isLoading: loadingMeters } = trpc.meters.list.useQuery({ roomId: undefined });
  const { data: billEdits = [], isLoading: loadingEdits } = trpc.reports.billEditHistory.useQuery();

  const months = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
  ];

  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">— ข้อมูล</div>
        <h1 className="text-5xl font-black uppercase tracking-tighter">รายงาน</h1>
        <div className="h-1 w-24 bg-black mt-3" />
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-8 border-b-4 border-black">
        {([
          { key: "monthly", label: "รายเดือน" },
          { key: "meters", label: "ประวัติมิเตอร์" },
          { key: "edits", label: "ประวัติแก้ไขบิล" },
        ] as { key: Tab; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-6 py-3 text-sm font-black uppercase tracking-wide border-t-4 border-l-4 border-r-4 -mb-1 transition-all ${
              tab === t.key
                ? "bg-black text-white border-black"
                : "bg-white text-black border-transparent hover:border-black"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Monthly Tab */}
      {tab === "monthly" && (
        <>
          <div className="flex gap-3 mb-8 flex-wrap">
            <div>
              <label className="brut-label">ปี</label>
              <select className="brut-input w-auto" value={year} onChange={e => setYear(parseInt(e.target.value))}>
                {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => (
                  <option key={y} value={y}>{y + 543}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="brut-label">เดือน</label>
              <select className="brut-input w-auto" value={month} onChange={e => setMonth(parseInt(e.target.value))}>
                {months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
            </div>
          </div>

          {loadingMonthly ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="brut-card animate-pulse h-28" />)}
            </div>
          ) : monthly && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "บิลทั้งหมด", value: monthly.bills?.length ?? 0 },
                { label: "บิลที่ชำระแล้ว", value: monthly.bills?.filter((b: any) => b.status === "paid").length ?? 0 },
                { label: "บิลค้างชำระ", value: monthly.bills?.filter((b: any) => b.status !== "paid").length ?? 0 },
                { label: "รายรับรวม", value: `฿${Number(monthly.income ?? 0).toLocaleString()}` },
              ].map(s => (
                <div key={s.label} className="brut-card">
                  <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">{s.label}</div>
                  <div className="text-4xl font-black">{s.value}</div>
                </div>
              ))}
            </div>
          )}

          <div className="brut-card mb-8">
            <div className="text-xs font-mono font-bold uppercase tracking-widest mb-4 border-l-4 border-black pl-3">
              บิลเกินกำหนด ({overdue.length})
            </div>
            {loadingOverdue ? (
              <div className="animate-pulse h-20 bg-gray-100" />
            ) : overdue.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground font-mono text-sm">ไม่มีบิลเกินกำหนด ✓</div>
            ) : (
              <div className="space-y-2">
                {overdue.map((bill: any) => (
                  <div key={bill.id} className="flex items-center justify-between py-2 border-b border-gray-200">
                    <div>
                      <span className="font-black font-mono text-sm">{bill.billNumber}</span>
                      <span className="ml-3 text-sm text-muted-foreground">ห้อง {bill.roomId}</span>
                      {bill.dueDate && <span className="ml-3 text-xs font-mono text-red-600">ครบกำหนด: {String(bill.dueDate).split("T")[0]}</span>}
                    </div>
                    <div className="font-black text-red-700">฿{Number(bill.totalAmount).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {monthly?.bills && monthly.bills.length > 0 && (
            <div className="brut-card">
              <div className="text-xs font-mono font-bold uppercase tracking-widest mb-4 border-l-4 border-black pl-3">
                รายการบิลทั้งหมด — {months[month - 1]} {year + 543}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-black">
                      <th className="text-left py-2 font-black uppercase text-xs">เลขบิล</th>
                      <th className="text-left py-2 font-black uppercase text-xs">ห้อง</th>
                      <th className="text-left py-2 font-black uppercase text-xs">สถานะ</th>
                      <th className="text-right py-2 font-black uppercase text-xs">ยอดรวม</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthly.bills.map((b: any) => (
                      <tr key={b.id} className="border-b border-gray-200">
                        <td className="py-2 font-mono text-xs">{b.billNumber}</td>
                        <td className="py-2 font-bold">ห้อง {b.roomId}</td>
                        <td className="py-2"><span className={`badge-${b.status}`}>{statusLabel[b.status] ?? b.status}</span></td>
                        <td className="py-2 text-right font-mono font-bold">฿{Number(b.totalAmount).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Meter History Tab */}
      {tab === "meters" && (
        <div className="brut-card">
          <div className="text-xs font-mono font-bold uppercase tracking-widest mb-4 border-l-4 border-black pl-3">
            ประวัติการบันทึกมิเตอร์ ({meterHistory.length})
          </div>
          {loadingMeters ? (
            <div className="animate-pulse h-40 bg-gray-100" />
          ) : meterHistory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground font-mono text-sm">ยังไม่มีประวัติมิเตอร์</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-black">
                    <th className="text-left py-2 font-black uppercase text-xs">วันที่</th>
                    <th className="text-left py-2 font-black uppercase text-xs">ห้อง</th>
                    <th className="text-left py-2 font-black uppercase text-xs">ประเภท</th>
                    <th className="text-right py-2 font-black uppercase text-xs">เลขก่อน</th>
                    <th className="text-right py-2 font-black uppercase text-xs">เลขหลัง</th>
                    <th className="text-right py-2 font-black uppercase text-xs">ใช้ไป</th>
                    <th className="text-left py-2 font-black uppercase text-xs">รอบบิล</th>
                  </tr>
                </thead>
                <tbody>
                  {meterHistory.map((m: any) => (
                    <tr key={m.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-2 font-mono text-xs">{String(m.readingDate).split("T")[0]}</td>
                      <td className="py-2 font-bold">ห้อง {m.roomId}</td>
                      <td className="py-2">
                        <span className={m.type === "electricity" ? "badge-monthly" : "badge-daily"}>
                          {meterTypeLabel[m.type] ?? m.type}
                        </span>
                      </td>
                      <td className="py-2 text-right font-mono">{Number(m.previousReading).toLocaleString()}</td>
                      <td className="py-2 text-right font-mono">{Number(m.currentReading).toLocaleString()}</td>
                      <td className="py-2 text-right font-mono font-bold">{Number(m.unitsUsed).toLocaleString()}</td>
                      <td className="py-2 text-xs font-mono text-muted-foreground">{m.billingPeriod ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Bill Edit History Tab */}
      {tab === "edits" && (
        <div className="brut-card">
          <div className="text-xs font-mono font-bold uppercase tracking-widest mb-4 border-l-4 border-black pl-3">
            ประวัติการแก้ไขบิล ({billEdits.length})
          </div>
          {loadingEdits ? (
            <div className="animate-pulse h-40 bg-gray-100" />
          ) : billEdits.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground font-mono text-sm">ยังไม่มีประวัติการแก้ไขบิล</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-black">
                    <th className="text-left py-2 font-black uppercase text-xs">วันที่แก้ไข</th>
                    <th className="text-left py-2 font-black uppercase text-xs">เลขบิล</th>
                    <th className="text-left py-2 font-black uppercase text-xs">ฟิลด์ที่แก้</th>
                    <th className="text-left py-2 font-black uppercase text-xs">ค่าเดิม</th>
                    <th className="text-left py-2 font-black uppercase text-xs">ค่าใหม่</th>
                    <th className="text-left py-2 font-black uppercase text-xs">เหตุผล</th>
                  </tr>
                </thead>
                <tbody>
                  {billEdits.map((e: any) => (
                    <tr key={e.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-2 font-mono text-xs">{String(e.createdAt).split("T")[0]}</td>
                      <td className="py-2 font-mono text-xs font-bold">{e.billId}</td>
                      <td className="py-2 font-mono text-xs">{e.fieldChanged ?? "—"}</td>
                      <td className="py-2 text-xs text-red-700 font-mono">{e.oldValue ?? "—"}</td>
                      <td className="py-2 text-xs text-green-700 font-mono">{e.newValue ?? "—"}</td>
                      <td className="py-2 text-xs text-muted-foreground">{e.reason ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
