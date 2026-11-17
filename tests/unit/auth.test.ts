// S1-UT-06 to S1-UT-08: authorize(), jwt() and session() in src/lib/auth.ts
// Test double: nextAuthStub replaces the NextAuth() factory so no auth server starts.
// bcryptjs is real (no double), so password hashing is exercised for real.
import { describe, it, expect, vi } from "vitest";

const nextAuthStub = vi.hoisted(() =>
  vi.fn(() => ({ handlers: {}, auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn() }))
);
vi.mock("next-auth", () => ({ default: nextAuthStub }));

import { authConfig, createUser, getUserByEmail } from "@/lib/auth";

// next-auth keeps the user's authorize() under provider.options
const credentialsProvider = authConfig.providers[0] as any;
const authorize = credentialsProvider.options.authorize as (c: unknown) => Promise<unknown>;
const callbacks = authConfig.callbacks as any;

describe("authorize() for the credentials provider", () => {
  it("S1-UT-06 (a) password missing: branch !credentials?.email || !credentials?.password is true", async () => {
    await expect(authorize({ email: "maya.test@example.com" })).rejects.toThrow("Invalid credentials");
    await expect(authorize(undefined)).rejects.toThrow("Invalid credentials");
  });

  it("S1-UT-06 (b) unknown email: branch !user || !user.password is true", async () => {
    await expect(
      authorize({ email: "nobody@example.com", password: "Abcdef12" })
    ).rejects.toThrow("Invalid credentials");
  });

  it("S1-UT-07 (a) wrong password: branch !isPasswordValid is true", async () => {
    await createUser("dikshya.test@example.com", "CorrectPass1", "Dikshya Test");
    await expect(
      authorize({ email: "dikshya.test@example.com", password: "WrongPass1" })
    ).rejects.toThrow("Invalid credentials");
  });

  it("S1-UT-07 (b) right password: branch !isPasswordValid is false, returns user without password", async () => {
    const created = await createUser("maya.test@example.com", "CorrectPass1", "Maya Test");
    const stored = await getUserByEmail("maya.test@example.com");
    expect(stored?.password).not.toBe("CorrectPass1"); // stored as a bcrypt hash
    expect(stored?.password.startsWith("$2")).toBe(true);
    const user = await authorize({ email: "maya.test@example.com", password: "CorrectPass1" });
    expect(user).toEqual({ id: created.id, email: "maya.test@example.com", name: "Maya Test" });
    expect(user).not.toHaveProperty("password");
  });
});

describe("JWT and session callbacks", () => {
  it("S1-UT-08 (a) jwt(): branch if (user) taken both ways", async () => {
    const withUser = await callbacks.jwt({
      token: { sub: "t" },
      user: { id: "u1", email: "maya.test@example.com", name: "Maya Test" },
    });
    expect(withUser).toMatchObject({ id: "u1", email: "maya.test@example.com", name: "Maya Test" });

    const withoutUser = await callbacks.jwt({ token: { sub: "t", id: "u1" } });
    expect(withoutUser).toEqual({ sub: "t", id: "u1" });
  });

  it("S1-UT-08 (b) session(): branch if (token && session.user) taken both ways", async () => {
    const token = { id: "u1", email: "maya.test@example.com", name: "Maya Test" };
    const filled = await callbacks.session({ session: { user: {} }, token });
    expect(filled.user).toEqual(token);

    const noUser = await callbacks.session({ session: { expires: "x" }, token });
    expect(noUser).toEqual({ expires: "x" });
  });
});

describe("Known bug kept as an expected failure until DT-21 fixes it", () => {
  // Bug: getUserByEmail() compares emails case-sensitively, so MAYA.TEST@example.com
  // and maya.test@example.com become two accounts. Regression case S2-RT-01.
  it.fails("S2-RT-01 (bug) email lookup ignores letter case", async () => {
    await createUser("case.test@example.com", "CorrectPass1", "Case Test");
    const found = await getUserByEmail("CASE.TEST@example.com");
    expect(found).toBeDefined();
  });
});
