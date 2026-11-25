import { Resend } from "resend";

export function appUrl(): string {
  return (process.env.APP_URL ?? process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export async function sendVerificationEmail(to: string, name: string, token: string) {
  const link = `${appUrl()}/api/auth/verify?token=${token}`;
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") throw new Error("RESEND_API_KEY is not set");
    console.log(`\n[dev] No RESEND_API_KEY set. Verification link for ${to}:\n${link}\n`);
    return;
  }

  const { error } = await new Resend(apiKey).emails.send({
    from: process.env.EMAIL_FROM ?? "Digital Twins <onboarding@resend.dev>",
    to,
    subject: "Verify your email",
    html: `<p>Hi ${escapeHtml(name)},</p>
<p>Confirm your email to finish creating your Digital Twins account:</p>
<p><a href="${link}">Verify my email</a></p>
<p>This link expires in 24 hours. If you didn't sign up, you can ignore this email.</p>`,
  });
  if (error) throw new Error(`Failed to send verification email: ${error.message}`);
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
