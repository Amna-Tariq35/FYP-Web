"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    amount || 0
  );
}

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

// Updated Status Labels
function statusLabel(status: string) {
  const s = (status || "").toLowerCase();
  if (s === "paid") return "Paid";
  if (s === "processing") return "Processing"; // Added
  if (s === "shipped") return "Shipped";       // Added
  if (s === "delivered") return "Delivered";   // Added
  if (s === "failed") return "Failed";
  if (s === "cancelled") return "Cancelled";
  if (s === "draft") return "Draft";
  return "Placed";
}

// Updated Status Badge Colors
function statusBadgeClass(status: string) {
  const s = (status || "").toLowerCase();
  if (s === "paid") return "ui-badge-success"; // Green
  if (s === "processing") return "bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium"; // Yellow
  if (s === "shipped") return "bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium";       // Blue
  if (s === "delivered") return "bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium"; // Purple
  if (s === "failed") return "ui-badge-danger"; // Red
  if (s === "cancelled") return "ui-badge-muted"; // Gray
  return "ui-badge"; // Default (Placed)
}

type OrderRow = {
  id: string;
  status: string;
  currency: string;
  total: number;
  subtotal: number;
  shipping_fee: number;
  created_at: string;
  shipping_name: string;
  shipping_city: string;
};

type OrdersResponse = {
  orders: OrderRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export default function MyOrdersClient() {
  const router = useRouter();

  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OrdersResponse | null>(null);

  const pageSize = 10;

  const queryString = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("page", String(page));
    sp.set("pageSize", String(pageSize));
    if (status) sp.set("status", status);
    return sp.toString();
  }, [page, status]);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders?${queryString}`);
      const json = await res.json().catch(() => ({}));

      if (res.status === 401) {
        router.replace("/auth/sign-in?next=/my-orders");
        return;
      }

      if (!res.ok) {
        setError(json?.error || "Failed to load orders.");
        setLoading(false);
        return;
      }

      setData(json as OrdersResponse);
      setLoading(false);
    } catch (e: any) {
      setError(e?.message || "Network error.");
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  const orders = data?.orders || [];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-[var(--text-main)]">My Orders</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Track your makeup orders from placement to delivery.
          </p>
        </div>

        <div className="mt-6 ui-section p-5">
          {/* Toolbar with Scrollable Filters for Mobile */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex overflow-x-auto pb-2 sm:pb-0 items-center gap-2 hide-scrollbar">
              <button
                type="button"
                className={status === "" ? "ui-chip-active whitespace-nowrap" : "ui-chip whitespace-nowrap"}
                onClick={() => { setPage(1); setStatus(""); }}
              >
                All
              </button>
              <button
                type="button"
                className={status === "placed" ? "ui-chip-active whitespace-nowrap" : "ui-chip whitespace-nowrap"}
                onClick={() => { setPage(1); setStatus("placed"); }}
              >
                Placed
              </button>
              <button
                type="button"
                className={status === "paid" ? "ui-chip-active whitespace-nowrap" : "ui-chip whitespace-nowrap"}
                onClick={() => { setPage(1); setStatus("paid"); }}
              >
                Paid
              </button>
              <button
                type="button"
                className={status === "processing" ? "ui-chip-active whitespace-nowrap" : "ui-chip whitespace-nowrap"}
                onClick={() => { setPage(1); setStatus("processing"); }}
              >
                Processing
              </button>
              <button
                type="button"
                className={status === "shipped" ? "ui-chip-active whitespace-nowrap" : "ui-chip whitespace-nowrap"}
                onClick={() => { setPage(1); setStatus("shipped"); }}
              >
                Shipped
              </button>
              <button
                type="button"
                className={status === "delivered" ? "ui-chip-active whitespace-nowrap" : "ui-chip whitespace-nowrap"}
                onClick={() => { setPage(1); setStatus("delivered"); }}
              >
                Delivered
              </button>
              <button
                type="button"
                className={status === "failed" ? "ui-chip-active whitespace-nowrap" : "ui-chip whitespace-nowrap"}
                onClick={() => { setPage(1); setStatus("failed"); }}
              >
                Failed
              </button>
              <button
                type="button"
                className={status === "cancelled" ? "ui-chip-active whitespace-nowrap" : "ui-chip whitespace-nowrap"}
                onClick={() => { setPage(1); setStatus("cancelled"); }}
              >
                Cancelled
              </button>
            </div>

            <button
              type="button"
              className="ui-btn-secondary whitespace-nowrap"
              onClick={() => router.push("/products")}
            >
              Continue shopping
            </button>
          </div>

          <div className="ui-divider mt-2" />

          {/* States */}
          {loading ? (
            <div className="text-sm text-[var(--text-muted)] py-8 text-center">Loading your orders…</div>
          ) : error ? (
            <div
              className="rounded-xl border p-4"
              style={{
                borderColor: "color-mix(in srgb, #FDA29B 55%, var(--border-soft))",
                background: "color-mix(in srgb, #FDA29B 12%, white)",
              }}
            >
              <div className="text-sm font-semibold text-[var(--text-main)]">
                Couldn’t load orders
              </div>
              <div className="text-sm text-[var(--text-muted)] mt-1">{error}</div>
              <div className="mt-3">
                <button className="ui-btn" onClick={load}>
                  Retry
                </button>
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-10 text-center">
              <div className="text-sm font-semibold text-[var(--text-main)]">
                No orders found
              </div>
              <div className="mt-2 text-sm text-[var(--text-muted)]">
                {status === "" 
                  ? "Once you place an order, it will appear here." 
                  : `You don't have any orders with status '${status}'.`}
              </div>
              <div className="mt-5">
                <button className="ui-btn" onClick={() => router.push("/products")}>
                  Browse products
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <div
                  key={o.id}
                  className="rounded-2xl border p-4 sm:p-5 hover:border-gray-300 transition-colors"
                  style={{ borderColor: "var(--border-soft)", background: "white" }}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={statusBadgeClass(o.status)}>
                          {statusLabel(o.status)}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">
                          {formatDate(o.created_at)}
                        </span>
                      </div>

                      <div className="mt-2 text-sm text-[var(--text-secondary)]">
                        <span className="font-semibold text-[var(--text-main)]">Ship to:</span>{" "}
                        {o.shipping_name}
                        {o.shipping_city ? ` • ${o.shipping_city}` : ""}
                      </div>

                      <div className="mt-2 text-xs text-[var(--text-muted)]">
                        Order ID: <span className="font-mono">{o.id}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      <div className="text-lg font-bold text-[var(--text-main)]">
                        {formatMoney(o.total, o.currency)}
                      </div>

                      <button
                        type="button"
                        className="ui-btn-ghost text-[#C06C84] hover:bg-[#F4C2C2] hover:text-[#C06C84]"
                        onClick={() => router.push(`/my-orders/${o.id}`)}
                      >
                        View details →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && data && data.totalPages > 1 ? (
            <div className="mt-6 flex items-center justify-between">
              <button
                className="ui-btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>

              <div className="text-sm text-[var(--text-muted)]">
                Page <span className="font-semibold text-[var(--text-main)]">{data.page}</span>{" "}
                of <span className="font-semibold text-[var(--text-main)]">{data.totalPages}</span>
              </div>

              <button
                className="ui-btn-secondary"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          ) : null}
        </div>
      </div>
      
      {/* CSS for hiding scrollbar on mobile filters */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}