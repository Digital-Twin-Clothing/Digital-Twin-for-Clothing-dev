import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { authConfig } from "@/lib/auth.config";
import { getUserByEmail } from "@/lib/users";

class EmailNotVerified extends CredentialsSignin {
  code = "email_not_verified";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
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
