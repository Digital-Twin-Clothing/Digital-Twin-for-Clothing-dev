import { NextResponse } from "next/server";
import { createUser, createVerificationToken, getUserByEmail } from "@/lib/users";
import { sendVerificationEmail } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body ?? {};

    if (typeof email !== "string" || typeof password !== "string" || typeof name !== "string" || !email || !password || !name.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 });
    }

    const existing = await getUserByEmail(email);
    if (existing?.emailVerified) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // New account, or a previous signup that was never verified: (re)send the link.
    const user = existing ?? (await createUser(email, password, name));
    const token = await createVerificationToken(user.email);
    await sendVerificationEmail(user.email, user.name, token);

    return NextResponse.json(
      { message: "Check your email to verify your account.", email: user.email },
      { status: 201 },
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
