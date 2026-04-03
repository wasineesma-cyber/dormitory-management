import { eq, and, desc, sql, gte, lte, like, or, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  houses, InsertHouse,
  rooms, InsertRoom,
  tenants, InsertTenant,
  packages, InsertPackage,
  bills, InsertBill,
  billItems, InsertBillItem,
  meterReadings, InsertMeterReading,
  payments, InsertPayment,
  billEditHistory, InsertBillEditHistory,
  settings, InsertSetting,
  notifications, InsertNotification
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

function createHouseCode(name: string) {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  return `${cleaned || "house"}-${Math.floor(Math.random() * 9000) + 1000}`;
}

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function createHouse(name: string, code?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const houseCode = code && code.trim() ? code.trim().toLowerCase() : createHouseCode(name);
  const trialEndsAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days trial as per business model
  const result = await db.insert(houses).values({ name, code: houseCode, planType: "free", trialEndsAt } as InsertHouse);
  const id = Number((result as any)[0]?.insertId ?? 0);
  if (!id) throw new Error("Failed to create house");
  const created = await db.select().from(houses).where(eq(houses.id, id)).limit(1);
  return created[0];
}

export async function getHouseById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(houses).where(eq(houses.id, id)).limit(1);
  return result[0];
}

export async function getHouseByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(houses).where(eq(houses.code, code.toLowerCase())).limit(1);
  return result[0];
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod", "passwordHash"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);
  if (user.houseId !== undefined) { values.houseId = user.houseId; updateSet.houseId = user.houseId; }
  if (user.authProvider !== undefined) { values.authProvider = user.authProvider; updateSet.authProvider = user.authProvider; }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }

  if ((values.houseId === undefined || values.houseId === null) && user.openId === ENV.ownerOpenId) {
    const defaultCode = "main-house";
    let house = await getHouseByCode(defaultCode);
    if (!house) {
      house = await createHouse("บ้านหลัก", defaultCode);
    }
    values.houseId = house.id;
    updateSet.houseId = house.id;
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return result[0];
}

export async function hasAnyUsers() {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select({ id: users.id }).from(users).limit(1);
  return result.length > 0;
}

export async function createUser(data: InsertUser) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(users).values(data);
  const id = Number((result as any)[0]?.insertId ?? 0);
  if (!id) throw new Error("Failed to create user");
  const created = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return created[0];
}

// ─── Settings ─────────────────────────────────────────────────────────────

export async function getSetting(houseId: number, key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(settings).where(and(eq(settings.houseId, houseId), eq(settings.settingKey, key))).limit(1);
  return result[0]?.settingValue ?? null;
}

export async function setSetting(houseId: number, key: string, value: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(settings).values({ houseId, settingKey: key, settingValue: value })
    .onDuplicateKeyUpdate({ set: { settingValue: value } });
}

export async function getAllSettings(houseId: number): Promise<Record<string, string>> {
  const db = await getDb();
  if (!db) return {};
  const rows = await db.select().from(settings).where(eq(settings.houseId, houseId));
  const result: Record<string, string> = {};
  for (const row of rows) {
    if (row.settingValue) result[row.settingKey] = row.settingValue;
  }
  return result;
}

// ─── Super Admin ────────────────────────────────────────────────────────────

export async function getSuperAdminStats() {
  const db = await getDb();
  if (!db) return null;
  const h = await db.select().from(houses);
  const u = await db.select().from(users);
  return { housesCount: h.length, usersCount: u.length, houses: h };
}

// ─── User Management ────────────────────────────────────────────────────────

export async function getAllUsers(houseId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (houseId) {
    return db.select().from(users).where(eq(users.houseId, houseId)).orderBy(desc(users.lastSignedIn));
  }
  return db.select().from(users).orderBy(desc(users.lastSignedIn));
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function updateUserRole(id: number, role: "admin" | "user" | "manager" | "superadmin", permissions?: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(users).set({ role, permissions: permissions || null }).where(eq(users.id, id));
}

export async function updateUserInfo(id: number, data: { name?: string | null; email?: string | null; hasCompletedOnboarding?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(users).set(data).where(eq(users.id, id));
}

export async function deleteUser(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(users).where(eq(users.id, id));
}

// ─── Rooms ───────────────────────────────────────────────────────────────────

export async function getRooms(houseId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (houseId) {
    return db.select().from(rooms).where(eq(rooms.houseId, houseId)).orderBy(rooms.building, rooms.floor, rooms.roomNumber);
  }
  return db.select().from(rooms).orderBy(rooms.building, rooms.floor, rooms.roomNumber);
}

export async function getRoomById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
  return result[0];
}

export async function createRoom(data: InsertRoom) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(rooms).values(data);
  return result;
}

export async function updateRoom(id: number, data: Partial<InsertRoom>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(rooms).set(data).where(eq(rooms.id, id));
}

export async function deleteRoom(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(rooms).where(eq(rooms.id, id));
}

export async function getDashboardStats(houseId?: number) {
  const db = await getDb();
  if (!db) return null;

  const allRooms = houseId
    ? await db.select().from(rooms).where(eq(rooms.houseId, houseId))
    : await db.select().from(rooms);
  const totalRooms = allRooms.length;
  const vacantRooms = allRooms.filter(r => r.status === 'vacant').length;
  const occupiedRooms = allRooms.filter(r => r.status === 'occupied').length;
  const dailyRooms = allRooms.filter(r => r.type === 'daily').length;
  const monthlyRooms = allRooms.filter(r => r.type === 'monthly').length;

  const unpaidConditions = [
    or(eq(bills.status, 'unpaid'), eq(bills.status, 'partial'), eq(bills.status, 'overdue')),
  ] as any[];
  if (houseId) unpaidConditions.push(eq(bills.houseId, houseId));
  const unpaidBills = await db.select().from(bills).where(and(...unpaidConditions));
  const unpaidCount = unpaidBills.length;

  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const firstDayStr = firstDay.toISOString().split('T')[0];
  const lastDayStr = lastDay.toISOString().split('T')[0];

  const monthlyBills = houseId
    ? await db.select().from(bills).where(and(eq(bills.houseId, houseId), gte(bills.createdAt, firstDay), lte(bills.createdAt, lastDay), eq(bills.status, 'paid')))
    : await db.select().from(bills).where(and(gte(bills.createdAt, firstDay), lte(bills.createdAt, lastDay), eq(bills.status, 'paid')));
  const paidThisMonth = monthlyBills;
  const monthlyIncome = paidThisMonth.reduce((sum, p) => sum + parseFloat(String(p.totalAmount) || '0'), 0);

  return { totalRooms, vacantRooms, occupiedRooms, dailyRooms, monthlyRooms, unpaidCount, monthlyIncome };
}

// ─── Tenants ─────────────────────────────────────────────────────────────────

export async function getTenants(houseId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (houseId) {
    return db.select().from(tenants).where(eq(tenants.houseId, houseId)).orderBy(desc(tenants.createdAt));
  }
  return db.select().from(tenants).orderBy(desc(tenants.createdAt));
}

export async function getTenantById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
  return result[0];
}

export async function getTenantByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tenants).where(eq(tenants.userId, userId)).limit(1);
  return result[0];
}

export async function createTenant(data: InsertTenant) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(tenants).values(data);
}

export async function updateTenant(id: number, data: Partial<InsertTenant>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(tenants).set(data).where(eq(tenants.id, id));
}

export async function deleteTenant(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(tenants).where(eq(tenants.id, id));
}

// ─── Packages ────────────────────────────────────────────────────────────────

export async function getPackages(houseId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (houseId) {
    return db.select().from(packages).where(eq(packages.houseId, houseId)).orderBy(desc(packages.arrivedAt), desc(packages.id));
  }
  return db.select().from(packages).orderBy(desc(packages.arrivedAt), desc(packages.id));
}

export async function getPackagesByTenantId(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(packages)
    .where(eq(packages.tenantId, tenantId))
    .orderBy(desc(packages.arrivedAt), desc(packages.id));
}

export async function createPackage(data: InsertPackage) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(packages).values(data);
}

export async function updatePackage(id: number, data: Partial<InsertPackage>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(packages).set(data).where(eq(packages.id, id));
}

export async function deletePackage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(packages).where(eq(packages.id, id));
}

// ─── Meter Readings ───────────────────────────────────────────────────────────

export async function getMeterReadings(roomId?: number, houseId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (roomId && houseId) {
    return db.select().from(meterReadings).where(and(eq(meterReadings.roomId, roomId), eq(meterReadings.houseId, houseId))).orderBy(desc(meterReadings.createdAt));
  }
  if (roomId) {
    return db.select().from(meterReadings).where(eq(meterReadings.roomId, roomId)).orderBy(desc(meterReadings.createdAt));
  }
  if (houseId) {
    return db.select().from(meterReadings).where(eq(meterReadings.houseId, houseId)).orderBy(desc(meterReadings.createdAt));
  }
  return db.select().from(meterReadings).orderBy(desc(meterReadings.createdAt));
}

export async function getLatestMeterReading(roomId: number, type: 'water' | 'electricity') {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(meterReadings)
    .where(and(eq(meterReadings.roomId, roomId), eq(meterReadings.type, type)))
    .orderBy(desc(meterReadings.createdAt))
    .limit(1);
  return result[0];
}

export async function getMeterReadingForBilling(roomId: number, type: 'water' | 'electricity', billingPeriod?: string) {
  const db = await getDb();
  if (!db) return undefined;
  if (billingPeriod) {
    const matched = await db.select().from(meterReadings)
      .where(and(
        eq(meterReadings.roomId, roomId),
        eq(meterReadings.type, type),
        eq(meterReadings.billingPeriod, billingPeriod),
      ))
      .orderBy(desc(meterReadings.readingDate), desc(meterReadings.createdAt))
      .limit(1);
    if (matched[0]) return matched[0];
  }
  const latest = await db.select().from(meterReadings)
    .where(and(eq(meterReadings.roomId, roomId), eq(meterReadings.type, type)))
    .orderBy(desc(meterReadings.readingDate), desc(meterReadings.createdAt))
    .limit(1);
  return latest[0];
}

export async function createMeterReading(data: InsertMeterReading) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(meterReadings).values(data);
}

// ─── Bills ────────────────────────────────────────────────────────────────────

export async function getBills(filters?: { status?: string; roomId?: number; tenantId?: number; houseId?: number }) {
  const db = await getDb();
  if (!db) return [];
  let query = db.select().from(bills);
  const conditions = [];
  if (filters?.status) conditions.push(eq(bills.status, filters.status as any));
  if (filters?.roomId) conditions.push(eq(bills.roomId, filters.roomId));
  if (filters?.tenantId) conditions.push(eq(bills.tenantId, filters.tenantId));
  if (filters?.houseId) conditions.push(eq(bills.houseId, filters.houseId));
  if (conditions.length > 0) {
    return db.select().from(bills).where(and(...conditions)).orderBy(desc(bills.createdAt));
  }
  return db.select().from(bills).orderBy(desc(bills.createdAt));
}

export async function getBillById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bills).where(eq(bills.id, id)).limit(1);
  return result[0];
}

export async function getBillItems(billId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(billItems).where(eq(billItems.billId, billId));
}

export async function checkDuplicateBill(roomId: number, billingPeriod: string, houseId?: number) {
  const db = await getDb();
  if (!db) return false;
  const conditions = [eq(bills.roomId, roomId), eq(bills.billingPeriod, billingPeriod)] as any[];
  if (houseId) conditions.push(eq(bills.houseId, houseId));
  const existing = await db.select().from(bills)
    .where(and(...conditions))
    .limit(1);
  return existing.length > 0;
}

export async function createBill(data: InsertBill, items: InsertBillItem[]) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(bills).values(data);
  const billId = Number((result as any)[0]?.insertId ?? 0);
  if (billId && items.length > 0) {
    await db.insert(billItems).values(items.map(item => ({ ...item, billId })));
  }
  return billId;
}

export async function updateBill(id: number, data: Partial<InsertBill>, editedBy: number, editedByName: string, reason?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await getBillById(id);
  if (!existing) throw new Error("Bill not found");

  // Track changes
  const historyEntries: InsertBillEditHistory[] = [];
  for (const [key, newVal] of Object.entries(data)) {
    const oldVal = (existing as any)[key];
    if (String(oldVal) !== String(newVal)) {
      historyEntries.push({
        billId: id,
        editedBy,
        editedByName,
        fieldChanged: key,
        oldValue: String(oldVal ?? ''),
        newValue: String(newVal ?? ''),
        reason: reason ?? null,
      });
    }
  }
  await db.update(bills).set(data).where(eq(bills.id, id));
  if (historyEntries.length > 0) {
    await db.insert(billEditHistory).values(historyEntries);
  }
}

export async function getBillEditHistory(billId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(billEditHistory).where(eq(billEditHistory.billId, billId)).orderBy(desc(billEditHistory.createdAt));
}

export async function getAllBillEditHistory() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(billEditHistory).orderBy(desc(billEditHistory.createdAt)).limit(200);
}

export async function deleteBill(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(billItems).where(eq(billItems.billId, id));
  await db.delete(billEditHistory).where(eq(billEditHistory.billId, id));
  await db.delete(payments).where(eq(payments.billId, id));
  await db.delete(bills).where(eq(bills.id, id));
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export async function getPaymentsByBill(billId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(payments).where(eq(payments.billId, billId)).orderBy(desc(payments.createdAt));
}

export async function createPayment(data: InsertPayment) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(payments).values(data);
  // Update bill paid amount and status
  const allPayments = await getPaymentsByBill(data.billId);
  const totalPaid = allPayments.reduce((sum, p) => sum + parseFloat(String(p.amount) || '0'), 0) + parseFloat(String(data.amount) || '0');
  const bill = await getBillById(data.billId);
  if (bill) {
    const total = parseFloat(String(bill.totalAmount) || '0');
    let status: 'paid' | 'partial' | 'unpaid' = 'unpaid';
    if (totalPaid >= total) status = 'paid';
    else if (totalPaid > 0) status = 'partial';
    await db.update(bills).set({ paidAmount: String(totalPaid) as any, status }).where(eq(bills.id, data.billId));
  }
  return result;
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export async function getMonthlyReport(year: number, month: number, houseId?: number) {
  const db = await getDb();
  if (!db) return { income: 0, unpaid: 0, bills: [] };
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const conditions = [gte(bills.createdAt, firstDay), lte(bills.createdAt, lastDay)] as any[];
  if (houseId) conditions.push(eq(bills.houseId, houseId));
  const allBills = await db.select().from(bills).where(and(...conditions));
  const income = allBills.filter(b => b.status === 'paid').reduce((sum, b) => sum + parseFloat(String(b.totalAmount) || '0'), 0);
  const unpaid = allBills.filter(b => b.status !== 'paid').reduce((sum, b) => sum + parseFloat(String(b.totalAmount) || '0'), 0);
  return { income, unpaid, bills: allBills };
}

export async function getOverdueBills(houseId?: number) {
  const db = await getDb();
  if (!db) return [];
  const today = new Date().toISOString().split('T')[0];
  const conditions = [
    or(eq(bills.status, 'unpaid'), eq(bills.status, 'partial')),
  ] as any[];
  if (houseId) conditions.push(eq(bills.houseId, houseId));
  return db.select().from(bills).where(and(...conditions)).orderBy(bills.dueDate);
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function getNotificationsForTenant(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.tenantId, tenantId)).orderBy(desc(notifications.createdAt));
}

export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(notifications).values(data);
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function markAllNotificationsAsRead(tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.tenantId, tenantId));
}

