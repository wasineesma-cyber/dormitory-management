import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";
import QRCode from "qrcode";
import { randomUUID, scryptSync, timingSafeEqual } from "crypto";
import { sdk } from "./_core/sdk";

// Admin-only middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "ต้องเป็นเจ้าของหอพักเท่านั้น" });
  return next({ ctx });
});

// Generate bill number
function generateBillNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `BILL-${year}${month}-${random}`;
}

function requireHouseId(user: { houseId: number | null | undefined }) {
  if (!user.houseId) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "บัญชีนี้ยังไม่ได้ผูกกับบ้าน/หอพัก" });
  }
  return user.houseId;
}

async function ensureBootstrapAvailable() {
  const hasUsers = await db.hasAnyUsers();
  if (hasUsers) {
    throw new TRPCError({ code: "FORBIDDEN", message: "ระบบถูกตั้งค่าแอดมินครั้งแรกแล้ว" });
  }
}

// Generate PromptPay QR payload
function generatePromptPayPayload(phoneOrTaxId: string, amount: number): string {
  const cleanId = phoneOrTaxId.replace(/[-\s]/g, "");
  const isPhone = cleanId.length === 10 && cleanId.startsWith("0");
  const formattedId = isPhone ? `0066${cleanId.substring(1)}` : cleanId;
  const idType = isPhone ? "01" : "02";
  const merchantId = `0016A000000677010111${idType}${String(formattedId.length).padStart(2, "0")}${formattedId}`;
  const amountStr = amount.toFixed(2);
  const amountField = `54${String(amountStr.length).padStart(2, "0")}${amountStr}`;
  const payload = `000201010212${merchantId}5303764${amountField}5802TH6304`;
  // Simple CRC16 (CCITT)
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
    }
  }
  return payload + (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, "0");
}

export const appRouter = router({
  system: systemRouter,
  bootstrap: router({
    status: publicProcedure.query(async () => {
      const hasUsers = await db.hasAnyUsers();
      return { canCreateFirstAdmin: !hasUsers };
    }),
    createFirstAdmin: publicProcedure.input(z.object({
      name: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(6),
    })).mutation(async ({ input, ctx }) => {
      await ensureBootstrapAvailable();
      const existing = await db.getUserByEmail(input.email.trim().toLowerCase());
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "อีเมลนี้ถูกใช้งานแล้ว" });
      }

      let house = await db.getHouseByCode("main-house");
      if (!house) {
        house = await db.createHouse("บ้านหลัก", "main-house");
      }

      const openId = `local-${randomUUID()}`;
      const passwordHash = scryptSync(input.password, openId, 64).toString("hex");
      const user = await db.createUser({
        openId,
        houseId: house.id,
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        role: "admin",
        authProvider: "local",
        loginMethod: "local",
        passwordHash,
        lastSignedIn: new Date(),
      } as any);

      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || user.email || "",
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
      return { success: true } as const;
    }),
  }),
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    localLogin: publicProcedure.input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
    })).mutation(async ({ input, ctx }) => {
      const user = await db.getUserByEmail(input.email.trim().toLowerCase());
      if (!user || !user.passwordHash) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
      }
      const derived = scryptSync(input.password, user.openId, 64);
      const expected = Buffer.from(user.passwordHash, "hex");
      if (expected.length !== derived.length || !timingSafeEqual(expected, derived)) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
      }

      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || user.email || "",
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
      return { success: true } as const;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Dashboard ──────────────────────────────────────────────────────────────
  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      const stats = await db.getDashboardStats(ctx.user.houseId ?? undefined);
      return stats;
    }),
  }),

  // ─── Rooms ──────────────────────────────────────────────────────────────────
  rooms: router({
    list: protectedProcedure.query(({ ctx }) => db.getRooms(ctx.user.houseId ?? undefined)),
    byId: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) => db.getRoomById(input.id)),
    create: adminProcedure.input(z.object({
      roomNumber: z.string().min(1),
      floor: z.string().optional(),
      building: z.string().optional(),
      type: z.enum(["daily", "monthly"]),
      status: z.enum(["vacant", "occupied", "reserved", "maintenance"]).optional(),
      pricePerMonth: z.string().optional(),
      pricePerDay: z.string().optional(),
      waterBillingType: z.enum(["per_unit", "flat_rate"]).optional(),
      waterRatePerUnit: z.string().optional(),
      waterFlatRate: z.string().optional(),
      electricityRatePerUnit: z.string().optional(),
      depositAmount: z.string().optional(),
      description: z.string().optional(),
    })).mutation(({ input, ctx }) => {
      const cleaned: Record<string, any> = {};
      for (const [k, v] of Object.entries(input)) {
        cleaned[k] = v === "" ? null : v;
      }
      cleaned.houseId = requireHouseId(ctx.user);

      return db.createRoom(cleaned as any);
    }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      roomNumber: z.string().optional(),
      floor: z.string().optional(),
      building: z.string().optional(),
      type: z.enum(["daily", "monthly"]).optional(),
      status: z.enum(["vacant", "occupied", "reserved", "maintenance"]).optional(),
      pricePerMonth: z.string().optional(),
      pricePerDay: z.string().optional(),
      waterBillingType: z.enum(["per_unit", "flat_rate"]).optional(),
      waterRatePerUnit: z.string().optional(),
      waterFlatRate: z.string().optional(),
      electricityRatePerUnit: z.string().optional(),
      depositAmount: z.string().optional(),
      description: z.string().optional(),
    })).mutation(({ input }) => {
      const { id, ...rest } = input;
      const cleaned: Record<string, any> = {};
      for (const [k, v] of Object.entries(rest)) {
        cleaned[k] = v === "" ? null : v;
      }
      return db.updateRoom(id, cleaned as any);
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteRoom(input.id)),
  }),

  // ─── Tenants ────────────────────────────────────────────────────────────────
  tenants: router({
    list: adminProcedure.query(({ ctx }) => db.getTenants(ctx.user.houseId ?? undefined)),
    byId: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) => db.getTenantById(input.id)),
    myProfile: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return null;
      return db.getTenantByUserId(ctx.user.id);
    }),
    create: adminProcedure.input(z.object({
      userId: z.number().optional(),
      roomId: z.number().optional(),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      phone: z.string().optional(),
      email: z.string().optional(),
      idCardNumber: z.string().optional(),
      passportNumber: z.string().optional(),
      checkInDate: z.string().optional(),
      checkOutDate: z.string().optional(),
      contractStartDate: z.string().optional(),
      contractEndDate: z.string().optional(),
      depositPaid: z.string().optional(),
      depositStatus: z.enum(["pending", "paid", "refunded"]).optional(),
      notes: z.string().optional(),
      emergencyContact: z.string().optional(),
      emergencyPhone: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      // Sanitize empty strings to null/undefined for DB compatibility
      const cleaned: Record<string, any> = { firstName: input.firstName, lastName: input.lastName };
      const optionalStrFields = ['phone', 'email', 'idCardNumber', 'passportNumber', 'checkInDate', 'checkOutDate', 'contractStartDate', 'contractEndDate', 'notes', 'emergencyContact', 'emergencyPhone'] as const;
      for (const k of optionalStrFields) { cleaned[k] = input[k] && input[k] !== '' ? input[k] : null; }
      cleaned.depositPaid = input.depositPaid && input.depositPaid !== '' ? input.depositPaid : null;
      cleaned.depositStatus = input.depositStatus || 'pending';
      cleaned.roomId = input.roomId || null;
      cleaned.userId = input.userId || null;
      cleaned.houseId = requireHouseId(ctx.user);
      const result = await db.createTenant(cleaned as any);
      // Update room status to occupied
      if (input.roomId) await db.updateRoom(input.roomId, { status: "occupied" });
      return result;
    }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      userId: z.number().optional(),
      roomId: z.number().optional(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      idCardNumber: z.string().optional(),
      passportNumber: z.string().optional(),
      checkInDate: z.string().optional(),
      checkOutDate: z.string().optional(),
      contractStartDate: z.string().optional(),
      contractEndDate: z.string().optional(),
      depositPaid: z.string().optional(),
      depositStatus: z.enum(["pending", "paid", "refunded"]).optional(),
      status: z.enum(["active", "inactive", "checked_out"]).optional(),
      notes: z.string().optional(),
      emergencyContact: z.string().optional(),
      emergencyPhone: z.string().optional(),
    })).mutation(({ input }) => {
      const { id, ...rest } = input;
      // Sanitize empty strings to null/undefined for DB compatibility
      const cleaned: Record<string, any> = {};
      for (const [k, v] of Object.entries(rest)) {
        if (v === '' || v === undefined) { cleaned[k] = null; }
        else { cleaned[k] = v; }
      }
      return db.updateTenant(id, cleaned as any);
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteTenant(input.id)),
    myInfo: protectedProcedure.query(async ({ ctx }) => {
      const tenant = await db.getTenantByUserId(ctx.user.id);
      if (!tenant) return null;
      const room = tenant.roomId ? await db.getRoomById(tenant.roomId) : null;
      return { ...tenant, room };
    }),
    submitPaymentSlip: protectedProcedure.input(z.object({
      billId: z.number(),
      slipImageUrl: z.string(),
      notes: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const bill = await db.getBillById(input.billId);
      if (!bill) throw new TRPCError({ code: 'NOT_FOUND' });
      // Verify this bill belongs to the tenant
      const tenant = await db.getTenantByUserId(ctx.user.id);
      if (!tenant || bill.tenantId !== tenant.id) throw new TRPCError({ code: 'FORBIDDEN' });
      return db.createPayment({
        billId: input.billId,
        amount: String(Number(bill.totalAmount) - Number(bill.paidAmount)) as any,
        paymentMethod: 'transfer',
        slipImageUrl: input.slipImageUrl,
        notes: input.notes,
        recordedBy: ctx.user.id,
        status: 'pending_verification',
      } as any);
    }),
  }),

  // ─── Packages ───────────────────────────────────────────────────────────────
  packages: router({
    list: adminProcedure.query(({ ctx }) => db.getPackages(ctx.user.houseId ?? undefined)),
    myList: protectedProcedure.query(async ({ ctx }) => {
      const tenant = await db.getTenantByUserId(ctx.user.id);
      if (!tenant) return [];
      return db.getPackagesByTenantId(tenant.id);
    }),
    create: adminProcedure.input(z.object({
      tenantId: z.number().optional(),
      roomId: z.number().optional(),
      carrier: z.string().optional(),
      trackingNumber: z.string().optional(),
      itemName: z.string().min(1),
      recipientName: z.string().optional(),
      status: z.enum(["arrived", "picked_up"]).optional(),
      arrivedAt: z.string().optional(),
      pickedUpAt: z.string().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const cleaned: Record<string, any> = {
        itemName: input.itemName,
        createdBy: ctx.user.id,
        houseId: requireHouseId(ctx.user),
      };
      const optionalFields = ["carrier", "trackingNumber", "recipientName", "notes"] as const;
      for (const key of optionalFields) {
        cleaned[key] = input[key] && input[key] !== "" ? input[key] : null;
      }
      cleaned.tenantId = input.tenantId || null;
      cleaned.roomId = input.roomId || null;
      cleaned.status = input.status || "arrived";
      cleaned.arrivedAt = input.arrivedAt ? new Date(input.arrivedAt) : new Date();
      cleaned.pickedUpAt = input.pickedUpAt ? new Date(input.pickedUpAt) : null;
      return db.createPackage(cleaned as any);
    }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      tenantId: z.number().optional(),
      roomId: z.number().optional(),
      carrier: z.string().optional(),
      trackingNumber: z.string().optional(),
      itemName: z.string().min(1).optional(),
      recipientName: z.string().optional(),
      status: z.enum(["arrived", "picked_up"]).optional(),
      arrivedAt: z.string().optional(),
      pickedUpAt: z.string().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...rest } = input;
      const cleaned: Record<string, any> = {};
      for (const [key, value] of Object.entries(rest)) {
        if (key === "arrivedAt" || key === "pickedUpAt") {
          cleaned[key] = value ? new Date(String(value)) : null;
        } else {
          cleaned[key] = value === "" || value === undefined ? null : value;
        }
      }
      if (cleaned.status === "arrived") {
        cleaned.pickedUpAt = null;
      }
      if (cleaned.status === "picked_up" && !cleaned.pickedUpAt) {
        cleaned.pickedUpAt = new Date();
      }
      return db.updatePackage(id, cleaned as any);
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deletePackage(input.id)),
  }),

  // ─── Meters ─────────────────────────────────────────────────────────────────
  meters: router({
    list: protectedProcedure.input(z.object({ roomId: z.number().optional() })).query(({ input, ctx }) =>
      db.getMeterReadings(input.roomId, ctx.user.houseId ?? undefined)
    ),
    latest: protectedProcedure.input(z.object({ roomId: z.number(), type: z.enum(["water", "electricity"]) })).query(({ input }) =>
      db.getLatestMeterReading(input.roomId, input.type)
    ),
    record: adminProcedure.input(z.object({
      roomId: z.number(),
      tenantId: z.number().optional(),
      type: z.enum(["water", "electricity"]),
      previousReading: z.string(),
      currentReading: z.string(),
      readingDate: z.string(),
      billingPeriod: z.string().optional(),
      imageUrl: z.string().optional(),
      ocrRawValue: z.string().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const prev = parseFloat(input.previousReading);
      const curr = parseFloat(input.currentReading);
      if (curr < prev) throw new TRPCError({ code: "BAD_REQUEST", message: "เลขมิเตอร์ใหม่ต้องไม่ต่ำกว่าเลขเดิม" });
      const unitsUsed = String(curr - prev);
      return db.createMeterReading({ ...input, houseId: requireHouseId(ctx.user), unitsUsed, recordedBy: ctx.user.id } as any);
    }),
    ocr: adminProcedure.input(z.object({ imageUrl: z.string() })).mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a meter reading OCR assistant. Extract the numeric meter reading from the image. Return ONLY the number, nothing else." },
          { role: "user", content: [{ type: "image_url", image_url: { url: input.imageUrl, detail: "high" } }, { type: "text", text: "What is the meter reading shown in this image? Return only the number." }] as any },
        ],
      });
      const rawContent = response.choices?.[0]?.message?.content ?? "";
      const raw = typeof rawContent === 'string' ? rawContent : '';
      const match = raw.match(/[\d.]+/);
      return { value: match ? match[0] : "", raw };
    }),
  }),

  // ─── Bills ──────────────────────────────────────────────────────────────────
  bills: router({
    list: protectedProcedure.input(z.object({
      status: z.string().optional(),
      roomId: z.number().optional(),
      tenantId: z.number().optional(),
    }).optional()).query(async ({ input, ctx }) => {
      let extraFilters: { tenantId?: number } = {};
      if (ctx.user.role === 'user') {
        const tenant = await db.getTenantByUserId(ctx.user.id);
        if (!tenant) return [];
        extraFilters.tenantId = tenant.id;
      }
      return db.getBills({ ...input, ...extraFilters, houseId: ctx.user.houseId ?? undefined });
    }),
    byId: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input, ctx }) => {
      const bill = await db.getBillById(input.id);
      if (!bill) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.user.role === 'user') {
        const tenant = await db.getTenantByUserId(ctx.user.id);
        if (!tenant || bill.tenantId !== tenant.id) throw new TRPCError({ code: "FORBIDDEN" });
      }
      const items = await db.getBillItems(input.id);
      const editHistory = await db.getBillEditHistory(input.id);
      const billPayments = await db.getPaymentsByBill(input.id);
      const room = await db.getRoomById(bill.roomId);
      const tenant = bill.tenantId ? await db.getTenantById(bill.tenantId) : null;
      return { ...bill, items, editHistory, payments: billPayments, room, tenant };
    }),
    autoFill: adminProcedure.input(z.object({
      roomId: z.number(),
      billingPeriod: z.string().optional(),
    })).query(async ({ input }) => {
      const room = await db.getRoomById(input.roomId);
      if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบห้อง" });

      const electricityReading = await db.getMeterReadingForBilling(input.roomId, "electricity", input.billingPeriod);
      const waterReading = (room as any).waterBillingType === "flat_rate"
        ? undefined
        : await db.getMeterReadingForBilling(input.roomId, "water", input.billingPeriod);

      const electricityUnits = electricityReading ? Number(electricityReading.unitsUsed ?? 0) : 0;
      const electricityRate = Number((room as any).electricityRatePerUnit ?? 0);
      const waterUnits = waterReading ? Number(waterReading.unitsUsed ?? 0) : 0;
      const waterRate = Number((room as any).waterRatePerUnit ?? 0);
      const waterFlatRate = Number((room as any).waterFlatRate ?? 0);

      return {
        rentAmount: String(room.type === "monthly" ? Number((room as any).pricePerMonth ?? 0) : Number((room as any).pricePerDay ?? 0)),
        waterAmount: String((room as any).waterBillingType === "flat_rate" ? waterFlatRate : waterUnits * waterRate),
        electricityAmount: String(electricityUnits * electricityRate),
        waterMeterBefore: waterReading ? String(waterReading.previousReading ?? "") : "",
        waterMeterAfter: waterReading ? String(waterReading.currentReading ?? "") : "",
        waterUnitsUsed: waterReading ? String(waterReading.unitsUsed ?? "") : "",
        electricityMeterBefore: electricityReading ? String(electricityReading.previousReading ?? "") : "",
        electricityMeterAfter: electricityReading ? String(electricityReading.currentReading ?? "") : "",
        electricityUnitsUsed: electricityReading ? String(electricityReading.unitsUsed ?? "") : "",
      };
    }),
    create: adminProcedure.input(z.object({
      roomId: z.number(),
      tenantId: z.number().optional(),
      billingPeriod: z.string().optional(),
      checkInDate: z.string().optional(),
      checkOutDate: z.string().optional(),
      numberOfNights: z.number().optional(),
      rentAmount: z.string(),
      waterAmount: z.string().optional(),
      electricityAmount: z.string().optional(),
      otherCharges: z.string().optional(),
      discount: z.string().optional(),
      penalty: z.string().optional(),
      dueDate: z.string().optional(),
      promptPayId: z.string().optional(),
      notes: z.string().optional(),
      waterMeterBefore: z.string().optional(),
      waterMeterAfter: z.string().optional(),
      waterUnitsUsed: z.string().optional(),
      electricityMeterBefore: z.string().optional(),
      electricityMeterAfter: z.string().optional(),
      electricityUnitsUsed: z.string().optional(),
      items: z.array(z.object({
        description: z.string(),
        quantity: z.string().optional(),
        unitPrice: z.string(),
        amount: z.string(),
        itemType: z.enum(["rent", "water", "electricity", "service", "penalty", "discount", "other"]).optional(),
      })),
    })).mutation(async ({ input, ctx }) => {
      // Check duplicate for monthly bills
      if (input.billingPeriod) {
        const isDuplicate = await db.checkDuplicateBill(input.roomId, input.billingPeriod, ctx.user.houseId ?? undefined);
        if (isDuplicate) throw new TRPCError({ code: "CONFLICT", message: `มีบิลงวด ${input.billingPeriod} ของห้องนี้แล้ว` });
      }
      const rent = parseFloat(input.rentAmount || '0');
      const water = parseFloat(input.waterAmount || '0');
      const elec = parseFloat(input.electricityAmount || '0');
      const other = parseFloat(input.otherCharges || '0');
      const discount = parseFloat(input.discount || '0');
      const penalty = parseFloat(input.penalty || '0');
      const total = rent + water + elec + other - discount + penalty;
      const billData = {
        billNumber: generateBillNumber(),
        houseId: requireHouseId(ctx.user),
        roomId: input.roomId,
        tenantId: input.tenantId,
        billingPeriod: input.billingPeriod,
        checkInDate: input.checkInDate,
        checkOutDate: input.checkOutDate,
        numberOfNights: input.numberOfNights,
        rentAmount: String(rent) as any,
        waterAmount: String(water) as any,
        electricityAmount: String(elec) as any,
        otherCharges: String(other) as any,
        discount: String(discount) as any,
        penalty: String(penalty) as any,
        totalAmount: String(total) as any,
        dueDate: input.dueDate,
        promptPayId: input.promptPayId,
        notes: input.notes,
        createdBy: ctx.user.id,
        waterMeterBefore: input.waterMeterBefore || null,
        waterMeterAfter: input.waterMeterAfter || null,
        waterUnitsUsed: input.waterUnitsUsed || null,
        electricityMeterBefore: input.electricityMeterBefore || null,
        electricityMeterAfter: input.electricityMeterAfter || null,
        electricityUnitsUsed: input.electricityUnitsUsed || null,
      };
      return db.createBill(billData as any, input.items as any);
    }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["unpaid", "paid", "partial", "pending_verification", "overdue"]).optional(),
      dueDate: z.string().optional(),
      discount: z.string().optional(),
      penalty: z.string().optional(),
      notes: z.string().optional(),
      reason: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const { id, reason, ...data } = input;
      // Recalculate total if needed
      if (data.discount !== undefined || data.penalty !== undefined) {
        const bill = await db.getBillById(id);
        if (bill) {
          const rent = parseFloat(String(bill.rentAmount) || '0');
          const water = parseFloat(String(bill.waterAmount) || '0');
          const elec = parseFloat(String(bill.electricityAmount) || '0');
          const other = parseFloat(String(bill.otherCharges) || '0');
          const discount = parseFloat(data.discount ?? String(bill.discount) ?? '0');
          const penalty = parseFloat(data.penalty ?? String(bill.penalty) ?? '0');
          (data as any).totalAmount = String(rent + water + elec + other - discount + penalty);
        }
      }
      return db.updateBill(id, data as any, ctx.user.id, ctx.user.name ?? 'Admin', reason);
    }),
    qrCode: protectedProcedure.input(z.object({ billId: z.number(), promptPayId: z.string() })).query(async ({ input }) => {
      const bill = await db.getBillById(input.billId);
      if (!bill) throw new TRPCError({ code: "NOT_FOUND" });
      const remaining = parseFloat(String(bill.totalAmount) || '0') - parseFloat(String(bill.paidAmount) || '0');
      const payload = generatePromptPayPayload(input.promptPayId, remaining);
      const qrDataUrl = await QRCode.toDataURL(payload, { width: 300, margin: 2 });
      return { qrDataUrl, amount: remaining, payload };
    }),
    recordPayment: adminProcedure.input(z.object({
      billId: z.number(),
      amount: z.string(),
      paymentMethod: z.enum(["cash", "transfer", "qr", "promptpay", "other"]).optional(),
      referenceNumber: z.string().optional(),
      slipImageUrl: z.string().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      return db.createPayment({ ...input, amount: input.amount as any, recordedBy: ctx.user.id } as any);
    }),
    edit: adminProcedure.input(z.object({
      billId: z.number(),
      rentAmount: z.string().optional(),
      waterAmount: z.string().optional(),
      electricityAmount: z.string().optional(),
      otherCharges: z.string().optional(),
      discount: z.string().optional(),
      penalty: z.string().optional(),
      dueDate: z.string().optional(),
      promptPayId: z.string().optional(),
      notes: z.string().optional(),
      editReason: z.string(),
    })).mutation(async ({ input, ctx }) => {
      const { billId, editReason, ...data } = input;
      const bill = await db.getBillById(billId);
      if (!bill) throw new TRPCError({ code: 'NOT_FOUND' });
      // Validate promptPayId: treat empty string as null update to drop it
      if (data.promptPayId === "") (data as any).promptPayId = null;
      const rent = parseFloat(data.rentAmount ?? String(bill.rentAmount) ?? '0');
      const water = parseFloat(data.waterAmount ?? String(bill.waterAmount) ?? '0');
      const elec = parseFloat(data.electricityAmount ?? String(bill.electricityAmount) ?? '0');
      const other = parseFloat(data.otherCharges ?? String(bill.otherCharges) ?? '0');
      const discount = parseFloat(data.discount ?? String(bill.discount) ?? '0');
      const penalty = parseFloat(data.penalty ?? String(bill.penalty) ?? '0');
      const total = rent + water + elec + other - discount + penalty;
      return db.updateBill(billId, { ...data, totalAmount: String(total) } as any, ctx.user.id, ctx.user.name ?? 'Admin', editReason);
    }),
    delete: adminProcedure.input(z.object({ billId: z.number() })).mutation(async ({ input }) => {
      await db.deleteBill(input.billId);
      return { success: true };
    }),
  }),

  // ─── Reports ────────────────────────────────────────────────────────────────
  reports: router({
    monthly: adminProcedure.input(z.object({ year: z.number(), month: z.number() })).query(({ input }) =>
      db.getMonthlyReport(input.year, input.month)
    ),
    overdue: adminProcedure.query(() => db.getOverdueBills()),
    meterHistory: adminProcedure.input(z.object({ roomId: z.number().optional() })).query(({ input, ctx }) =>
      db.getMeterReadings(input.roomId, ctx.user.houseId ?? undefined)
    ),
    billEditHistory: adminProcedure.query(() => db.getAllBillEditHistory()),
  }),

  // ─── Settings (General) ──────────────────────────────────────────────────
  settings: router({
    getAll: adminProcedure.query(({ ctx }) => db.getAllSettings(requireHouseId(ctx.user))),
    get: protectedProcedure.input(z.object({ key: z.string() })).query(({ input, ctx }) => db.getSetting(requireHouseId(ctx.user), input.key)),
    set: adminProcedure.input(z.object({
      key: z.string(),
      value: z.string(),
    })).mutation(({ input, ctx }) => db.setSetting(requireHouseId(ctx.user), input.key, input.value)),
  }),

  // ─── User Management (Settings) ────────────────────────────────────────────
  userManagement: router({
    list: adminProcedure.query(({ ctx }) => db.getAllUsers(requireHouseId(ctx.user))),
    getById: adminProcedure.input(z.object({ id: z.number() })).query(({ input }) => db.getUserById(input.id)),
    updateRole: adminProcedure.input(z.object({
      id: z.number(),
      role: z.enum(["admin", "user"]),
    })).mutation(async ({ input, ctx }) => {
      // Prevent self-demotion
      if (input.id === ctx.user.id && input.role !== "admin") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "ไม่สามารถลดสิทธิ์ตัวเองได้" });
      }
      // Limit admins to maximum 3
      if (input.role === 'admin') {
        const allUsers = await db.getAllUsers(requireHouseId(ctx.user));
        const adminCount = allUsers.filter((u: any) => u.role === 'admin').length;
        const currentUser = allUsers.find((u: any) => u.id === input.id);
        if (currentUser?.role !== 'admin' && adminCount >= 3) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "แอดมินเต็มแล้ว (สูงสุด 3 คน)" });
        }
      }
      await db.updateUserRole(input.id, input.role);
      return { success: true };
    }),
    updateInfo: adminProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      email: z.string().optional(),
    })).mutation(async ({ input }) => {
      await db.updateUserInfo(input.id, { name: input.name, email: input.email });
      return { success: true };
    }),
    create: adminProcedure.input(z.object({
      name: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(6),
      role: z.enum(["admin", "user"]),
    })).mutation(async ({ input, ctx }) => {
      const houseId = requireHouseId(ctx.user);
      const existing = await db.getUserByEmail(input.email.trim().toLowerCase());
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "อีเมลนี้ถูกใช้งานแล้ว" });
      }
      if (input.role === "admin") {
        const allUsers = await db.getAllUsers(houseId);
        const adminCount = allUsers.filter((u: any) => u.role === "admin").length;
        if (adminCount >= 3) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "แอดมินเต็มแล้ว (สูงสุด 3 คนต่อบ้าน)" });
        }
      }
      const openId = `local-${randomUUID()}`;
      const passwordHash = scryptSync(input.password, openId, 64).toString("hex");
      const user = await db.createUser({
        openId,
        houseId,
        name: input.name,
        email: input.email.trim().toLowerCase(),
        role: input.role,
        authProvider: "local",
        loginMethod: "local",
        passwordHash,
        lastSignedIn: new Date(),
      } as any);
      return { success: true, userId: user.id };
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      if (input.id === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "ไม่สามารถลบบัญชีตัวเองได้" });
      }
      await db.deleteUser(input.id);
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
