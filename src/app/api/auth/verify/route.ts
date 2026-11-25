import { NextResponse } from "next/server";
import { consumeVerificationToken } from "@/lib/users";
import { appUrl } from "@/lib/email";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  let ok = false;
  try {
    ok = !!token && /^[0-9a-f]{64}$/.test(token) && (await consumeVerificationToken(token));
  } catch (error) {
    console.error("Verify error:", error);
  }
  return NextResponse.redirect(`${appUrl()}/login?${ok ? "verified=1" : "verify_error=1"}`);
}
