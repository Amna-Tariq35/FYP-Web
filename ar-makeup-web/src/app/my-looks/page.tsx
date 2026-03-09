"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase/client";

export default function MyLooksPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace(`/auth/sign-in?next=${encodeURIComponent("/my-looks")}`);

        return;
      }
      setChecking(false);
    });
  }, [router]);

  if (checking) return <div className="text-white/70">Checking session...</div>;

  return <div className="text-white/80">My Looks (Coming soon)</div>;
}
