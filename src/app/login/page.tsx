"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { GoogleButton } from "@/components/ui/GoogleButton";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const notice = params.get("verified")
    ? "Email verified. You can sign in now."
    : params.get("error") === "AccessDenied"
      ? "Google sign-in was refused because Google has not verified that email address."
      : params.get("verify_error")
      ? "That verification link is invalid or expired. Sign up again to get a new one."
      : "";
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.code === "email_not_verified") {
        setError("Please verify your email first. Check your inbox for the link.");
      } else if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-serif text-ink mb-2">
            Welcome back
          </h1>
          <p className="text-mute text-sm">
            Sign in to your digital twin account
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-card border border-line rounded-2xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-ink mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-3 bg-bg border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-ink transition-all"
                placeholder="you@example.com"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-ink mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-4 py-3 bg-bg border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-ink transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Error Message */}
            {notice && !error && (
              <div className="bg-bg border border-line text-ink px-4 py-3 rounded-lg text-sm">
                {notice}
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary justify-center"
            >
              {loading ? (
                <span className="lbl" data-t="Signing in...">
                  <span>Signing in...</span>
                </span>
              ) : (
                <span className="lbl" data-t="Sign in">
                  <span>Sign in</span>
                </span>
              )}
            </button>
          </form>

          <GoogleButton />

          {/* Sign Up Link */}
          <div className="mt-6 text-center text-sm">
            <span className="text-mute">Don't have an account? </span>
            <Link
              href="/signup"
              className="text-ink font-medium hover:underline"
            >
              Sign up
            </Link>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-mute hover:text-ink transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
