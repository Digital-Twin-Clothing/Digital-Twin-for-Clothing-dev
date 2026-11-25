// 3D model hand-off: modelState (src/lib/avatar-model.ts) and GET /api/avatar-model.
import { describe, it, expect, vi, beforeEach } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const storageMock = vi.hoisted(() => ({ readObject: vi.fn() }));
const dbMock = vi.hoisted(() => ({ key: vi.fn((p: string[]) => p), get: vi.fn() }));

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/storage", () => storageMock);
vi.mock("@/lib/db", () => ({ db: dbMock }));

import { GET } from "@/app/api/avatar-model/route";
import { modelState } from "@/lib/avatar-model";

describe("modelState", () => {
  it("maps the record status to what the profile page shows", () => {
    expect(modelState(undefined)).toBe("none");
    expect(modelState({ status: "uploading" })).toBe("none");
    expect(modelState({ status: "uploaded" })).toBe("waiting");
    expect(modelState({ status: "processing" })).toBe("processing");
    expect(modelState({ status: "ready", modelPath: "gs://b/m.glb" })).toBe("ready");
    expect(modelState({ status: "failed" })).toBe("failed");
  });

  it("does not claim a model is ready when the worker saved no file", () => {
    expect(modelState({ status: "ready" })).toBe("processing");
  });
});

describe("GET /api/avatar-model", () => {
  beforeEach(() => {
    authMock.mockReset().mockResolvedValue({ user: { id: "u1" } });
    storageMock.readObject.mockReset();
    dbMock.get.mockReset();
  });

  it("rejects signed-out requests", async () => {
    authMock.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
    expect(dbMock.get).not.toHaveBeenCalled();
  });

  it("returns 404 until the model is ready", async () => {
    dbMock.get.mockResolvedValue([{ status: "processing" }]);
    expect((await GET()).status).toBe(404);
    expect(storageMock.readObject).not.toHaveBeenCalled();
  });

  it("only reads the signed-in user's own record", async () => {
    dbMock.get.mockResolvedValue([undefined]);
    await GET();
    expect(dbMock.key).toHaveBeenCalledWith(["AvatarPhotos", "u1"]);
  });

  it("streams the GLB when ready", async () => {
    dbMock.get.mockResolvedValue([{ status: "ready", modelPath: "gs://b/avatars/u1/body.glb" }]);
    storageMock.readObject.mockResolvedValue({ data: Buffer.from("glTF"), contentType: "application/octet-stream" });
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("model/gltf-binary");
    expect(Buffer.from(await res.arrayBuffer()).toString()).toBe("glTF");
  });

  it("returns 500 when the file cannot be read", async () => {
    dbMock.get.mockResolvedValue([{ status: "ready", modelPath: "gs://b/x.glb" }]);
    storageMock.readObject.mockRejectedValue(new Error("boom"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await GET()).status).toBe(500);
  });
});
