"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import AuthShell from "@/src/components/layout/AuthShell";
import { supabase } from "@/src/lib/supabase/client";

export default function SignUpPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/`
            : undefined,
      },
    });

    setLoading(false);

    if (error) return setMsg(error.message);
    setSuccess(true);
  }

  return (
    <AuthShell
      title="Create account"
      subtitle="Sign up to save looks and continue checkout anytime."
    >
      {!success ? (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-black/70">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="mt-1 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black outline-none placeholder:text-black/35 focus:border-[#C06C84]/40 focus:ring-4 focus:ring-[#F4C2C2]/30"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-black/70">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
              placeholder="Create a strong password"
              className="mt-1 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black outline-none placeholder:text-black/35 focus:border-[#C06C84]/40 focus:ring-4 focus:ring-[#F4C2C2]/30"
              required
            />
            <p className="mt-2 text-xs text-black/50">
              Use at least 8 characters.
            </p>
          </div>

          {msg && (
            <div className="rounded-2xl border border-[#C06C84]/25 bg-[#F4C2C2]/25 px-4 py-3 text-sm text-black/70">
              {msg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[#C06C84] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create account"}
          </button>

          <div className="flex items-center justify-between text-xs text-black/55">
            <Link href="/" className="hover:text-[#C06C84] hover:underline">
              Back to home
            </Link>

            <Link
              href={`/auth/sign-in?next=${encodeURIComponent(next)}`}
              className="font-medium text-[#C06C84] hover:underline"
            >
              Sign in
            </Link>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-4 text-sm text-black/70">
            ✅ Account created. Please check your email for a confirmation link.
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(`/auth/sign-in?next=${encodeURIComponent(next)}`)
            }
            className="w-full rounded-2xl bg-[#C06C84] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
          >
            Continue to Sign in
          </button>

          <p className="text-xs text-black/50">
            If you don’t see the email, check Spam/Promotions. Sometimes it can
            take a minute.
          </p>
        </div>
      )}
    </AuthShell>
  );
}
