"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { loadCart, getCartCount, getCartSubtotal } from "@/src/store/cart";

// If you already have this helper, import it.
// If not, we’ll use a safe fallback inside this file.
import { getProductImageUrl } from "@/src/lib/catalog/image"; // <-- adjust if your path differs

type Props = {
  title?: string;
  showShippingNote?: boolean;
};

function formatMoney(amount: number, currency: string = "USD") {
  // simple currency formatting (Phase 2)
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

/** Fallback if helper is missing */
function safeImageUrl(url?: string | null) {
  if (url && url.trim().length > 0) return url;
  return "/images/product_placeholder.png";
}

export default function OrderSummary({
  title = "Order summary",
  showShippingNote = true,
}: Props) {
  const [version, setVersion] = useState(0);

  // Re-render when cart updates (your project already dispatches cart_updated)
  useEffect(() => {
    const onUpdate = () => setVersion((v) => v + 1);
    window.addEventListener("cart_updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("cart_updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  // Read cart on each version bump
  const cart = useMemo(() => loadCart(), [version]);
  const count = useMemo(() => getCartCount(cart), [cart]);
  const subtotal = useMemo(() => getCartSubtotal(cart), [cart]);

  // Phase 2: shipping fee 0 (simulated)
  const shippingFee = 0;
  const total = subtotal + shippingFee;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-[var(--text-main)]">
            {title}
          </div>
          <div className="ui-muted mt-1">
            {count} {count === 1 ? "item" : "items"}
          </div>
        </div>

        <span className="ui-badge">Phase 2</span>
      </div>

      <div className="ui-divider" />

      {/* Items */}
      {count === 0 ? (
        <div className="ui-muted">
          Your cart is empty. Please add products to continue.
        </div>
      ) : (
        <ul className="space-y-3">
          {cart.items.map((item) => {
            const qty = item.quantity ?? 1;
            const unit = Number(item.price ?? 0);
            const line = unit * qty;

            // Use helper if available; otherwise safe fallback.
            let img = safeImageUrl(item.image_url);
            try {
              // If helper exists and you imported it correctly:
              img = getProductImageUrl(item.image_url);
            } catch {
              // ignore if helper import path not correct
            }

            return (
              <li
                key={`${item.product_key}:${item.shade_key ?? "no-shade"}`}
                className="flex items-start gap-3"
              >
                {/* Image */}
                <div className="relative h-14 w-14 overflow-hidden rounded-xl border"
                  style={{ borderColor: "var(--border-soft)", background: "white" }}
                >
                  <Image
                    src={img}
                    alt={item.name ?? "Product image"}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[var(--text-main)] truncate">
                        {item.name ?? item.product_key}
                      </div>

                      <div className="ui-muted mt-0.5">
                        {item.brand ? item.brand : "—"}
                      </div>

                      {/* Shade */}
                      {item.shade_name ? (
                        <div className="text-xs mt-1 text-[var(--text-secondary)]">
                          Shade:{" "}
                          <span className="font-semibold">
                            {item.shade_name}
                          </span>
                        </div>
                      ) : null}

                      <div className="text-xs mt-1 text-[var(--text-muted)]">
                        Qty: <span className="font-semibold">{qty}</span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-sm font-semibold text-[var(--text-main)] whitespace-nowrap">
                      {formatMoney(line)}
                    </div>
                  </div>

                  {/* Unit price (subtle) */}
                  {unit > 0 ? (
                    <div className="ui-muted mt-1">
                      {formatMoney(unit)} each
                    </div>
                  ) : (
                    <div className="ui-muted mt-1">Price not available</div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="ui-divider" />

      {/* Totals */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--text-secondary)]">Subtotal</span>
          <span className="font-semibold text-[var(--text-main)]">
            {formatMoney(subtotal)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--text-secondary)]">Shipping</span>
          <span className="font-semibold text-[var(--text-main)]">
            {shippingFee === 0 ? "Free" : formatMoney(shippingFee)}
          </span>
        </div>

        <div
          className="flex items-center justify-between text-base pt-2"
          style={{ borderTop: "1px solid var(--border-soft)" }}
        >
          <span className="font-semibold text-[var(--text-main)]">Total</span>
          <span className="font-bold text-[var(--text-main)]">
            {formatMoney(total)}
          </span>
        </div>

        {showShippingNote ? (
          <p className="ui-helper">
            Shipping is free in Phase 2 (demo). Taxes are not applied.
          </p>
        ) : null}
      </div>
    </div>
  );
}
