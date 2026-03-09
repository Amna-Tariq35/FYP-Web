"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ReceiptSummary from "@/src/components/checkout/ReceiptSummary";

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function statusLabel(status: string) {
  const s = (status || "").toLowerCase();
  if (s === "paid") return "Paid";
  if (s === "failed") return "Failed";
  if (s === "cancelled") return "Cancelled";
  if (s === "draft") return "Draft";
  return "Placed";
}

function statusBadgeClass(status: string) {
  const s = (status || "").toLowerCase();
  if (s === "paid") return "ui-badge-success";
  if (s === "failed") return "ui-badge-danger";
  if (s === "cancelled") return "ui-badge-muted";
  return "ui-badge";
}

type ReceiptResponse = { order: any; items: any[] };

export default function OrderDetailClient({ orderId }: { orderId: string }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [receipt, setReceipt] = useState<ReceiptResponse | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  async function loadReceipt() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`);
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        router.replace(`/auth/sign-in?next=/my-orders/${encodeURIComponent(orderId)}`);
        return;
      }

      if (!res.ok) {
        setError(data?.error || "Failed to load order.");
        setLoading(false);
        return;
      }

      setReceipt(data as ReceiptResponse);
      setLoading(false);
    } catch (e: any) {
      setError(e?.message || "Network error.");
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReceipt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const status = useMemo(() => {
    return String(receipt?.order?.status || "");
  }, [receipt]);

  const canCancel = useMemo(() => {
    return String(status).toLowerCase() === "placed";
  }, [status]);

  async function onCancelOrder() {
    setCancelError(null);

    const ok = window.confirm(
      "Cancel this order?\n\nThis will set the status to Cancelled."
    );
    if (!ok) return;

    setCancelLoading(true);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setCancelError(data?.error || "Failed to cancel order.");
        setCancelLoading(false);
        return;
      }

      // Update local state (keep items same)
      setReceipt((prev) => {
        if (!prev) return prev;
        return { ...prev, order: data.order };
      });

      setCancelLoading(false);
    } catch (e: any) {
      setCancelError(e?.message || "Network error.");
      setCancelLoading(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <button className="ui-btn-ghost w-fit" onClick={() => router.push("/my-orders")}>
            ← Back to My Orders
          </button>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-main)]">Order details</h1>
              <p className="text-sm text-[var(--text-muted)]">
                Order ID: <span className="font-mono">{orderId}</span>
              </p>
            </div>

            {receipt?.order ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className={statusBadgeClass(status)}>
                  {statusLabel(status)}
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  {formatDate(receipt.order.created_at)}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="ui-section p-6">
              <div className="text-sm text-[var(--text-muted)]">Loading order…</div>
            </div>
          ) : error ? (
            <div className="ui-section p-6">
              <div className="text-sm font-semibold text-[var(--text-main)]">
                Couldn’t load order
              </div>
              <div className="text-sm text-[var(--text-muted)] mt-2">{error}</div>
              <div className="mt-4 flex gap-3">
                <button className="ui-btn" onClick={loadReceipt}>
                  Retry
                </button>
                <button className="ui-btn-secondary" onClick={() => router.push("/products")}>
                  Continue shopping
                </button>
              </div>
            </div>
          ) : receipt?.order ? (
            <div className="grid gap-4 lg:grid-cols-12">
              {/* Left: actions + meta */}
              <div className="lg:col-span-5 space-y-4">
                <div className="ui-section p-6">
                  <div className="text-sm font-semibold text-[var(--text-main)]">Actions</div>
                  <div className="ui-divider" />

                  {cancelError ? (
                    <div
                      className="rounded-xl border p-4"
                      style={{
                        borderColor: "color-mix(in srgb, #FDA29B 55%, var(--border-soft))",
                        background: "color-mix(in srgb, #FDA29B 12%, white)",
                      }}
                    >
                      <div className="text-sm font-semibold text-[var(--text-main)]">
                        Cancel failed
                      </div>
                      <div className="text-sm text-[var(--text-muted)] mt-1">
                        {cancelError}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-3">
                    {canCancel ? (
                      <button
                        className="ui-btn"
                        onClick={onCancelOrder}
                        disabled={cancelLoading}
                      >
                        {cancelLoading ? "Cancelling…" : "Cancel order"}
                      </button>
                    ) : (
                      <span className="text-sm text-[var(--text-muted)]">
                        Cancellation is only available for <b>placed</b> orders.
                      </span>
                    )}

                    <button
                      className="ui-btn-secondary"
                      onClick={() => router.push("/products")}
                    >
                      Continue shopping
                    </button>
                  </div>
                </div>

                <div className="ui-section p-6">
                  <div className="text-sm font-semibold text-[var(--text-main)]">
                    Order summary
                  </div>
                  <div className="ui-divider" />
                  <div className="text-sm text-[var(--text-secondary)] space-y-2">
                    <div>
                      <span className="text-[var(--text-muted)]">Status:</span>{" "}
                      <span className="font-semibold text-[var(--text-main)]">
                        {statusLabel(status)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)]">Created:</span>{" "}
                      <span className="font-semibold text-[var(--text-main)]">
                        {formatDate(receipt.order.created_at)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)]">Shipping to:</span>{" "}
                      <span className="font-semibold text-[var(--text-main)]">
                        {receipt.order.shipping_name}
                      </span>{" "}
                      {receipt.order.shipping_city ? `• ${receipt.order.shipping_city}` : ""}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: receipt */}
              <div className="lg:col-span-7">
                <div className="ui-section p-6">
                  <ReceiptSummary order={receipt.order} items={receipt.items || []} />
                </div>
              </div>
            </div>
          ) : (
            <div className="ui-section p-6">
              <div className="text-sm text-[var(--text-muted)]">Order not found.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
