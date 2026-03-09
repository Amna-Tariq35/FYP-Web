"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ReceiptSummary from "@/src/components/checkout/ReceiptSummary";

type ReceiptResponse = { order: any; items: any[] };

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v.trim()
  );
}

export default function TrackOrderPage() {
  const router = useRouter();
  const params = useSearchParams();

  const initialToken = params.get("guest_token") || "";

  const [token, setToken] = useState(initialToken);
  const [receipt, setReceipt] = useState<ReceiptResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const shareLink = useMemo(() => {
    const t = token.trim();
    if (!t) return "";
    return `/order/track?guest_token=${encodeURIComponent(t)}`
;
  }, [token]);

  // Auto-load if token exists in URL
  useEffect(() => {
    if (initialToken) {
      void fetchReceipt(initialToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchReceipt(t: string) {
    const clean = t.trim();
    setError(null);
    setReceipt(null);

    if (!clean) {
      setError("Please enter your guest token.");
      return;
    }

    if (!isUuid(clean)) {
      setError("Token format looks invalid. Please paste the full guest token.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/orders/guest?guest_token=${encodeURIComponent(clean)}`
      );
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(
          data?.error ||
            "We couldn’t find an order for this token. Please double-check and try again."
        );
        setLoading(false);
        return;
      }

      setReceipt(data as ReceiptResponse);
      setLoading(false);
    } catch (e: any) {
      setError(e?.message || "Network error. Please try again.");
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Left: Input */}
          <div className="w-full lg:w-[44%]">
            <div className="ui-section p-6">
              <h1 className="text-2xl font-bold text-[var(--text-main)]">
                Track your order
              </h1>
              <p className="ui-muted mt-2">
                Paste your <span className="font-semibold">guest token</span> to view your receipt.
              </p>

              <div className="ui-divider" />

              <label className="ui-label" htmlFor="guest_token">
                Guest Token
              </label>
              <input
                id="guest_token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="e.g. 3f2d1c0b-...."
                className="ui-input mt-2"
                autoComplete="off"
                inputMode="text"
              />

              <p className="ui-helper mt-2">
                You can find this token on the checkout success page.
              </p>

              {/* Inline error */}
              {error ? (
                <div
                  className="mt-4 rounded-xl border p-4"
                  style={{
                    borderColor: "color-mix(in srgb, #FDA29B 55%, var(--border-soft))",
                    background: "color-mix(in srgb, #FDA29B 12%, white)",
                  }}
                  role="alert"
                >
                  <div className="text-sm font-semibold text-[var(--text-main)]">
                    Couldn’t load receipt
                  </div>
                  <div className="ui-muted mt-1">{error}</div>
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="ui-btn"
                  onClick={() => fetchReceipt(token)}
                  disabled={loading}
                >
                  {loading ? "Checking…" : "Track order"}
                </button>

                <button
                  type="button"
                  className="ui-btn-secondary"
                  onClick={() => router.push("/products")}
                  disabled={loading}
                >
                  Continue shopping
                </button>

                {receipt?.order && token.trim() ? (
                  <button
                    type="button"
                    className="ui-btn-ghost"
                    onClick={copyLink}
                  >
                    {copied ? "Link copied ✅" : "Copy share link"}
                  </button>
                ) : null}
              </div>

              {receipt?.order ? (
                <div className="mt-5">
                  <div className="text-sm font-semibold text-[var(--text-main)]">
                    Status
                  </div>
                  <div className="mt-2">
                    <span className="ui-chip">
                      {String(receipt.order.status || "placed")}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Right: Receipt */}
          <div className="w-full lg:w-[56%]">
            <div className="ui-section p-6">
              {!receipt?.order ? (
                <div>
                  <h2 className="text-sm font-semibold text-[var(--text-main)]">
                    Receipt
                  </h2>
                  <p className="ui-muted mt-2">
                    Your receipt will appear here after you enter a valid token.
                  </p>

                  <div className="ui-divider" />

                  <div className="ui-muted">
                    Tip: On the success page, you can copy the token and open this page directly.
                  </div>
                </div>
              ) : (
                <ReceiptSummary order={receipt.order} items={receipt.items || []} />
              )}
            </div>

            <div className="mt-4 text-xs text-[var(--text-muted)]">
              Guest orders are not shown in “My Orders”. Tracking is done using your token link.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
