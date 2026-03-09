"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CheckoutShell from "@/src/components/checkout/CheckoutShell";
import { clearCart } from "@/src/store/cart";
import { clearShippingInfo } from "@/src/store/checkoutShipping";
import ReceiptSummary from "@/src/components/checkout/ReceiptSummary";

function shortRef(id?: string | null) {
  if (!id) return "";
  return id.length > 12 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
}

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const params = useSearchParams();

  const orderId = params.get("order_id");
  const guestToken = params.get("guest_token");
  const sessionId = params.get("session_id"); // Stripe session ID

  const [receipt, setReceipt] = useState<{ order: any; items: any[] } | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(true);
  const [copied, setCopied] = useState(false);

  // Payment verification state
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "verifying" | "paid" | "failed">("idle");

  const refLabel = useMemo(() => {
    if (orderId) return { label: "Order ID", value: orderId };
    if (guestToken) return { label: "Guest Token", value: guestToken };
    return { label: "Reference", value: "" };
  }, [orderId, guestToken]);

  // 1. Verify Stripe Payment (If session_id exists)
  useEffect(() => {
    if (sessionId && orderId) {
      setPaymentStatus("verifying");
      fetch("/api/checkout/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, order_id: orderId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setPaymentStatus("paid");
          } else {
            setPaymentStatus("failed");
          }
        })
        .catch(() => setPaymentStatus("failed"));
    }
  }, [sessionId, orderId]);

  // 2. Load Receipt Data
  useEffect(() => {
    async function loadReceipt() {
      setLoadingReceipt(true);
      try {
        if (guestToken) {
          const res = await fetch(`/api/orders/guest?guest_token=${encodeURIComponent(guestToken)}`);
          const data = await res.json();
          if (res.ok) setReceipt(data);
          return;
        }
        if (orderId) {
          const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`);
          const data = await res.json();
          if (res.ok) setReceipt(data);
          return;
        }
      } finally {
        setLoadingReceipt(false);
      }
    }
    loadReceipt();
  }, [orderId, guestToken]);

  // 3. Cleanup Cart & Shipping (Once)
  useEffect(() => {
    const key = `ar_makeup_checkout_success_cleaned_v1:${orderId || guestToken || "unknown"}`;
    const already = sessionStorage.getItem(key);

    if (!already) {
      clearCart();
      clearShippingInfo();
      sessionStorage.setItem(key, "1");
    }
  }, [orderId, guestToken]);

  // 4. Redirect if no reference
  useEffect(() => {
    if (!orderId && !guestToken) {
      router.replace("/cart");
    }
  }, [orderId, guestToken, router]);

  async function copyRef() {
    if (!refLabel.value) return;
    try {
      await navigator.clipboard.writeText(refLabel.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  }

  return (
    <CheckoutShell
      step="success"
      title="Checkout"
      subtitle="Your order has been placed successfully."
      left={
        <div className="space-y-5">
          <div className="ui-section p-5">
            <h2 className="ui-h2">
              {paymentStatus === "verifying" ? "Verifying Payment ⏳" : 
               paymentStatus === "failed" ? "Payment Failed ❌" : 
               "Order placed 🎉"}
            </h2>
            
            <p className="ui-muted mt-1">
              {paymentStatus === "verifying" 
                ? "Please wait while we confirm your payment with Stripe..." 
                : paymentStatus === "failed"
                ? "There was an issue verifying your payment. Your order is saved as 'Failed'."
                : "We’ve saved your order. You can continue shopping anytime."}
            </p>

            <div className="ui-divider" />

            <div className="space-y-2">
              <div className="text-sm font-semibold text-[var(--text-main)]">
                {refLabel.label}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="ui-chip">{shortRef(refLabel.value)}</span>

                <button type="button" className="ui-btn-ghost" onClick={copyRef}>
                  {copied ? "Copied ✅" : "Copy"}
                </button>
              </div>

              {guestToken ? (
                <p className="ui-helper mt-2">
                  Save this token to track your guest order later.
                </p>
              ) : null}
            </div>

            <div className="ui-divider" />

            <div className="flex flex-wrap gap-3">
              <button type="button" className="ui-btn" onClick={() => router.push("/products")}>
                Continue shopping
              </button>

              {guestToken ? (
                <button
                  type="button"
                  className="ui-btn-secondary"
                  onClick={() => router.push(`/order/track?guest_token=${encodeURIComponent(guestToken)}`)}
                >
                  Track order (guest)
                </button>
              ) : (
                <button
                  type="button"
                  className="ui-btn-secondary"
                  onClick={() => router.push("/my-orders")}
                >
                  View My Orders
                </button>
              )}
            </div>
          </div>

          <div className="ui-section p-5">
            <div className="text-sm font-semibold text-[var(--text-main)]">
              Order Status
            </div>
            <ul className="mt-2 space-y-2 text-sm text-[var(--text-secondary)]">
              {sessionId ? (
                <li>
                  • Payment Status:{" "}
                  <span className="font-semibold capitalize">
                    {paymentStatus === "idle" ? "Paid" : paymentStatus}
                  </span>
                </li>
              ) : (
                <li>
                  • Payment Status: <span className="font-semibold">Cash on Delivery (Placed)</span>
                </li>
              )}
              <li>• You can track or cancel this order from the "My Orders" page.</li>
            </ul>
          </div>
        </div>
      }
      right={
        <div>
          {loadingReceipt ? (
            <div className="ui-muted">Loading receipt…</div>
          ) : receipt?.order ? (
            <ReceiptSummary order={receipt.order} items={receipt.items || []} />
          ) : (
            <div className="ui-muted">Receipt not available.</div>
          )}
        </div>
      }
    />
  );
}