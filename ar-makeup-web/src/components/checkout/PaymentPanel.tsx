"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { loadShippingInfo } from "@/src/store/checkoutShipping";
import type { ShippingInfo } from "@/src//types/order";
import { loadCart, type CartState } from "@/src//store/cart";

function isShippingComplete(s: ShippingInfo) {
  return (
    !!s.name?.trim() &&
    !!s.phone?.trim() &&
    !!s.address?.trim() &&
    !!s.city?.trim() &&
    !!s.country?.trim()
  );
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function PaymentPanel() {
  const router = useRouter();
  const [shipping, setShipping] = useState<ShippingInfo>(() =>
    loadShippingInfo(),
  );

  const [selectedMethod, setSelectedMethod] = useState<"cod" | "card">("cod");

  const [isPlacing, setIsPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate shipping presence
  useEffect(() => {
    const s = loadShippingInfo();
    setShipping(s);

    if (!isShippingComplete(s)) {
      router.replace("/checkout/shipping");
    }
  }, [router]);

  const shippingLine = useMemo(() => {
    const parts = [shipping.address, shipping.city, shipping.country].filter(
      Boolean,
    );
    return parts.join(", ");
  }, [shipping.address, shipping.city, shipping.country]);

  async function placeOrder() {
    setError(null);
    setIsPlacing(true);

    try {
      // 1) Read latest cart + shipping
      const currentCart: CartState = loadCart();
      const items = currentCart.items || [];

      const currentShipping = loadShippingInfo();

      // 2) Basic guards (even though CheckoutGuard exists)
      if (!items.length) {
        setError("Your cart is empty. Please add items before checkout.");
        router.replace("/cart");
        return;
      }

      if (!isShippingComplete(currentShipping)) {
        setError(
          "Shipping details are incomplete. Please fill shipping first.",
        );
        router.replace("/checkout/shipping");
        return;
      }

      // 3) Guest policy note:
      // If your RLS requires guest_email for guest inserts, and user is not logged in,
      // missing email will fail on the API with RLS error.
      // We can pre-validate: if email provided, validate format; if not, we still allow attempt (demo choice)
      if (currentShipping.email?.trim()) {
        if (!isValidEmail(currentShipping.email)) {
          setError("Please enter a valid email address (or clear it).");
          setIsPlacing(false);
          return;
        }
      }

      // 4) Prepare payload (match CreateOrderPayload)
      const payload = {
        shipping: currentShipping,
        items: items.map((it) => ({
          product_key: it.product_key,
          shade_key: it.shade_key ?? null,
          quantity: it.quantity,
          name: it.name,
          brand: it.brand,
          shade_name: it.shade_name,
          price: it.price,
          image_url: it.image_url,
        })),
        // Payment method is not stored yet (Phase 2),
        // but we keep it here for future extension.
        // method: selectedMethod,
      };

      // 5) Call API to create the order record first
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          data?.error ||
          data?.details ||
          "Something went wrong while creating your order. Please try again.";
        setError(msg);
        setIsPlacing(false);
        return;
      }

      const orderId: string | undefined = data?.order_id;
      const guestToken: string | undefined = data?.guest_token;

      if (!orderId && !guestToken) {
        setError("Order created, but no reference returned. Please try again.");
        setIsPlacing(false);
        return;
      }

      // If user intends to pay by card, send them to Stripe checkout
      if (selectedMethod === "card") {
        if (!orderId) {
          setError("Unable to determine order ID for Stripe checkout.");
          setIsPlacing(false);
          return;
        }

        const stripeResp = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items, orderId }),
        });

        const stripeData = await stripeResp.json().catch(() => ({}));
        if (!stripeResp.ok) {
          const msg =
            stripeData?.error ||
            "Failed to create Stripe checkout session. Please try again.";
          setError(msg);
          setIsPlacing(false);
          return;
        }

        // NAYA TAREEQA: Seedha URL par redirect karein
        if (stripeData.url) {
          window.location.href = stripeData.url;
        } else {
          setError("Stripe session URL not found. Please try again.");
          setIsPlacing(false);
        }
        
        return;
      }

      // default / cod flow: clear local state and navigate to success
      try {
        localStorage.removeItem("ar_cart_v1");
        localStorage.removeItem("ar_shipping_v1");
      } catch {}

      if (guestToken) {
        router.replace(
          `/checkout/success?guest_token=${encodeURIComponent(guestToken)}`,
        );
        return;
      }

      router.replace(
        `/checkout/success?order_id=${encodeURIComponent(orderId!)}`,
      );
    } catch (e: any) {
      setError(e?.message || "Network error. Please try again.");
    } finally {
      setIsPlacing(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="ui-h2">Payment</h2>
        <p className="ui-muted mt-1">
          Choose your preferred payment method to complete the order.
        </p>
      </div>

      {/* Inline error (professional) */}
      {error ? (
        <div
          className="ui-section p-4"
          style={{
            borderColor: "color-mix(in srgb, #FDA29B 55%, var(--border-soft))",
            background: "color-mix(in srgb, #FDA29B 12%, white)",
          }}
          role="alert"
        >
          <div className="text-sm font-semibold text-[var(--text-main)]">
            Couldn’t place order
          </div>
          <div className="ui-muted mt-1">{error}</div>
        </div>
      ) : null}

      {/* Shipping preview */}
      <div className="ui-section p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-[var(--text-main)]">
            Delivering to
          </div>
          <button
            type="button"
            className="ui-btn-ghost"
            onClick={() => router.push("/checkout/shipping")}
            disabled={isPlacing}
          >
            Edit
          </button>
        </div>

        <div className="mt-3 space-y-1 text-sm">
          <div className="text-[var(--text-main)] font-semibold">
            {shipping.name || "—"}
          </div>
          <div className="text-[var(--text-secondary)]">
            {shipping.phone || "—"}
          </div>
          <div className="text-[var(--text-secondary)]">
            {shippingLine || "—"}
          </div>

          {shipping.email?.trim() ? (
            <div className="text-[var(--text-muted)]">
              Email: {shipping.email}
            </div>
          ) : (
            <div className="text-[var(--text-muted)]">
              Email: <span className="italic">not provided</span>
            </div>
          )}
        </div>

        {!shipping.email?.trim() ? (
          <p className="ui-helper mt-3">
            Tip: Adding an email helps with guest checkout tracking.
          </p>
        ) : null}
      </div>

      {/* Payment method */}
      <div className="ui-section p-4">
        <div className="text-sm font-semibold text-[var(--text-main)]">
          Payment method
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            className={[
              "ui-btn-secondary justify-start",
              selectedMethod === "card"
                ? "ring-2 ring-[var(--rose-primary)]"
                : "",
            ].join(" ")}
            onClick={() => setSelectedMethod("card")}
            disabled={isPlacing}
          >
            <span
              className="h-3 w-3 rounded-full"
              style={{ background: "var(--rose-primary)" }}
              aria-hidden="true"
            />
            Card (Stripe)
          </button>

          <button
            type="button"
            className={[
              "ui-btn-secondary justify-start",
              selectedMethod === "cod"
                ? "ring-2 ring-[var(--rose-primary)]"
                : "",
            ].join(" ")}
            onClick={() => setSelectedMethod("cod")}
            disabled={isPlacing}
          >
            <span
              className="h-3 w-3 rounded-full"
              style={{
                background: "color-mix(in srgb, var(--rose-soft) 65%, white)",
              }}
              aria-hidden="true"
            />
            Cash on Delivery
          </button>
        </div>
      </div>

      <div className="ui-divider" />

      {/* Actions */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          className="ui-btn-secondary"
          onClick={() => router.push("/checkout/shipping")}
          disabled={isPlacing}
        >
          Back
        </button>

        <button
          type="button"
          className="ui-btn"
          onClick={placeOrder}
          disabled={isPlacing}
        >
          {isPlacing ? "Processing…" : "Place order"}
        </button>
      </div>

      <p className="ui-muted">
        After placing the order, you’ll see a confirmation screen and your cart
        will be cleared.
      </p>
    </div>
  );
}