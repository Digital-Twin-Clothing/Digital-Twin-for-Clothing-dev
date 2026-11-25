import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { readObject } from "@/lib/storage";
import { modelState } from "@/lib/avatar-model";

/** Streams the signed-in user's own 3D model (GLB). The bucket stays private. */
export async function GET() {
  const userId = (await auth())?.user?.id;
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const [record] = await db.get(db.key(["AvatarPhotos", userId]));
  if (modelState(record) !== "ready") return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const { data } = await readObject(record.modelPath);
    return new Response(new Uint8Array(data), {
      headers: { "Content-Type": "model/gltf-binary", "Cache-Control": "private, max-age=300" },
    });
  } catch (error) {
    console.error("Avatar model read error:", error);
    return NextResponse.json({ error: "Could not load model" }, { status: 500 });
  }
}
