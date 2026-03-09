"use client";

import { useMemo, useState } from "react";
import { MakeupProduct, ProductShade } from "@/src/types/catalog";
import { addToCart } from "@/src/store/cart";

type Props = {
  product: MakeupProduct;
  shades: ProductShade[];
};

function safeHex(hex: string | null) {
  if (!hex) return null;
  const h = hex.trim();
  // allow "#RRGGBB" or "RRGGBB"
  if (/^#?[0-9A-Fa-f]{6}$/.test(h)) return h.startsWith("#") ? h : `#${h}`;
  return null;
}

export default function AddToCartPanel({ product, shades }: Props) {
  const [selectedShadeKey, setSelectedShadeKey] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const hasShades = shades.length > 0;

  const selectedShade = useMemo(() => {
    if (!selectedShadeKey) return null;
    return shades.find((s) => s.shade_key === selectedShadeKey) || null;
  }, [selectedShadeKey, shades]);

  // ✅ Only disable main action if shades exist and none is selected
  const canAdd = !hasShades || !!selectedShade;

  function handleAdd() {
    if (!canAdd) return;

    addToCart({
      product_key: product.product_key,
      shade_key: selectedShade?.shade_key ?? "no-shade",
      shade_name: selectedShade?.shade_name ?? "No Shade",
      quantity,
      name: product.name,
      brand: product.brand,
      price: product.price,
      image_url: product.image_url,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }

  return (
    <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-section)] p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-[var(--text-main)]">
            Add to cart
          </h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {hasShades
              ? "Choose a shade, then set quantity."
              : "Set quantity and add."}
          </p>
        </div>

        {/* Selected preview */}
        {hasShades ? (
          <div className="text-right">
            <p className="text-xs text-[var(--text-muted)]">Selected</p>
            <p className="text-sm font-medium text-[var(--text-main)]">
              {selectedShade?.shade_name ?? "None"}
            </p>
          </div>
        ) : null}
      </div>

      {/* Shades */}
      <div className="mt-6">
        <p className="text-sm font-medium text-[var(--text-main)]">Shade</p>

        {hasShades ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {shades.map((shade) => {
              const active = shade.shade_key === selectedShadeKey;
              const hex = safeHex(shade.shade_hex);

              return (
                <button
                  key={shade.shade_key}
                  type="button"
                  onClick={() => setSelectedShadeKey(shade.shade_key)}
                  className={[
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition",
                    "bg-white text-[var(--text-secondary)]",
                    active
                      ? "border-[var(--rose-primary)] bg-[var(--rose-primary)]/10"
                      : "border-[var(--border-soft)] hover:border-[var(--rose-primary)]",
                  ].join(" ")}
                >
                  {/* color dot */}
                  <span
                    className="h-3.5 w-3.5 rounded-full border border-black/10"
                    style={{ backgroundColor: hex ?? "transparent" }}
                    aria-hidden="true"
                  />
                  <span className="max-w-[140px] truncate">
                    {shade.shade_name}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            No shades available.
          </p>
        )}
      </div>

      {/* Quantity */}
      <div className="mt-6">
        <p className="text-sm font-medium text-[var(--text-main)]">Quantity</p>

        <div
          className="mt-2 inline-flex items-center gap-3 rounded-xl border border-[var(--rose-soft)]

 bg-[var(--bg-section)] px-3 py-2"
        >
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity === 1}
            className={[
              "h-9 w-9 rounded-full border transition flex items-center justify-center",
              quantity === 1
                ? "cursor-not-allowed border-[var(--border-soft)] text-black/30"
                : "border-[var(--rose-soft)] hover:border-[var(--rose-primary)] hover:bg-[var(--rose-primary)]/10 text-[var(--text-main)]",
            ].join(" ")}
            aria-label="Decrease quantity"
          >
            −
          </button>

          <span className="w-6 text-center text-sm font-semibold text-[var(--text-main)]">
            {quantity}
          </span>

          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="h-9 w-9 rounded-full border border-[var(--rose-soft)]
 transition hover:border-[var(--rose-primary)] hover:bg-[var(--rose-primary)]/10 text-[var(--text-main)] flex items-center justify-center"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      {/* Add button */}
      <button
        type="button"
        onClick={handleAdd}
        disabled={!canAdd}
        className={[
          "mt-6 w-full rounded-xl py-3 text-sm font-medium transition",
          canAdd
            ? "bg-[var(--rose-primary)] text-white hover:opacity-95"
            : "bg-[var(--rose-soft)] text-white opacity-60 cursor-not-allowed",
        ].join(" ")}
      >
        {added ? "Added ✓" : canAdd ? "Add to cart" : "Select a shade first"}
      </button>
    </div>
  );
}
