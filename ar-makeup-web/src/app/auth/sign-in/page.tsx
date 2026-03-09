"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import AuthShell from "@/src/components/layout/AuthShell";
import { supabase } from "@/src/lib/supabase/client";

export default function SignInPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    // Supabase se login attempt
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    // Agar password galat hai ya koi aur error hai
    if (error) return setMsg(error.message);

    // Agar login successful hai, toh check karein ke kya yeh admin hai?
    if (data.user?.email === "admin@makeup.com") {
      router.push("/admin"); // Admin ko dashboard par bhejein
    } else {
      router.push(next); // Normal user ko uski manzil par bhejein
    }
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Access your saved looks and manage your cart."
    >
      <form onSubmit={onSubmit} className="space-y-5">
        {/* Email */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#2A2A2A]">
            Email
          </label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black outline-none placeholder:text-black/35 shadow-sm focus:border-[#C06C84]/50 focus:ring-4 focus:ring-[#F4C2C2]/35 !bg-white !text-black"
            required
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#2A2A2A]">
            Password
          </label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black outline-none placeholder:text-black/35 shadow-sm focus:border-[#C06C84]/50 focus:ring-4 focus:ring-[#F4C2C2]/35 !bg-white !text-black"
            required
          />
        </div>

        {/* Error */}
        {msg && (
          <div className="rounded-2xl border border-[#C06C84]/25 bg-[#F4C2C2]/25 px-4 py-3 text-sm text-[#2A2A2A]">
            {msg}
          </div>
        )}

        {/* Primary button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-[#C06C84] px-4 py-3 text-sm font-semibold text-white shadow-md shadow-[#C06C84]/15 transition hover:opacity-95 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        {/* Secondary actions */}
        <div className="flex items-center justify-between text-sm">
          <Link href="/" className="text-black/60 hover:text-[#C06C84] hover:underline">
            Back to home
          </Link>

          <Link
            href={`/auth/sign-up?next=${encodeURIComponent(next)}`}
            className="font-semibold text-[#C06C84] hover:underline"
          >
            Create account
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}