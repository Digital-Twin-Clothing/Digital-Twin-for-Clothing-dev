import { createHash, randomBytes, randomUUID } from "crypto";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";

export type UserRecord = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  emailVerified: boolean;
};

const normalize = (email: string) => email.trim().toLowerCase();
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

// The email is the entity key, so uniqueness is enforced by the database itself.
const userKey = (email: string) => db.key(["User", normalize(email)]);
const tokenKey = (token: string) => db.key(["VerificationToken", sha256(token)]);

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const [u] = await db.get(userKey(email));
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    passwordHash: u.passwordHash,
    emailVerified: u.emailVerified === true,
  };
}

/** Throws if the email is already registered (race-safe). */
export async function createUser(email: string, password: string, name: string) {
  const user = { id: randomUUID(), email: normalize(email), name: name.trim() };
  await db.insert({
    key: userKey(email),
    data: { ...user, passwordHash: await hash(password, 10), emailVerified: false, createdAt: new Date() },
  });
  return user;
}

/** Creates a single-use token. Only its hash is stored, so a DB leak can't be used to verify. */
export async function createVerificationToken(email: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await db.save({
    key: tokenKey(token),
    data: { email: normalize(email), expiresAt: Date.now() + TOKEN_TTL_MS },
  });
  return token;
}

/** Marks the user verified if the token is valid and unexpired. Returns whether it worked. */
export async function consumeVerificationToken(token: string): Promise<boolean> {
  const tx = db.transaction();
  await tx.run();
  try {
    const key = tokenKey(token);
    const [t] = await tx.get(key);
    if (!t) {
      await tx.rollback();
      return false;
    }
    tx.delete(key);
    const [u] = await tx.get(userKey(t.email));
    const valid = t.expiresAt >= Date.now() && !!u;
    if (valid) tx.save({ key: userKey(t.email), data: { ...u, emailVerified: true } });
    await tx.commit();
    return valid;
  } catch (e) {
    await tx.rollback().catch(() => {});
    throw e;
  }
}

/**
 * Finds or creates the account for someone who signed in with Google, and
 * returns its id. Google has already proven they own the email, so the account
 * is marked verified.
 *
 * If a password signup for the same email was never verified, someone else may
 * have created it with a password only they know. Linking it to the real owner
 * would hand it to them, so that password is replaced with an unusable one.
 */
export async function upsertGoogleUser(email: string, name: string): Promise<{ id: string; email: string; name: string }> {
  const key = userKey(email);
  const unusablePassword = await hash(randomBytes(32).toString("hex"), 10);
  const tx = db.transaction();
  await tx.run();
  try {
    const [existing] = await tx.get(key);
    if (existing) {
      if (!existing.emailVerified) {
        tx.save({ key, data: { ...existing, emailVerified: true, passwordHash: unusablePassword } });
      }
      await tx.commit();
      return { id: existing.id, email: existing.email, name: existing.name };
    }
    const user = { id: randomUUID(), email: normalize(email), name: (name || email).trim() };
    tx.insert({
      key,
      data: { ...user, passwordHash: unusablePassword, emailVerified: true, createdAt: new Date() },
    });
    await tx.commit();
    return user;
  } catch (e) {
    await tx.rollback().catch(() => {});
    throw e;
  }
}
