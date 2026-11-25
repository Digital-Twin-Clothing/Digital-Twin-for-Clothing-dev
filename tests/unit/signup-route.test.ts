// S1-UT-01 to S1-UT-05: POST /api/auth/signup (src/app/api/auth/signup/route.ts)
// Test doubles: usersMock replaces the Datastore-backed user functions and emailMock
// replaces the Resend email sender, so no cloud service is called.
import { describe, it, expect, vi, beforeEach } from "vitest";

const authStoreMock = vi.hoisted(() => ({
  getUserByEmail: vi.fn(),
  createUser: vi.fn(),
  createVerificationToken: vi.fn(),
}));
const emailMock = vi.hoisted(() => ({ sendVerificationEmail: vi.fn() }));
vi.mock("@/lib/users", () => authStoreMock);
vi.mock("@/lib/email", () => emailMock);

import { POST } from "@/app/api/auth/signup/route";

function signupRequest(body: unknown, raw?: string) {
  return new Request("http://localhost:3000/api/auth/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: raw ?? JSON.stringify(body),
  });
}

const valid = { email: "maya.test@example.com", password: "Abcdef12", name: "Maya Test" };

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    authStoreMock.getUserByEmail.mockReset();
    authStoreMock.createUser.mockReset();
    authStoreMock.createVerificationToken.mockReset().mockResolvedValue("tok");
    emailMock.sendVerificationEmail.mockReset().mockResolvedValue(undefined);
  });

  it("S1-UT-01 missing name: branch !email || !password || !name is true", async () => {
    const res = await POST(signupRequest({ email: valid.email, password: valid.password }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Missing required fields" });
    expect(authStoreMock.getUserByEmail).not.toHaveBeenCalled();
    expect(authStoreMock.createUser).not.toHaveBeenCalled();
  });

  it("S1-UT-02 bad email: branch !emailRegex.test(email) is true", async () => {
    const res = await POST(signupRequest({ ...valid, email: "maya.test@example" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid email format" });
  });

  it("S1-UT-03 (a) boundary 7 characters: branch password.length < 8 is true", async () => {
    const res = await POST(signupRequest({ ...valid, password: "Abcdef1" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Password must be at least 8 characters long" });
    expect(authStoreMock.createUser).not.toHaveBeenCalled();
  });

  it("S1-UT-03 (b) boundary 8 characters, new email: account is created and a verification email is sent", async () => {
    authStoreMock.getUserByEmail.mockResolvedValue(null);
    authStoreMock.createUser.mockResolvedValue({ id: "u1", email: valid.email, name: valid.name });
    const res = await POST(signupRequest(valid));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.message).toBe("Check your email to verify your account.");
    expect(body).not.toHaveProperty("user");
    expect(authStoreMock.createUser).toHaveBeenCalledWith(valid.email, valid.password, valid.name);
    expect(emailMock.sendVerificationEmail).toHaveBeenCalledWith(valid.email, valid.name, "tok");
  });

  it("S1-UT-04 email already registered and verified: rejected, nothing is sent", async () => {
    authStoreMock.getUserByEmail.mockResolvedValue({ id: "u0", email: valid.email, name: "M", emailVerified: true });
    const res = await POST(signupRequest(valid));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "User already exists" });
    expect(authStoreMock.createUser).not.toHaveBeenCalled();
    expect(emailMock.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("S1-UT-04 (b) earlier signup never verified: a new link is sent, no second account is created", async () => {
    authStoreMock.getUserByEmail.mockResolvedValue({ id: "u0", email: valid.email, name: "Maya Test", emailVerified: false });
    const res = await POST(signupRequest(valid));
    expect(res.status).toBe(201);
    expect(authStoreMock.createUser).not.toHaveBeenCalled();
    expect(emailMock.sendVerificationEmail).toHaveBeenCalledWith(valid.email, "Maya Test", "tok");
  });

  it("S1-UT-04 (c) email sending fails: returns 500 instead of pretending it worked", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    authStoreMock.getUserByEmail.mockResolvedValue(null);
    authStoreMock.createUser.mockResolvedValue({ id: "u1", email: valid.email, name: valid.name });
    emailMock.sendVerificationEmail.mockRejectedValue(new Error("resend down"));
    const res = await POST(signupRequest(valid));
    expect(res.status).toBe(500);
    errorSpy.mockRestore();
  });

  it("S1-UT-05 body is not JSON: catch path returns 500", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(signupRequest(null, "{not json"));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Internal server error" });
    expect(errorSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });
});
