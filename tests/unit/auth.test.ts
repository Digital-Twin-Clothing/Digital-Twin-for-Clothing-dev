// S1-UT-06 to S1-UT-08: authorize(), jwt() and session() (src/lib/auth.ts, src/lib/auth.config.ts)
// Test doubles: nextAuthStub replaces the NextAuth() factory so no auth server starts, and
// usersMock replaces the Datastore-backed user lookup. bcryptjs is real, so password
// hashing is exercised for real.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { hash } from "bcryptjs";

const nextAuthStub = vi.hoisted(() =>
  vi.fn(() => ({ handlers: {}, auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn() }))
);
const usersMock = vi.hoisted(() => ({ getUserByEmail: vi.fn(), upsertGoogleUser: vi.fn() }));

vi.mock("next-auth", () => ({
  default: nextAuthStub,
  CredentialsSignin: class CredentialsSignin extends Error {
    code = "credentials";
  },
}));
vi.mock("@/lib/users", () => usersMock);

import "@/lib/auth";
import { authConfig } from "@/lib/auth.config";

const lastConfig = () => (nextAuthStub.mock.calls as unknown as any[][]).at(-1)![0];

// next-auth keeps the user's authorize() under provider.options
const fullConfig = (nextAuthStub.mock.calls as unknown as any[][])[0][0];
const authorize = fullConfig.providers[0].options.authorize as (c: unknown) => Promise<unknown>;
const callbacks = authConfig.callbacks as any;

async function storedUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "u1",
    email: "maya.test@example.com",
    name: "Maya Test",
    passwordHash: await hash("CorrectPass1", 4),
    emailVerified: true,
    ...overrides,
  };
}

beforeEach(() => {
  usersMock.getUserByEmail.mockReset();
  usersMock.upsertGoogleUser.mockReset();
});

describe("authorize() for the credentials provider", () => {
  it("S1-UT-06 (a) missing or non-string fields are rejected", async () => {
    expect(await authorize({ email: "maya.test@example.com" })).toBeNull();
    expect(await authorize(undefined)).toBeNull();
    expect(await authorize({ email: ["a@b.co"], password: "x" })).toBeNull();
    expect(usersMock.getUserByEmail).not.toHaveBeenCalled();
  });

  it("S1-UT-06 (b) unknown email is rejected, so a made-up address cannot sign in", async () => {
    usersMock.getUserByEmail.mockResolvedValue(null);
    expect(await authorize({ email: "nobody@example.com", password: "Abcdef12" })).toBeNull();
  });

  it("S1-UT-07 (a) wrong password is rejected", async () => {
    usersMock.getUserByEmail.mockResolvedValue(await storedUser());
    expect(await authorize({ email: "maya.test@example.com", password: "WrongPass1" })).toBeNull();
  });

  it("S1-UT-07 (b) right password but email not verified: sign-in is blocked with a clear code", async () => {
    usersMock.getUserByEmail.mockResolvedValue(await storedUser({ emailVerified: false }));
    await expect(
      authorize({ email: "maya.test@example.com", password: "CorrectPass1" })
    ).rejects.toMatchObject({ code: "email_not_verified" });
  });

  it("S1-UT-07 (c) wrong password on an unverified account does not reveal that it exists", async () => {
    usersMock.getUserByEmail.mockResolvedValue(await storedUser({ emailVerified: false }));
    expect(await authorize({ email: "maya.test@example.com", password: "WrongPass1" })).toBeNull();
  });

  it("S1-UT-07 (d) right password and verified email: returns the user without the hash", async () => {
    usersMock.getUserByEmail.mockResolvedValue(await storedUser());
    const user = await authorize({ email: "maya.test@example.com", password: "CorrectPass1" });
    expect(user).toEqual({ id: "u1", email: "maya.test@example.com", name: "Maya Test" });
    expect(user).not.toHaveProperty("passwordHash");
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

describe("Sign in with Google", () => {
  const signIn = fullConfig.callbacks.signIn as (a: unknown) => Promise<boolean>;
  const jwt = fullConfig.callbacks.jwt as (a: any) => Promise<any>;

  it("S2-GO-01 other providers pass through the signIn check", async () => {
    expect(await signIn({ account: { provider: "credentials" } })).toBe(true);
  });

  it("S2-GO-02 Google is accepted only when Google verified the email", async () => {
    const google = { provider: "google" };
    expect(await signIn({ account: google, profile: { email: "a@b.co", email_verified: true } })).toBe(true);
    expect(await signIn({ account: google, profile: { email: "a@b.co", email_verified: false } })).toBe(false);
    expect(await signIn({ account: google, profile: { email_verified: true } })).toBe(false);
    expect(await signIn({ account: google })).toBe(false);
  });

  it("S2-GO-03 first Google sign-in puts OUR user id in the token, not Google's", async () => {
    usersMock.upsertGoogleUser.mockResolvedValue({ id: "our-id", email: "a@b.co", name: "A B" });
    const token = await jwt({
      token: {},
      user: { id: "google-sub-123", email: "a@b.co", name: "A B" },
      account: { provider: "google" },
      profile: { email: "a@b.co", name: "A B" },
    });
    expect(usersMock.upsertGoogleUser).toHaveBeenCalledWith("a@b.co", "A B");
    expect(token).toMatchObject({ id: "our-id", email: "a@b.co", name: "A B" });
  });

  it("S2-GO-04 later requests (no account) do not touch the database", async () => {
    const token = await jwt({ token: { id: "our-id" } });
    expect(token).toEqual({ id: "our-id" });
    expect(usersMock.upsertGoogleUser).not.toHaveBeenCalled();
  });

  it("S2-GO-05 the Google provider exists only when its credentials are configured", async () => {
    const names = () => lastConfig().providers.map((p: any) => p.id ?? p.options?.id ?? p.name);

    vi.stubEnv("AUTH_GOOGLE_ID", "");
    vi.stubEnv("AUTH_GOOGLE_SECRET", "");
    vi.resetModules();
    await import("@/lib/auth");
    expect(lastConfig().providers).toHaveLength(1);

    vi.stubEnv("AUTH_GOOGLE_ID", "id");
    vi.stubEnv("AUTH_GOOGLE_SECRET", "secret");
    vi.resetModules();
    await import("@/lib/auth");
    expect(lastConfig().providers).toHaveLength(2);
    expect(names().map((n: string) => n.toLowerCase())).toContain("google");
    vi.unstubAllEnvs();
  });
});
