import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { readObject } from "@/lib/storage";

const SLOTS = ["front", "back", "left", "right"];

/** Streams the signed-in user's own photo. The bucket stays private. */
export async function GET(_req: Request, { params }: { params: Promise<{ slot: string }> }) {
  const userId = (await auth())?.user?.id;
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { slot } = await params;
  if (!SLOTS.includes(slot)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [record] = await db.get(db.key(["AvatarPhotos", userId]));
  const path: string | undefined = record?.photos?.[slot];
  if (!path) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const { data, contentType } = await readObject(path);
    return new Response(new Uint8Array(data), {
      headers: { "Content-Type": contentType, "Cache-Control": "private, max-age=300" },
    });
  } catch (error) {
    console.error("Avatar photo read error:", error);
    return NextResponse.json({ error: "Could not load photo" }, { status: 500 });
  }
}
