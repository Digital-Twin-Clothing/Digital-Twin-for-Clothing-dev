// S2-RT-01: user storage (src/lib/users.ts). Test double: dbMock replaces the Datastore
// client, and keys are plain arrays so the tests can see which key was used.
import { describe, it, expect, vi, beforeEach } from "vitest";

const dbMock = vi.hoisted(() => ({
  key: vi.fn((path: string[]) => path),
  get: vi.fn(),
  insert: vi.fn(),
  save: vi.fn(),
  transaction: vi.fn(),
}));
vi.mock("@/lib/db", () => ({ db: dbMock }));

import { createUser, getUserByEmail, createVerificationToken, consumeVerificationToken } from "@/lib/users";

beforeEach(() => {
  Object.values(dbMock).forEach((m) => "mockClear" in m && m.mockClear());
  dbMock.get.mockReset();
});

describe("email handling", () => {
  it("S2-RT-01 email lookup ignores letter case and surrounding spaces", async () => {
    dbMock.get.mockResolvedValue([undefined]);
    await getUserByEmail("  CASE.TEST@Example.com ");
    expect(dbMock.get).toHaveBeenCalledWith(["User", "case.test@example.com"]);
  });

  it("createUser stores a bcrypt hash under the lowercase email, never the password", async () => {
    const user = await createUser("Maya.Test@Example.com", "CorrectPass1", " Maya Test ");
    expect(user).toMatchObject({ email: "maya.test@example.com", name: "Maya Test" });
    const call = dbMock.insert.mock.calls[0][0];
    expect(call.key).toEqual(["User", "maya.test@example.com"]);
    expect(call.data.passwordHash.startsWith("$2")).toBe(true);
    expect(JSON.stringify(call.data)).not.toContain("CorrectPass1");
    expect(call.data.emailVerified).toBe(false);
  });

  it("getUserByEmail maps a stored record and treats missing as null", async () => {
    dbMock.get.mockResolvedValueOnce([undefined]);
    expect(await getUserByEmail("a@b.co")).toBeNull();
    dbMock.get.mockResolvedValueOnce([
      { id: "u1", email: "a@b.co", name: "A", passwordHash: "h", emailVerified: true },
    ]);
    expect(await getUserByEmail("a@b.co")).toEqual({
      id: "u1", email: "a@b.co", name: "A", passwordHash: "h", emailVerified: true,
    });
  });
});

describe("verification tokens", () => {
  it("stores only a hash of the token, not the token itself", async () => {
    const token = await createVerificationToken("a@b.co");
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    const saved = dbMock.save.mock.calls[0][0];
    expect(saved.key[0]).toBe("VerificationToken");
    expect(saved.key[1]).not.toBe(token);
    expect(saved.data.email).toBe("a@b.co");
  });

  function txWith(token: unknown, user: unknown) {
    const tx = {
      run: vi.fn(),
      get: vi.fn().mockResolvedValueOnce([token]).mockResolvedValueOnce([user]),
      delete: vi.fn(),
      save: vi.fn(),
      commit: vi.fn(),
      rollback: vi.fn(),
    };
    dbMock.transaction.mockReturnValue(tx);
    return tx;
  }

  it("a valid token verifies the user and is deleted (single use)", async () => {
    const tx = txWith({ email: "a@b.co", expiresAt: Date.now() + 60_000 }, { email: "a@b.co", emailVerified: false });
    expect(await consumeVerificationToken("t")).toBe(true);
    expect(tx.delete).toHaveBeenCalled();
    expect(tx.save.mock.calls[0][0].data.emailVerified).toBe(true);
  });

  it("an expired token does not verify the user but is still deleted", async () => {
    const tx = txWith({ email: "a@b.co", expiresAt: Date.now() - 1 }, { email: "a@b.co" });
    expect(await consumeVerificationToken("t")).toBe(false);
    expect(tx.save).not.toHaveBeenCalled();
    expect(tx.delete).toHaveBeenCalled();
  });

  it("an unknown token is rejected", async () => {
    const tx = txWith(undefined, undefined);
    expect(await consumeVerificationToken("t")).toBe(false);
    expect(tx.rollback).toHaveBeenCalled();
  });
});
