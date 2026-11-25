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
