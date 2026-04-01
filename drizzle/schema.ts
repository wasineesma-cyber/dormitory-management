import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  date,
  boolean,
  json,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

export const houses = mysqlTable("houses", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type House = typeof houses.$inferSelect;
export type InsertHouse = typeof houses.$inferInsert;

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  houseId: int("houseId").references(() => houses.id),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  authProvider: mysqlEnum("authProvider", ["oauth", "local"]).default("oauth").notNull(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ตารางห้องพัก
export const rooms = mysqlTable("rooms", {
  id: int("id").autoincrement().primaryKey(),
  houseId: int("houseId").references(() => houses.id).notNull(),
  roomNumber: varchar("roomNumber", { length: 20 }).notNull(),
  floor: varchar("floor", { length: 10 }),
  building: varchar("building", { length: 100 }),
  type: mysqlEnum("type", ["daily", "monthly"]).notNull().default("monthly"),
  status: mysqlEnum("status", ["vacant", "occupied", "reserved", "maintenance"]).notNull().default("vacant"),
  pricePerMonth: decimal("pricePerMonth", { precision: 10, scale: 2 }),
  pricePerDay: decimal("pricePerDay", { precision: 10, scale: 2 }),
  waterBillingType: mysqlEnum("waterBillingType", ["per_unit", "flat_rate"]).notNull().default("per_unit"),
  waterRatePerUnit: decimal("waterRatePerUnit", { precision: 10, scale: 2 }).default("0"),
  waterFlatRate: decimal("waterFlatRate", { precision: 10, scale: 2 }).default("0"),
  electricityRatePerUnit: decimal("electricityRatePerUnit", { precision: 10, scale: 2 }).default("0"),
  depositAmount: decimal("depositAmount", { precision: 10, scale: 2 }).default("0"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Room = typeof rooms.$inferSelect;
export type InsertRoom = typeof rooms.$inferInsert;

// ตารางผู้เช่า
export const tenants = mysqlTable("tenants", {
  id: int("id").autoincrement().primaryKey(),
  houseId: int("houseId").references(() => houses.id).notNull(),
  userId: int("userId").references(() => users.id),
  roomId: int("roomId").references(() => rooms.id),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  idCardNumber: varchar("idCardNumber", { length: 20 }),
  passportNumber: varchar("passportNumber", { length: 30 }),
  checkInDate: date("checkInDate"),
  checkOutDate: date("checkOutDate"),
  contractStartDate: date("contractStartDate"),
  contractEndDate: date("contractEndDate"),
  depositPaid: decimal("depositPaid", { precision: 10, scale: 2 }).default("0"),
  depositStatus: mysqlEnum("depositStatus", ["pending", "paid", "refunded"]).default("pending"),
  status: mysqlEnum("status", ["active", "inactive", "checked_out"]).default("active").notNull(),
  notes: text("notes"),
  emergencyContact: varchar("emergencyContact", { length: 100 }),
  emergencyPhone: varchar("emergencyPhone", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;

// ตารางพัสดุ
export const packages = mysqlTable("packages", {
  id: int("id").autoincrement().primaryKey(),
  houseId: int("houseId").references(() => houses.id).notNull(),
  tenantId: int("tenantId").references(() => tenants.id),
  roomId: int("roomId").references(() => rooms.id),
  carrier: varchar("carrier", { length: 100 }),
  trackingNumber: varchar("trackingNumber", { length: 100 }),
  itemName: varchar("itemName", { length: 200 }).notNull(),
  recipientName: varchar("recipientName", { length: 150 }),
  status: mysqlEnum("status", ["arrived", "picked_up"]).default("arrived").notNull(),
  arrivedAt: timestamp("arrivedAt").defaultNow().notNull(),
  pickedUpAt: timestamp("pickedUpAt"),
  notes: text("notes"),
  createdBy: int("createdBy").references(() => users.id),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Package = typeof packages.$inferSelect;
export type InsertPackage = typeof packages.$inferInsert;

// ตารางบันทึกมิเตอร์
export const meterReadings = mysqlTable("meter_readings", {
  id: int("id").autoincrement().primaryKey(),
  houseId: int("houseId").references(() => houses.id).notNull(),
  roomId: int("roomId").notNull().references(() => rooms.id),
  tenantId: int("tenantId").references(() => tenants.id),
  type: mysqlEnum("type", ["water", "electricity"]).notNull(),
  previousReading: decimal("previousReading", { precision: 10, scale: 2 }).notNull(),
  currentReading: decimal("currentReading", { precision: 10, scale: 2 }).notNull(),
  unitsUsed: decimal("unitsUsed", { precision: 10, scale: 2 }).notNull(),
  readingDate: date("readingDate").notNull(),
  billingPeriod: varchar("billingPeriod", { length: 7 }), // YYYY-MM
  imageUrl: text("imageUrl"),
  ocrRawValue: varchar("ocrRawValue", { length: 50 }),
  notes: text("notes"),
  recordedBy: int("recordedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MeterReading = typeof meterReadings.$inferSelect;
export type InsertMeterReading = typeof meterReadings.$inferInsert;

// ตารางบิล
export const bills = mysqlTable("bills", {
  id: int("id").autoincrement().primaryKey(),
  houseId: int("houseId").references(() => houses.id).notNull(),
  billNumber: varchar("billNumber", { length: 30 }).notNull().unique(),
  roomId: int("roomId").notNull().references(() => rooms.id),
  tenantId: int("tenantId").references(() => tenants.id),
  billingPeriod: varchar("billingPeriod", { length: 7 }), // YYYY-MM for monthly
  checkInDate: date("checkInDate"), // for daily rooms
  checkOutDate: date("checkOutDate"), // for daily rooms
  numberOfNights: int("numberOfNights"), // for daily rooms
  rentAmount: decimal("rentAmount", { precision: 10, scale: 2 }).default("0"),
  waterAmount: decimal("waterAmount", { precision: 10, scale: 2 }).default("0"),
  electricityAmount: decimal("electricityAmount", { precision: 10, scale: 2 }).default("0"),
  otherCharges: decimal("otherCharges", { precision: 10, scale: 2 }).default("0"),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  penalty: decimal("penalty", { precision: 10, scale: 2 }).default("0"),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal("paidAmount", { precision: 10, scale: 2 }).default("0"),
  dueDate: date("dueDate"),
  status: mysqlEnum("status", ["unpaid", "paid", "partial", "pending_verification", "overdue"]).default("unpaid").notNull(),
  promptPayId: varchar("promptPayId", { length: 50 }),
  waterMeterBefore: decimal("waterMeterBefore", { precision: 10, scale: 2 }),
  waterMeterAfter: decimal("waterMeterAfter", { precision: 10, scale: 2 }),
  waterUnitsUsed: decimal("waterUnitsUsed", { precision: 10, scale: 2 }),
  electricityMeterBefore: decimal("electricityMeterBefore", { precision: 10, scale: 2 }),
  electricityMeterAfter: decimal("electricityMeterAfter", { precision: 10, scale: 2 }),
  electricityUnitsUsed: decimal("electricityUnitsUsed", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Bill = typeof bills.$inferSelect;
export type InsertBill = typeof bills.$inferInsert;

// ตารางรายการในบิล
export const billItems = mysqlTable("bill_items", {
  id: int("id").autoincrement().primaryKey(),
  billId: int("billId").notNull().references(() => bills.id),
  description: varchar("description", { length: 200 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).default("1"),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  itemType: mysqlEnum("itemType", ["rent", "water", "electricity", "service", "penalty", "discount", "other"]).default("other"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BillItem = typeof billItems.$inferSelect;
export type InsertBillItem = typeof billItems.$inferInsert;

// ตารางประวัติการชำระเงิน
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  billId: int("billId").notNull().references(() => bills.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentDate: timestamp("paymentDate").defaultNow().notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "transfer", "qr", "other"]).default("cash"),
  referenceNumber: varchar("referenceNumber", { length: 100 }),
  notes: text("notes"),
  recordedBy: int("recordedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// ตารางประวัติการแก้ไขบิล
export const billEditHistory = mysqlTable("bill_edit_history", {
  id: int("id").autoincrement().primaryKey(),
  billId: int("billId").notNull().references(() => bills.id),
  editedBy: int("editedBy").references(() => users.id),
  editedByName: varchar("editedByName", { length: 100 }),
  fieldChanged: varchar("fieldChanged", { length: 100 }),
  oldValue: text("oldValue"),
  newValue: text("newValue"),
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BillEditHistory = typeof billEditHistory.$inferSelect;
export type InsertBillEditHistory = typeof billEditHistory.$inferInsert;

// ตารางตั้งค่าระบบ
export const settings = mysqlTable(
  "settings",
  {
    id: int("id").autoincrement().primaryKey(),
    houseId: int("houseId").references(() => houses.id).notNull(),
    settingKey: varchar("settingKey", { length: 100 }).notNull(),
    settingValue: text("settingValue"),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table: any) => ({
    houseSettingKeyUnique: uniqueIndex("settings_house_setting_key_unique").on(table.houseId, table.settingKey),
  })
);

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;
