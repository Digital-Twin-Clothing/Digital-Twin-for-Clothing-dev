// S2-HT-04: POST /api/avatar-photos (src/app/api/avatar-photos/route.ts)
// Test doubles: authMock (signed-in user), dbMock (Datastore), storageMock (Cloud Storage).
import { describe, it, expect, vi, beforeEach } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const storageMock = vi.hoisted(() => ({ uploadObject: vi.fn() }));
const tx = vi.hoisted(() => ({
  run: vi.fn(),
  get: vi.fn(),
  save: vi.fn(),
  commit: vi.fn(),
  rollback: vi.fn(),
}));
const dbMock = vi.hoisted(() => ({ key: vi.fn((p: string[]) => p), transaction: vi.fn() }));

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/storage", () => storageMock);
vi.mock("@/lib/db", () => ({ db: dbMock }));

import { POST } from "@/app/api/avatar-photos/route";

const BATCH = "123e4567-e89b-12d3-a456-426614174000";

function upload(fields: Record<string, string | File | undefined>) {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) if (v !== undefined) form.append(k, v);
  return new Request("http://localhost:3000/api/avatar-photos", { method: "POST", body: form });
}

const jpg = () => new File([new Uint8Array([0xff, 0xd8, 0xff])], "p.jpg", { type: "image/jpeg" });
const valid = () => ({ slot: "front", batch: BATCH, heightCm: "175", file: jpg() });

beforeEach(() => {
  authMock.mockReset().mockResolvedValue({ user: { id: "u1" } });
  storageMock.uploadObject.mockReset().mockImplementation(async (p: string) => `gs://bucket/${p}`);
  Object.values(tx).forEach((m) => m.mockReset());
  tx.get.mockResolvedValue([undefined]);
  tx.rollback.mockResolvedValue(undefined);
  dbMock.transaction.mockReturnValue(tx);
});

describe("POST /api/avatar-photos", () => {
  it("rejects signed-out requests", async () => {
    authMock.mockResolvedValue(null);
    expect((await POST(upload(valid()))).status).toBe(401);
    expect(storageMock.uploadObject).not.toHaveBeenCalled();
  });

  it("rejects a missing or impossible height before saving anything", async () => {
    for (const heightCm of [undefined, "", "abc", "99", "251", "NaN"]) {
      const res = await POST(upload({ ...valid(), heightCm }));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toMatch(/height/i);
    }
    expect(storageMock.uploadObject).not.toHaveBeenCalled();
    expect(tx.save).not.toHaveBeenCalled();
  });

  it("saves the photo and stores the height on the record", async () => {
    const res = await POST(upload(valid()));
    expect(res.status).toBe(200);
    expect(storageMock.uploadObject).toHaveBeenCalledWith("avatars/u1/front.jpg", expect.any(Buffer), "image/jpeg");
    const saved = tx.save.mock.calls[0][0].data;
    expect(saved.heightCm).toBe(175);
    expect(saved.photos).toEqual({ front: "gs://bucket/avatars/u1/front.jpg" });
    expect(saved.status).toBe("uploading"); // 1 of 4
  });

  it("marks the record uploaded once all four photos of the batch are in", async () => {
    tx.get.mockResolvedValue([
      {
        batch: BATCH,
        photos: { front: "f", back: "b", left: "l" },
      },
    ]);
    expect((await POST(upload({ ...valid(), slot: "right" }))).status).toBe(200);
    const saved = tx.save.mock.calls[0][0].data;
    expect(Object.keys(saved.photos).sort()).toEqual(["back", "front", "left", "right"]);
    expect(saved.status).toBe("uploaded");
  });

  it("starts fresh when a new batch begins, so old photos do not count", async () => {
    tx.get.mockResolvedValue([{ batch: "someone-elses-old-batch", photos: { back: "old", left: "old", right: "old" } }]);
    await POST(upload(valid()));
    const saved = tx.save.mock.calls[0][0].data;
    expect(Object.keys(saved.photos)).toEqual(["front"]);
    expect(saved.status).toBe("uploading");
  });

  it("rejects a bad slot, batch, file type and file size", async () => {
    expect((await POST(upload({ ...valid(), slot: "top" }))).status).toBe(400);
    expect((await POST(upload({ ...valid(), batch: "nope" }))).status).toBe(400);
    expect((await POST(upload({ ...valid(), file: new File(["x"], "a.pdf", { type: "application/pdf" }) }))).status).toBe(400);
    const big = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "big.jpg", { type: "image/jpeg" });
    expect((await POST(upload({ ...valid(), file: big }))).status).toBe(400);
  });
});
