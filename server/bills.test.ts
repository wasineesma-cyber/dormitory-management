import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./db", () => ({
  getBills: vi.fn().mockResolvedValue([]),
  getBillById: vi.fn().mockResolvedValue(null),
  getBillItems: vi.fn().mockResolvedValue([]),
  getBillEditHistory: vi.fn().mockResolvedValue([]),
  getPaymentsByBill: vi.fn().mockResolvedValue([]),
  getRoomById: vi.fn().mockResolvedValue(null),
  getTenantById: vi.fn().mockResolvedValue(null),
  getTenantByUserId: vi.fn().mockResolvedValue(null),
  getDashboardStats: vi.fn().mockResolvedValue({
    totalRooms: 0, vacantRooms: 0, occupiedRooms: 0,
    dailyRooms: 0, monthlyRooms: 0, unpaidCount: 0, monthlyIncome: 0,
  }),
  getRooms: vi.fn().mockResolvedValue([]),
  getTenants: vi.fn().mockResolvedValue([]),
  getMeterReadings: vi.fn().mockResolvedValue([]),
  getMonthlyReport: vi.fn().mockResolvedValue({ income: 0, unpaid: 0, bills: [] }),
  getOverdueBills: vi.fn().mockResolvedValue([]),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
}));

function createAdminCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@example.com",
      name: "Admin",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createTenantCtx(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "tenant-user",
      email: "tenant@example.com",
      name: "Tenant",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("bills router", () => {
  it("admin can list bills", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.bills.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("tenant gets empty bills when no tenant profile", async () => {
    const caller = appRouter.createCaller(createTenantCtx());
    const result = await caller.bills.list({});
    expect(result).toEqual([]);
  });

  it("getById throws NOT_FOUND for missing bill", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    await expect(caller.bills.getById({ id: 9999 })).rejects.toThrow();
  });
});

describe("dashboard router", () => {
  it("admin can get dashboard stats", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const stats = await caller.dashboard.stats();
    expect(stats).toHaveProperty("totalRooms");
    expect(stats).toHaveProperty("monthlyIncome");
  });
});

describe("reports router", () => {
  it("admin can get monthly report", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const report = await caller.reports.monthly({ year: 2025, month: 1 });
    expect(report).toHaveProperty("income");
    expect(report).toHaveProperty("bills");
  });

  it("tenant cannot access monthly report", async () => {
    const caller = appRouter.createCaller(createTenantCtx());
    await expect(caller.reports.monthly({ year: 2025, month: 1 })).rejects.toThrow();
  });
});

describe("tenants.myInfo", () => {
  it("returns null when tenant has no profile", async () => {
    const caller = appRouter.createCaller(createTenantCtx());
    const result = await caller.tenants.myInfo();
    expect(result).toBeNull();
  });
});
