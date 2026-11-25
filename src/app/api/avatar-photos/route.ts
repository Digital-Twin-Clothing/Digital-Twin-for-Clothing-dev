import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadObject } from "@/lib/storage";
import { isValidHeightCm, MAX_HEIGHT_CM, MIN_HEIGHT_CM } from "@/lib/height";

const SLOTS = ["front", "back", "left", "right"] as const;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Uploads ONE photo per request (Cloud Run caps a request at 32MB, so four
 * 10MB photos in a single request could be rejected). The client sends the
 * same `batch` id with all four; the record is marked complete once all four
 * slots from that batch are in. Every request also carries the user's height
 * (cm), which is stored on the same record for the 3D model.
 */
export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  try {
    const form = await request.formData();
    const slot = form.get("slot");
    const batch = form.get("batch");
    const file = form.get("file");
    const heightRaw = form.get("heightCm");
    const heightCm = typeof heightRaw === "string" && heightRaw.trim() !== "" ? Number(heightRaw) : NaN;

    if (typeof slot !== "string" || !(SLOTS as readonly string[]).includes(slot)) {
      return NextResponse.json({ error: "Invalid photo slot" }, { status: 400 });
    }
    if (typeof batch !== "string" || !/^[0-9a-f-]{36}$/.test(batch)) {
      return NextResponse.json({ error: "Invalid batch" }, { status: 400 });
    }
    if (!isValidHeightCm(heightCm)) {
      return NextResponse.json(
        { error: `Enter your height between ${MIN_HEIGHT_CM} and ${MAX_HEIGHT_CM} cm` },
        { status: 400 },
      );
    }
    if (!(file instanceof File)) return NextResponse.json({ error: `Missing ${slot} photo` }, { status: 400 });
    if (!TYPES[file.type]) return NextResponse.json({ error: `${slot}: use a JPG, PNG or WebP image` }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: `${slot}: image must be under 10MB` }, { status: 400 });

    const path = await uploadObject(
      `avatars/${userId}/${slot}.${TYPES[file.type]}`,
      Buffer.from(await file.arrayBuffer()),
      file.type,
    );

    const key = db.key(["AvatarPhotos", userId]);
    const tx = db.transaction();
    await tx.run();
    try {
      const [existing] = await tx.get(key);
      const photos: Record<string, string> = existing?.batch === batch ? { ...existing.photos } : {};
      photos[slot] = path;
      const complete = SLOTS.every((s) => photos[s]);
      tx.save({
        key,
        data: {
          batch,
          heightCm, // the 3D model scales the body to this
          photos,
          status: complete ? "uploaded" : "uploading", // the 3D model service picks up "uploaded"
          updatedAt: new Date(),
        },
      });
      await tx.commit();
    } catch (e) {
      await tx.rollback().catch(() => {});
      throw e;
    }

    return NextResponse.json({ message: "Photo uploaded" });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
