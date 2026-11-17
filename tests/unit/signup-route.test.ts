// S1-UT-01 to S1-UT-05: POST /api/auth/signup (src/app/api/auth/signup/route.ts)
// Test double: authStoreMock replaces getUserByEmail and createUser from @/lib/auth.
import { describe, it, expect, vi, beforeEach } from "vitest";

const authStoreMock = vi.hoisted(() => ({
  getUserByEmail: vi.fn(),
  createUser: vi.fn(),
}));
vi.mock("@/lib/auth", () => authStoreMock);

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

  it("S1-UT-03 (b) boundary 8 characters, new email: length < 8 false and existingUser false", async () => {
    authStoreMock.getUserByEmail.mockResolvedValue(undefined);
    authStoreMock.createUser.mockResolvedValue({ id: "u1", email: valid.email, name: valid.name });
    const res = await POST(signupRequest(valid));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.message).toBe("User created successfully");
    expect(body.user).toEqual({ id: "u1", email: valid.email, name: valid.name });
    expect(body.user).not.toHaveProperty("password");
    expect(authStoreMock.createUser).toHaveBeenCalledTimes(1);
    expect(authStoreMock.createUser).toHaveBeenCalledWith(valid.email, valid.password, valid.name);
  });

  it("S1-UT-04 email already used: branch existingUser is true", async () => {
    authStoreMock.getUserByEmail.mockResolvedValue({ id: "u0", email: valid.email });
    const res = await POST(signupRequest(valid));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "User already exists" });
    expect(authStoreMock.createUser).not.toHaveBeenCalled();
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
