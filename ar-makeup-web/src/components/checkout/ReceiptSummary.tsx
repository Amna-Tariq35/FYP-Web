"use client";

import React from "react";
import Image from "next/image";

const FALLBACK_IMAGE = "/images/product_placeholder.png";

function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    amount || 0
  );
}

type ReceiptItem = {
  id: string;
  product_key: string;
  shade_key: string | null;
  shade_name: string | null;
  name: string;
  brand: string | null;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
};

type ReceiptOrder = {
  id: string;
  status: string;
  currency: string;
  subtotal: number;
  shipping_fee: number;
  total: number;
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_country: string;
  created_at: string;
  guest_token?: string | null;
  guest_email?: string | null;
};

export default function ReceiptSummary({
  order,
  items,
  title = "Receipt",
}: {
  order: ReceiptOrder;
  items: ReceiptItem[];
  title?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[var(--text-main)]">{title}</h3>
        <span className="ui-badge">{items?.length || 0} items</span>
      </div>

      <div className="ui-divider" />

      {/* Items */}
      <div className="space-y-4">
        {items.map((it) => {
          const img = it.image_url || FALLBACK_IMAGE;
          return (
            <div
              key={it.id}
              className="flex items-start gap-3"
            >
              <div
                className="relative h-14 w-14 overflow-hidden rounded-xl border"
                style={{ borderColor: "var(--border-soft)", background: "white" }}
              >
                <Image
                  src={img}
                  alt={it.name}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[var(--text-main)] truncate">
                      {it.name}
                    </div>
                    {it.brand ? (
                      <div className="text-xs text-[var(--text-muted)] truncate">
                        {it.brand}
                      </div>
                    ) : null}
                  </div>

                  <div className="text-sm font-semibold text-[var(--text-main)] whitespace-nowrap">
                    {formatMoney(it.line_total, order.currency)}
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {it.shade_name ? <span className="ui-chip">Shade: {it.shade_name}</span> : null}
                  <span className="ui-chip">Qty: {it.quantity}</span>
                  <span className="ui-chip">
                    Unit: {formatMoney(it.unit_price, order.currency)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="ui-divider" />

      {/* Totals */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-[var(--text-muted)]">Subtotal</span>
          <span className="font-semibold text-[var(--text-main)]">
            {formatMoney(order.subtotal, order.currency)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[var(--text-muted)]">Shipping</span>
          <span className="font-semibold text-[var(--text-main)]">
            {order.shipping_fee > 0
              ? formatMoney(order.shipping_fee, order.currency)
              : "Free"}
          </span>
        </div>

        <div className="ui-divider" />

        <div className="flex items-center justify-between">
          <span className="text-[var(--text-main)] font-semibold">Total</span>
          <span className="text-[var(--text-main)] font-bold">
            {formatMoney(order.total, order.currency)}
          </span>
        </div>
      </div>

      <div className="ui-divider" />

      {/* Shipping preview */}
      <div className="text-sm">
        <div className="font-semibold text-[var(--text-main)]">Shipping</div>
        <div className="mt-2 space-y-1 text-[var(--text-secondary)]">
          <div className="font-semibold text-[var(--text-main)]">
            {order.shipping_name}
          </div>
          <div>{order.shipping_phone}</div>
          <div>
            {[order.shipping_address, order.shipping_city, order.shipping_country]
              .filter(Boolean)
              .join(", ")}
          </div>
        </div>
      </div>
    </div>
  );
}
