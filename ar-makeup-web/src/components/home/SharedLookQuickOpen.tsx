"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function extractLookId(input: string) {
  const value = input.trim();
  try {
    const url = new URL(value);
    const parts = url.pathname.split("/").filter(Boolean);
    const looksIndex = parts.indexOf("looks");
    if (looksIndex !== -1 && parts[looksIndex + 1]) return parts[looksIndex + 1];
  } catch {}
  return value || null;
}

export default function SharedLookQuickOpen() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onOpen() {
    const id = extractLookId(text);
    if (!id) {
      setError("Paste a valid shared link or look ID.");
      return;
    }
    setError(null);
    router.push(`/looks/${id}`);
  }

  return (
    <section className="mt-12 rounded-[22px] border border-black/10 bg-white/60 p-6 backdrop-blur sm:p-8">
      <h3 className="text-lg font-semibold text-[#141414]">Open a shared look</h3>
      <p className="mt-1 text-sm text-black/60">
        Paste a link from mobile (or a look ID) to view the look details.
      </p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste: https://your-site.com/looks/xxxxx"
          className="w-full rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm text-[#141414] placeholder:text-black/35 outline-none focus:border-[#B65C7A]/50"
        />
        <button
          type="button"
          onClick={onOpen}
          className="rounded-2xl bg-[#B65C7A] px-5 py-3 text-sm font-semibold text-white hover:bg-[#A94E6C]"
        >
          Open
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-[#B65C7A]">{error}</p>}
    </section>
  );
}
