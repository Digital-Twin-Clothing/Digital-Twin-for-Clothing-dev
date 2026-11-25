// S1-UT-09: route guard in src/middleware.ts
// Test double: the next-auth stub makes auth(handler) return the handler itself,
// so each test sets req.auth directly (null = signed out).
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({ default: () => ({ auth: (handler: unknown) => handler }) }));

import middleware from "@/middleware";

const run = middleware as unknown as (req: NextRequest) => Response;

function request(path: string, signedIn: boolean) {
  const req = new NextRequest(`http://localhost:3000${path}`);
  (req as any).auth = signedIn ? { user: { id: "u1", email: "maya.test@example.com" } } : null;
  return req;
}

describe("middleware route guard", () => {
  it("S1-UT-09 (a) signed out on /dashboard: isProtectedRoute && !isAuthenticated is true", () => {
    const res = run(request("/dashboard", false));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login?callbackUrl=%2Fdashboard");
  });

  it("S1-UT-09 (b) signed in on /signup: first decision false, isAuthRoute && isAuthenticated true", () => {
    const res = run(request("/signup", true));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/");
  });

  it("S1-UT-09 (c) both decisions false: signed in on /dashboard and signed out on /login pass through", () => {
    expect(run(request("/dashboard", true)).headers.get("x-middleware-next")).toBe("1");
    expect(run(request("/login", false)).headers.get("x-middleware-next")).toBe("1");
  });

  it("S1-SEC-01 signed out on /create-avatar is redirected by the server", () => {
    const res = run(request("/create-avatar", false));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login?callbackUrl=%2Fcreate-avatar");
  });

  it("S1-SEC-01 signed in on /create-avatar passes through", () => {
    expect(run(request("/create-avatar", true)).headers.get("x-middleware-next")).toBe("1");
  });
});
