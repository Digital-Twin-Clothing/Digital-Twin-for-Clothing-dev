"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);

    try {
      // Create user account
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create account");
        setLoading(false);
        return;
      }

      setSent(true);
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <h1 className="text-3xl font-serif text-ink mb-3">Check your email</h1>
          <p className="text-mute text-sm mb-8">
            We sent a verification link to <span className="text-ink">{formData.email}</span>.
            Click it to activate your account, then sign in.
          </p>
          <Link href="/login" className="text-ink underline underline-offset-4">
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-serif text-ink mb-2">
            Create your account
          </h1>
          <p className="text-mute text-sm">
            Start your digital twin journey today
          </p>
        </div>

        {/* Signup Form */}
        <div className="bg-card border border-line rounded-2xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-ink mb-2"
              >
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-3 bg-bg border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-ink transition-all"
                placeholder="John Doe"
                required
              />
            </div>

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
                minLength={8}
              />
              <p className="mt-1 text-xs text-mute">
                Must be at least 8 characters
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-ink mb-2"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                className="w-full px-4 py-3 bg-bg border border-line rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-ink transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary justify-center mt-6"
            >
              {loading ? (
                <span className="lbl" data-t="Creating account...">
                  <span>Creating account...</span>
                </span>
              ) : (
                <span className="lbl" data-t="Create account">
                  <span>Create account</span>
                </span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-line"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-card text-mute">or</span>
            </div>
          </div>

          {/* Social Signup Buttons (Optional - uncomment when configured) */}
          {/* <div className="space-y-3">
            <button
              type="button"
              onClick={() => signIn("google")}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-line rounded-lg hover:bg-bg transition-colors"
            >
              <span className="text-ink">Continue with Google</span>
            </button>
            <button
              type="button"
              onClick={() => signIn("github")}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-line rounded-lg hover:bg-bg transition-colors"
            >
              <span className="text-ink">Continue with GitHub</span>
            </button>
          </div> */}

          {/* Login Link */}
          <div className="mt-6 text-center text-sm">
            <span className="text-mute">Already have an account? </span>
            <Link
              href="/login"
              className="text-ink font-medium hover:underline"
            >
              Sign in
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
