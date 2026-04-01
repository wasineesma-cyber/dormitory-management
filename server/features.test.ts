import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createTenantContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "tenant-user",
    email: "tenant@example.com",
    name: "Tenant User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("Role-based access control", () => {
  it("admin can access rooms.list", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    // Should not throw FORBIDDEN
    const result = await caller.rooms.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("tenant (user role) cannot access rooms.create", async () => {
    const ctx = createTenantContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.rooms.create({
        roomNumber: "101",
        floor: "1",
        building: "A",
        type: "monthly",
        status: "available",
      })
    ).rejects.toThrow();
  });

  it("unauthenticated user cannot access rooms.list", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.rooms.list()).rejects.toThrow();
  });

  it("admin can access reports.monthly", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.reports.monthly({ year: 2026, month: 4 });
    expect(result).toBeDefined();
    expect(result).toHaveProperty("income");
  });

  it("tenant cannot access reports.monthly", async () => {
    const ctx = createTenantContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.reports.monthly({ year: 2026, month: 4 })).rejects.toThrow();
  });
});

describe("Auth", () => {
  it("auth.me returns user for authenticated context", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const me = await caller.auth.me();
    expect(me).toBeDefined();
    expect(me?.openId).toBe("admin-user");
  });

  it("auth.me returns null for unauthenticated context", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const me = await caller.auth.me();
    expect(me).toBeNull();
  });
});

describe("Dashboard", () => {
  it("admin can access dashboard.stats", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.dashboard.stats();
    expect(stats).toBeDefined();
    expect(stats).toHaveProperty("totalRooms");
    expect(stats).toHaveProperty("vacantRooms");
    expect(stats).toHaveProperty("occupiedRooms");
    expect(stats).toHaveProperty("unpaidCount");
    expect(stats).toHaveProperty("monthlyIncome");
    expect(typeof stats.totalRooms).toBe("number");
  });
});

describe("Rooms - empty string sanitization", () => {
  it("rooms.create accepts empty string numeric fields without throwing validation error", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    // Empty strings should be sanitized to null by the router
    // This should not throw a zod validation error
    try {
      await caller.rooms.create({
        roomNumber: "999",
        type: "monthly",
        pricePerMonth: "",
        pricePerDay: "",
        waterRatePerUnit: "",
        electricityRatePerUnit: "",
        depositAmount: "",
        description: "",
        floor: "",
        building: "",
      });
    } catch (e: any) {
      // DB errors are expected in test env (no real DB), but zod validation errors are NOT expected
      expect(e.message).not.toContain("Expected number");
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("rooms.create rejects missing roomNumber", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.rooms.create({
        roomNumber: "",
        type: "monthly",
      })
    ).rejects.toThrow();
  });
});

describe("Settings router", () => {
  it("admin can access settings.getAll", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.settings.getAll();
    expect(result).toBeDefined();
    expect(typeof result).toBe("object");
  });

  it("tenant cannot access settings.set", async () => {
    const ctx = createTenantContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.settings.set({ key: "dormitory_name", value: "Test" })
    ).rejects.toThrow();
  });
});

describe("User Management router", () => {
  it("admin can access userManagement.list", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.userManagement.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("tenant cannot access userManagement.list", async () => {
    const ctx = createTenantContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.userManagement.list()).rejects.toThrow();
  });

  it("tenant cannot delete users", async () => {
    const ctx = createTenantContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.userManagement.delete({ id: 1 })
    ).rejects.toThrow();
  });
});
