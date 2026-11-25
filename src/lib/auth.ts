import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { authConfig } from "@/lib/auth.config";
import { getUserByEmail, upsertGoogleUser } from "@/lib/users";

class EmailNotVerified extends CredentialsSignin {
  code = "email_not_verified";
}

// Google sign-in is switched on only when its credentials are configured.
const googleEnabled = !!process.env.AUTH_GOOGLE_ID && !!process.env.AUTH_GOOGLE_SECRET;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    // Only accept Google accounts whose email Google itself has verified.
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return true;
      return profile?.email_verified === true && !!profile.email;
    },
    // On the first Google sign-in, swap Google's id for our own user id.
    async jwt(args) {
      const { account, profile, user } = args;
      if (account?.provider === "google" && profile?.email) {
        const record = await upsertGoogleUser(profile.email, profile.name ?? "");
        user.id = record.id;
        user.email = record.email;
        user.name = record.name;
      }
      return authConfig.callbacks.jwt(args);
    },
  },
  providers: [
    ...(googleEnabled ? [Google] : []),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (typeof credentials?.email !== "string" || typeof credentials?.password !== "string") {
          return null;
        }

        const user = await getUserByEmail(credentials.email);
        if (!user) return null;

        if (!(await compare(credentials.password, user.passwordHash))) return null;

        // Only reveal "not verified" after the password is correct.
        if (!user.emailVerified) throw new EmailNotVerified();

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
});
