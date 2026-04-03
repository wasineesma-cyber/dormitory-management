import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Save,
  Building2,
  Users,
  Plus,
  Shield,
  ShieldCheck,
  Trash2,
  Pencil,
  X,
  Check,
  Phone,
  Mail,
  User,
  AlertTriangle,
} from "lucide-react";

type UserRole = "admin" | "user" | "manager" | "superadmin";

type Permissions = {
  manageRooms: boolean;
  manageBills: boolean;
  manageSettings: boolean;
};

export default function Settings() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  // ─── Dormitory Name ─────────────────────────────────────────────────────
  const houseQuery = trpc.settings.getHouse.useQuery();
  const settingsQuery = trpc.settings.getAll.useQuery();
  const setSettingMutation = trpc.settings.set.useMutation({
    onSuccess: () => {
      utils.settings.getAll.invalidate();
      toast.success("บันทึกชื่อหอพักเรียบร้อย");
    },
    onError: (err) => toast.error(err.message),
  });
  const createUserMutation = trpc.userManagement.create.useMutation({
    onSuccess: () => {
      utils.userManagement.list.invalidate();
      toast.success("สร้างบัญชีเรียบร้อย");
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("user");
      setNewPermissions({ manageRooms: true, manageBills: true, manageSettings: false });
    },
    onError: (err) => toast.error(err.message),
  });

  const checkoutMutation = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess: (res) => { if (res.url) window.location.href = res.url; },
    onError: (err) => toast.error(err.message),
  });
  const portalMutation = trpc.stripe.createPortalSession.useMutation({
    onSuccess: (res) => { if (res.url) window.location.href = res.url; },
    onError: (err) => toast.error(err.message),
  });

  const [dormName, setDormName] = useState("");
  const [dormAddress, setDormAddress] = useState("");
  const [dormPhone, setDormPhone] = useState("");
  const [promptPayId, setPromptPayId] = useState("");

  useEffect(() => {
    if (settingsQuery.data) {
      setDormName(settingsQuery.data["dormitory_name"] || "");
      setDormAddress(settingsQuery.data["dormitory_address"] || "");
      setDormPhone(settingsQuery.data["dormitory_phone"] || "");
      setPromptPayId(settingsQuery.data["promptpay_id"] || "");
    }
  }, [settingsQuery.data]);

  const handleSaveSettings = () => {
    const saves = [
      { key: "dormitory_name", value: dormName },
      { key: "dormitory_address", value: dormAddress },
      { key: "dormitory_phone", value: dormPhone },
      { key: "promptpay_id", value: promptPayId },
    ];
    saves.forEach((s) => {
      if (s.value) setSettingMutation.mutate(s);
    });
  };

  // ─── User Management ───────────────────────────────────────────────────
  const usersQuery = trpc.userManagement.list.useQuery();
  const updateRoleMutation = trpc.userManagement.updateRole.useMutation({
    onSuccess: () => {
      utils.userManagement.list.invalidate();
      toast.success("อัปเดตสิทธิ์เรียบร้อย");
      setManagePermsId(null);
    },
    onError: (err) => toast.error(err.message),
  });
  const updateInfoMutation = trpc.userManagement.updateInfo.useMutation({
    onSuccess: () => {
      utils.userManagement.list.invalidate();
      toast.success("อัปเดตข้อมูลเรียบร้อย");
      setEditingUserId(null);
    },
    onError: (err) => toast.error(err.message),
  });
  const deleteUserMutation = trpc.userManagement.delete.useMutation({
    onSuccess: () => {
      utils.userManagement.list.invalidate();
      toast.success("ลบผู้ใช้เรียบร้อย");
    },
    onError: (err) => toast.error(err.message),
  });

  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "users">("general");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("user");
  const [newPermissions, setNewPermissions] = useState<Permissions>({ manageRooms: true, manageBills: true, manageSettings: false });
  const [managePermsId, setManagePermsId] = useState<number | null>(null);
  const [managePermsState, setManagePermsState] = useState<Permissions>({ manageRooms: true, manageBills: true, manageSettings: false });

  const startEdit = (u: { id: number; name?: string | null; email?: string | null }) => {
    setEditingUserId(u.id);
    setEditName(u.name || "");
    setEditEmail(u.email || "");
  };

  const handleSaveUserInfo = () => {
    if (editingUserId === null) return;
    updateInfoMutation.mutate({ id: editingUserId, name: editName, email: editEmail });
  };

  const handleToggleRole = (userId: number, currentRole: string) => {
    // Basic toggle if admin. For more fine grained, they should use edit.
    const newRole: UserRole = currentRole === "admin" ? "user" : "admin";
    updateRoleMutation.mutate({ id: userId, role: newRole });
  };

  const handleDeleteUser = (userId: number) => {
    deleteUserMutation.mutate({ id: userId });
    setDeleteConfirmId(null);
  };

  const allUsers = usersQuery.data || [];
  const admins = allUsers.filter((u) => u.role === "admin" || u.role === "manager" || u.role === "superadmin");
  const tenants = allUsers.filter((u) => u.role === "user");

  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest">— ตั้งค่า</div>
          <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mt-1">SETTINGS</h1>
          <div className="w-16 h-1 bg-black mt-3" />
        </div>

        {/* Tabs */}
        <div className="flex gap-0 mb-8 border-b-4 border-black">
          <button
            onClick={() => setActiveTab("general")}
            className={`px-6 py-3 text-sm font-black uppercase tracking-wide border-b-4 -mb-1 transition-all ${activeTab === "general"
              ? "border-black text-black"
              : "border-transparent text-muted-foreground hover:text-black"
              }`}
          >
            <Building2 className="w-4 h-4 inline mr-2" />
            ข้อมูลหอพัก
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-6 py-3 text-sm font-black uppercase tracking-wide border-b-4 -mb-1 transition-all ${activeTab === "users"
              ? "border-black text-black"
              : "border-transparent text-muted-foreground hover:text-black"
              }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            จัดการผู้ใช้
          </button>
        </div>

        {/* ─── General Settings Tab ─────────────────────────────────────────── */}
        {activeTab === "general" && (
          <div className="space-y-6">
            <div className="border-4 border-black p-6">
              <h2 className="text-xl font-black uppercase tracking-tight mb-6 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                ข้อมูลหอพัก
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest mb-2">ชื่อหอพัก / อพาร์ทเม้นท์</label>
                  <input
                    type="text"
                    value={dormName}
                    onChange={(e) => setDormName(e.target.value)}
                    placeholder="เช่น หอพักสุขสันต์, The Garden Apartment"
                    className="w-full px-4 py-3 border-4 border-black text-lg font-bold focus:outline-none focus:ring-0 focus:border-black bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest mb-2">ที่อยู่</label>
                  <textarea
                    value={dormAddress}
                    onChange={(e) => setDormAddress(e.target.value)}
                    placeholder="ที่อยู่หอพัก"
                    rows={2}
                    className="w-full px-4 py-3 border-4 border-black font-mono text-sm focus:outline-none focus:ring-0 focus:border-black bg-white resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest mb-2">
                      <Phone className="w-3 h-3 inline mr-1" />
                      เบอร์โทรศัพท์
                    </label>
                    <input
                      type="text"
                      value={dormPhone}
                      onChange={(e) => setDormPhone(e.target.value)}
                      placeholder="0xx-xxx-xxxx"
                      className="w-full px-4 py-3 border-4 border-black font-mono focus:outline-none focus:ring-0 focus:border-black bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest mb-2">
                      PromptPay ID (สำหรับ QR Code)
                    </label>
                    <input
                      type="text"
                      value={promptPayId}
                      onChange={(e) => setPromptPayId(e.target.value)}
                      placeholder="เบอร์โทร หรือ เลขบัตรประชาชน"
                      className="w-full px-4 py-3 border-4 border-black font-mono focus:outline-none focus:ring-0 focus:border-black bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Subscription Block */}
              {houseQuery.data && (() => {
                const plans = [
                  { id: "starter", name: "S - Starter", limit: 20, price: "1,200 บาท/ปี" },
                  { id: "growth", name: "M - Growth", limit: 50, price: "3,000 บาท/ปี" },
                  { id: "pro", name: "L - Pro", limit: 100, price: "6,000 บาท/ปี" },
                  { id: "unlimited", name: "XL - Unlimited", limit: "ไม่จำกัด", price: "9,900 บาท/ปี" },
                ];

                const currentPlan = houseQuery.data.planType;
                const isTrial = currentPlan === "free";

                return (
                  <div className="mt-8 border-t-4 border-black pt-8">
                    <h2 className="text-xl font-black uppercase tracking-tight mb-2">
                      แพ็กเกจพื้นที่และการชำระเงิน
                    </h2>
                    <p className="text-sm font-mono text-muted-foreground mb-6">
                      เลือกแผนรายปีให้เหมาะสมกับขนาดหอพักของคุณ (ขณะนี้คุณใช้ {isTrial ? 'แพ็กเกจทดลองใช้ (สูงสุด 5 ห้อง)' : 'แพ็กเกจ ' + currentPlan.toUpperCase()})
                    </p>

                    {isTrial && (
                      <div className="mb-6 p-4 bg-orange-100 border border-orange-500 text-orange-800 font-medium">
                        เหลือเวลาทดลองใช้ฟรี {Math.max(0, Math.ceil((new Date(houseQuery.data.trialEndsAt || Date.now()).getTime() - Date.now()) / (1000 * 3600 * 24)))} วัน
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {plans.map((p) => (
                        <div key={p.id} className={`border-4 p-5 flex flex-col ${currentPlan === p.id ? 'border-green-600 bg-green-50' : 'border-black bg-white hover:-translate-y-1 transition-transform shadow-sm'}`}>
                          <h3 className="font-black uppercase text-lg">{p.name}</h3>
                          <p className="text-xs font-mono text-muted-foreground mt-1 mb-4">สูงสุด {p.limit} ห้อง</p>
                          <div className="font-bold text-xl mb-4 text-[#d7b56d]">{p.price}</div>

                          <div className="mt-auto">
                            {currentPlan === p.id ? (
                              <button
                                onClick={() => portalMutation.mutate()}
                                disabled={portalMutation.isPending}
                                className="w-full py-2 bg-green-600 text-white font-black uppercase text-sm outline-none"
                              >
                                {portalMutation.isPending ? "กำลังโหลด..." : "จัดการการชำระเงิน"}
                              </button>
                            ) : (
                              <button
                                onClick={() => checkoutMutation.mutate({ planType: p.id as any })}
                                disabled={checkoutMutation.isPending}
                                className={`w-full py-2 font-black uppercase text-sm ${currentPlan === p.id ? 'bg-green-600 text-white' : 'bg-black text-white hover:bg-black/80'} outline-none`}
                              >
                                เลือกแผนนี้
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <button
                onClick={handleSaveSettings}
                disabled={setSettingMutation.isPending}
                className="mt-6 px-8 py-3 bg-black text-white font-black uppercase tracking-wide hover:bg-black/80 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {setSettingMutation.isPending ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
              </button>
            </div>
          </div>
        )}

        {/* ─── Users Tab ────────────────────────────────────────────────────── */}
        {activeTab === "users" && (
          <div className="space-y-8">
            <div className="border-4 border-black p-6 bg-gray-50">
              <h2 className="text-lg font-black uppercase tracking-tight mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                สร้างบัญชีใหม่ในบ้านนี้
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest mb-2">ชื่อ</label>
                  <input
                    className="w-full px-3 py-2 border-2 border-black bg-white"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="ชื่อผู้ใช้งาน"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest mb-2">อีเมล</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border-2 border-black bg-white"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest mb-2">รหัสผ่านเริ่มต้น</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border-2 border-black bg-white"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest mb-2">สิทธิ์</label>
                  <select
                    className="w-full px-3 py-2 border-2 border-black bg-white"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                  >
                    <option value="user">ลูกหอ ({tenants.length})</option>
                    <option value="manager">ผู้จัดการ (Manager)</option>
                    <option value="admin">แอดมิน (Admin)</option>
                  </select>
                </div>
              </div>
              {newRole === "manager" && (
                <div className="mt-4 p-4 border-2 border-black bg-white grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm font-bold">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-black" checked={newPermissions.manageRooms} onChange={(e) => setNewPermissions(p => ({ ...p, manageRooms: e.target.checked }))} /> จัดการห้องพัก
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-black" checked={newPermissions.manageBills} onChange={(e) => setNewPermissions(p => ({ ...p, manageBills: e.target.checked }))} /> บิล/พัสดุ
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-black" checked={newPermissions.manageSettings} onChange={(e) => setNewPermissions(p => ({ ...p, manageSettings: e.target.checked }))} /> ตั้งค่าหอพัก
                  </label>
                </div>
              )}
              <button
                className="mt-4 px-5 py-2.5 bg-black text-white font-black uppercase text-sm hover:bg-black/80 disabled:opacity-50"
                disabled={createUserMutation.isPending || !newName || !newEmail || newPassword.length < 6}
                onClick={() => createUserMutation.mutate({ name: newName, email: newEmail, password: newPassword, role: newRole, permissions: newRole === 'manager' ? newPermissions : undefined })}
              >
                {createUserMutation.isPending ? "กำลังสร้าง..." : "สร้างบัญชี"}
              </button>
            </div>

            {/* Admin Section */}
            <div className="border-4 border-black">
              <div className="bg-black text-white px-6 py-4 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5" />
                <h2 className="text-lg font-black uppercase tracking-tight">
                  แอดมิน / เจ้าของหอพัก ({admins.length})
                </h2>
              </div>
              <div className="divide-y-2 divide-black">
                {admins.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground font-mono text-sm">ไม่มีแอดมิน</div>
                ) : (
                  admins.map((u) => (
                    <div key={u.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      {editingUserId === u.id ? (
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="ชื่อ"
                            className="w-full px-3 py-2 border-2 border-black font-bold focus:outline-none"
                          />
                          <input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            placeholder="อีเมล"
                            className="w-full px-3 py-2 border-2 border-black font-mono text-sm focus:outline-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveUserInfo}
                              className="px-4 py-1.5 bg-black text-white text-xs font-black uppercase flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" /> บันทึก
                            </button>
                            <button
                              onClick={() => setEditingUserId(null)}
                              className="px-4 py-1.5 border-2 border-black text-xs font-black uppercase flex items-center gap-1"
                            >
                              <X className="w-3 h-3" /> ยกเลิก
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {u.role === "manager" ? <Shield className="w-4 h-4 shrink-0 text-orange-500" /> : <ShieldCheck className="w-4 h-4 shrink-0 text-black" />}
                              <span className="font-bold truncate">{u.name || "ไม่ระบุชื่อ"}</span>
                              <span className={`text-xs font-black uppercase px-2 py-0.5 shrink-0 ${u.role === "manager" ? "bg-orange-500 text-white" : u.role === "superadmin" ? "bg-red-600 text-white" : "bg-black text-white"}`}>{u.role}</span>
                            </div>
                            <div className="text-xs font-mono text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                              {u.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" /> {u.email}
                                </span>
                              )}
                              <span>เข้าสู่ระบบล่าสุด: {new Date(u.lastSignedIn).toLocaleDateString("th-TH")}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => startEdit(u)}
                              className="p-2 border-2 border-black hover:bg-black hover:text-white transition-all"
                              title="แก้ไข"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            {u.id !== user?.id && (
                              <>
                                <button
                                  onClick={() => handleToggleRole(u.id, "admin")}
                                  className="p-2 border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white transition-all"
                                  title="ลดหรือเปลี่ยนเป็นผู้เช่า"
                                >
                                  <User className="w-4 h-4" />
                                </button>
                                {deleteConfirmId === u.id ? (
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleDeleteUser(u.id)}
                                      className="px-3 py-1 bg-red-600 text-white text-xs font-black uppercase"
                                    >
                                      ยืนยัน
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirmId(null)}
                                      className="px-3 py-1 border-2 border-black text-xs font-black uppercase"
                                    >
                                      ยกเลิก
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setDeleteConfirmId(u.id)}
                                    className="p-2 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                    title="ลบ"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Tenant Section */}
            <div className="border-4 border-black">
              <div className="bg-white px-6 py-4 flex items-center gap-3 border-b-4 border-black">
                <Users className="w-5 h-5" />
                <h2 className="text-lg font-black uppercase tracking-tight">
                  ผู้เช่า ({tenants.length})
                </h2>
              </div>
              <div className="divide-y-2 divide-black/20">
                {tenants.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground font-mono text-sm">ยังไม่มีผู้เช่าในระบบ</div>
                ) : (
                  tenants.map((u) => (
                    <div key={u.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      {editingUserId === u.id ? (
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="ชื่อ"
                            className="w-full px-3 py-2 border-2 border-black font-bold focus:outline-none"
                          />
                          <input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            placeholder="อีเมล"
                            className="w-full px-3 py-2 border-2 border-black font-mono text-sm focus:outline-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveUserInfo}
                              className="px-4 py-1.5 bg-black text-white text-xs font-black uppercase flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" /> บันทึก
                            </button>
                            <button
                              onClick={() => setEditingUserId(null)}
                              className="px-4 py-1.5 border-2 border-black text-xs font-black uppercase flex items-center gap-1"
                            >
                              <X className="w-3 h-3" /> ยกเลิก
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 shrink-0" />
                              <span className="font-bold truncate">{u.name || "ไม่ระบุชื่อ"}</span>
                              <span className="text-xs font-mono px-2 py-0.5 border border-black/30 shrink-0">USER</span>
                            </div>
                            <div className="text-xs font-mono text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                              {u.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" /> {u.email}
                                </span>
                              )}
                              <span>เข้าสู่ระบบล่าสุด: {new Date(u.lastSignedIn).toLocaleDateString("th-TH")}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => startEdit(u)}
                              className="p-2 border-2 border-black hover:bg-black hover:text-white transition-all"
                              title="แก้ไข"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleRole(u.id, u.role)}
                              className="p-2 border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white transition-all"
                              title="เลื่อนเป็นแอดมิน"
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </button>
                            {deleteConfirmId === u.id ? (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="px-3 py-1 bg-red-600 text-white text-xs font-black uppercase"
                                >
                                  ยืนยัน
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="px-3 py-1 border-2 border-black text-xs font-black uppercase"
                                >
                                  ยกเลิก
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(u.id)}
                                className="p-2 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                title="ลบ"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Warning */}
            <div className="border-2 border-orange-400 bg-orange-50 p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold text-orange-700">หมายเหตุ</p>
                <p className="text-orange-600 mt-1">
                  การเปลี่ยน Role จะมีผลทันที ผู้ใช้ที่ถูกเปลี่ยนจะต้องรีเฟรชหน้าเพื่อเห็นการเปลี่ยนแปลง
                  ไม่สามารถลดสิทธิ์หรือลบบัญชีตัวเองได้
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
