// @vitest-environment node
import { describe, test, expect, vi, beforeEach } from "vitest";
import { SignJWT, jwtVerify } from "jose";

vi.mock("server-only", () => ({}));

const mockCookieStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

async function createValidToken(payload: Record<string, unknown>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(JWT_SECRET);
}

async function createExpiredToken(payload: Record<string, unknown>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("0s")
    .setIssuedAt(new Date(Date.now() - 10000))
    .sign(JWT_SECRET);
}

describe("auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createSession", () => {
    test("signs a JWT and sets an httpOnly cookie", async () => {
      const { createSession } = await import("../auth");

      await createSession("user-123", "test@example.com");

      expect(mockCookieStore.set).toHaveBeenCalledOnce();
      const [name, token, options] = mockCookieStore.set.mock.calls[0];

      expect(name).toBe("auth-token");
      expect(typeof token).toBe("string");
      expect(options.httpOnly).toBe(true);
      expect(options.sameSite).toBe("lax");
      expect(options.path).toBe("/");

      const { payload } = await jwtVerify(token, JWT_SECRET);
      expect(payload.userId).toBe("user-123");
      expect(payload.email).toBe("test@example.com");
    });

    test("sets cookie expiry to 7 days from now", async () => {
      const { createSession } = await import("../auth");
      const before = Date.now();

      await createSession("user-123", "test@example.com");

      const [, , options] = mockCookieStore.set.mock.calls[0];
      const expires = new Date(options.expires).getTime();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;

      expect(expires).toBeGreaterThanOrEqual(before + sevenDays - 1000);
      expect(expires).toBeLessThanOrEqual(Date.now() + sevenDays + 1000);
    });
  });

  describe("getSession", () => {
    test("returns session payload for valid token", async () => {
      const token = await createValidToken({
        userId: "user-456",
        email: "user@test.com",
        expiresAt: new Date().toISOString(),
      });
      mockCookieStore.get.mockReturnValue({ value: token });

      const { getSession } = await import("../auth");
      const session = await getSession();

      expect(session).not.toBeNull();
      expect(session!.userId).toBe("user-456");
      expect(session!.email).toBe("user@test.com");
    });

    test("returns null when no cookie exists", async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      const { getSession } = await import("../auth");
      const session = await getSession();

      expect(session).toBeNull();
    });

    test("returns null for invalid token", async () => {
      mockCookieStore.get.mockReturnValue({ value: "invalid-jwt-token" });

      const { getSession } = await import("../auth");
      const session = await getSession();

      expect(session).toBeNull();
    });

    test("returns null for expired token", async () => {
      const token = await createExpiredToken({
        userId: "user-789",
        email: "expired@test.com",
      });
      mockCookieStore.get.mockReturnValue({ value: token });

      const { getSession } = await import("../auth");
      const session = await getSession();

      expect(session).toBeNull();
    });
  });

  describe("deleteSession", () => {
    test("deletes the auth-token cookie", async () => {
      const { deleteSession } = await import("../auth");

      await deleteSession();

      expect(mockCookieStore.delete).toHaveBeenCalledWith("auth-token");
    });
  });

  describe("verifySession", () => {
    test("returns session payload from request cookies", async () => {
      const token = await createValidToken({
        userId: "user-abc",
        email: "verify@test.com",
        expiresAt: new Date().toISOString(),
      });
      const request = {
        cookies: { get: vi.fn().mockReturnValue({ value: token }) },
      } as any;

      const { verifySession } = await import("../auth");
      const session = await verifySession(request);

      expect(session).not.toBeNull();
      expect(session!.userId).toBe("user-abc");
      expect(session!.email).toBe("verify@test.com");
      expect(request.cookies.get).toHaveBeenCalledWith("auth-token");
    });

    test("returns null when request has no auth cookie", async () => {
      const request = {
        cookies: { get: vi.fn().mockReturnValue(undefined) },
      } as any;

      const { verifySession } = await import("../auth");
      const session = await verifySession(request);

      expect(session).toBeNull();
    });

    test("returns null for tampered token in request", async () => {
      const request = {
        cookies: { get: vi.fn().mockReturnValue({ value: "tampered.jwt.token" }) },
      } as any;

      const { verifySession } = await import("../auth");
      const session = await verifySession(request);

      expect(session).toBeNull();
    });
  });
});
