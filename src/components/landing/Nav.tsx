"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { cx } from "@/lib/motion";
import { useAuth } from "@/hooks/useAuth";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#fit", label: "Fit" },
  { href: "#garments", label: "Garments" },
];

/** Fixed nav that hides while scrolling down, plus a thin scroll-progress bar. */
export function Nav() {
  const [hidden, setHidden] = useState(false);
  const [progress, setProgress] = useState(0);
  const lastY = useRef(0);
  const { isAuthenticated, user, isLoading } = useAuth();

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? (y / max) * 100 : 0);
      setHidden(y > lastY.current && y > 200);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <>
      <div className="fixed left-0 top-0 z-[60] h-0.5 bg-ink" style={{ width: `${progress}%` }} />
      <nav
        className={cx(
          "fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-line bg-bg px-[var(--pad)]",
          "transition-transform duration-500 ease-smooth",
          hidden && "-translate-y-full",
        )}
      >
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <i className="logo-dot" />
          Digital Twins
        </Link>
        <div className="hidden gap-7 text-sm text-mute md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="nav-link">
              {l.label}
            </a>
          ))}
          <Link href="/shop" className="nav-link">
            Shop
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {!isLoading && (
            <>
              {isAuthenticated ? (
                <>
                  <span className="hidden text-sm text-mute md:inline">
                    {user?.name}
                  </span>
                  <Button href="/profile" variant="ghost" size="sm">
                    Profile
                  </Button>
                  <Button href="/create-avatar" variant="primary" size="sm">
                    Create avatar
                  </Button>
                  <Button onClick={handleSignOut} variant="ghost" size="sm">
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Button href="/login" variant="ghost" size="sm">
                    Sign in
                  </Button>
                  <Button href="/signup" variant="primary" size="sm">
                    Sign up
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </nav>
    </>
  );
}
