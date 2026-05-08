"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ShoppingBag,
  Plus,
  Check,
  ImageOff,
  Layers,
  Tag,
  AlertCircle,
} from "lucide-react";
import { SavedLook, LookItemWithProduct } from "../../../types";
import { supabase } from "../../../lib/supabase/client";
import { addToCart } from "@/src/store/cart"; // ← same as AddToCartPanel

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG — adjust these if your Supabase table / column names differ
// ─────────────────────────────────────────────────────────────────────────────
const PRODUCTS_TABLE  = "makeup_products"; // ← your actual products table name
const PRODUCT_KEY_COL = "product_key";     // ← your actual unique key column
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sanitizes image URLs stored in Supabase:
 * - Rejects base64 blobs (data:... or suspiciously long strings)
 * - Strips surrounding quotes  'https://...'  →  https://...
 * - Fixes single-slash protocol  https:/img  →  https://img
 */
function sanitizeImageUrl(raw?: string | null): string | null {
  if (!raw) return null;
  if (raw.startsWith("data:") || raw.length > 2000) return null;
  let url = raw.trim().replace(/^['"]|['"]$/g, "");       // strip quotes
  url = url.replace(/^(https?):\/([^/])/, "$1://$2");     // fix https:/
  try { new URL(url); return url; } catch { return null; }
}

// ── Toast ─────────────────────────────────────────────────────────────────────
type Toast = { id: number; message: string; type: "success" | "error" };

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.type}`}>
          {t.type === "success" ? (
            <Check className="w-4 h-4 toast-icon" />
          ) : (
            <AlertCircle className="w-4 h-4 toast-icon" />
          )}
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ── Product image with fallback ───────────────────────────────────────────────
function ProductImage({ src, alt }: { src?: string | null; alt: string }) {
  const cleanSrc = sanitizeImageUrl(src);
  const [errored, setErrored] = useState(false);
  if (!cleanSrc || errored) {
    return (
      <div className="product-img-fallback">
        <ImageOff className="w-5 h-5" style={{ color: "var(--border-soft)" }} />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={cleanSrc}
      alt={alt}
      className="product-img"
      onError={() => setErrored(true)}
    />
  );
}

// ── Look image with fallback ──────────────────────────────────────────────────
function LookHeroImage({ src, alt }: { src?: string | null; alt: string }) {
  const cleanSrc = sanitizeImageUrl(src);
  const [errored, setErrored] = useState(false);
  if (!cleanSrc || errored) {
    return (
      <div className="look-hero-fallback">
        <ImageOff className="w-10 h-10" style={{ color: "var(--border-soft)" }} />
        <span style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>No preview available</span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={cleanSrc}
      alt={alt}
      className="look-hero-img"
      onError={() => setErrored(true)}
    />
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [look, setLook] = useState<SavedLook | null>(null);
  const [items, setItems] = useState<LookItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [allAdded, setAllAdded] = useState(false);

  // ── Toast helper ──
  const pushToast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  // ── Fetch data ──
  useEffect(() => {
    if (!id) return;

    const fetchLookDetails = async () => {
      try {
        // 1. Look header
        const { data: lookData, error: lookError } = await supabase
          .from("saved_looks")
          .select("*")
          .eq("id", id)
          .single();

        if (lookError || !lookData) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setLook(lookData as SavedLook);

        // 2. Look items
        const { data: itemsData, error: itemsError } = await supabase
          .from("saved_look_items")
          .select("*")
          .eq("look_id", id)
          .order("layer_order", { ascending: true });

        if (itemsError) throw itemsError;

        if (!itemsData || itemsData.length === 0) {
          setItems([]);
          return;
        }

        // 3. Fetch matching products using configured table & column names
        const productKeys = itemsData
          .map((item) => item.product_key)
          .filter(Boolean);

        const { data: productsData, error: productsError } = await supabase
          .from(PRODUCTS_TABLE)
          .select("*")
          .in(PRODUCT_KEY_COL, productKeys);

        if (productsError) {
          console.error(
            `Products fetch failed. Check PRODUCTS_TABLE ("${PRODUCTS_TABLE}") ` +
            `and PRODUCT_KEY_COL ("${PRODUCT_KEY_COL}") at top of file.`,
            productsError
          );
          throw productsError;
        }

        // 4. Manually join items ↔ products
        const formattedItems: LookItemWithProduct[] = itemsData.map((item) => ({
          ...item,
          product:
            productsData?.find(
              (p) => p[PRODUCT_KEY_COL] === item.product_key
            ) ?? null,
        }));

        setItems(formattedItems);
      } catch (err) {
        console.error("Error fetching look details:", err);
        pushToast("Failed to load look details.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchLookDetails();
  }, [id, pushToast]);

  // ── Cart handlers ──
  const handleAddToCart = useCallback(
    (item: LookItemWithProduct) => {
      const p = item.product;
      if (!p) return;

      addToCart({
        product_key: p.product_key,
        shade_key:   "no-shade",
        shade_name:  "No Shade",
        quantity:    1,
        name:        p.name,
        brand:       p.brand,
        price:       p.price,
        image_url:   p.image_url,
      });

      setAddedIds((prev) => new Set(prev).add(item.id));
      pushToast(`"${p.name}" added to cart`);
    },
    [pushToast]
  );

  const handleAddAllToCart = useCallback(() => {
    const validItems = items.filter((i) => i.product);
    if (validItems.length === 0) return;

    validItems.forEach((item) => {
      const p = item.product!;
      addToCart({
        product_key: p.product_key,
        shade_key:   "no-shade",
        shade_name:  "No Shade",
        quantity:    1,
        name:        p.name,
        brand:       p.brand,
        price:       p.price,
        image_url:   p.image_url,
      });
    });

    setAddedIds(new Set(validItems.map((i) => i.id)));
    setAllAdded(true);
    pushToast(`${validItems.length} product${validItems.length > 1 ? "s" : ""} added to cart`);
  }, [items, pushToast]);

  const totalPrice = items.reduce(
    (sum, item) => sum + (item.product?.price ?? 0),
    0
  );
  const validItemCount = items.filter((i) => i.product).length;

  // ── Loading ──
  if (loading) {
    return (
      <>
        <style>{detailStyles}</style>
        <div className="detail-page detail-page--center">
          <div className="spinner" />
        </div>
      </>
    );
  }

  // ── Not found ──
  if (notFound || !look) {
    return (
      <>
        <style>{detailStyles}</style>
        <div className="detail-page detail-page--center">
          <div className="not-found-box">
            <ImageOff className="w-10 h-10" style={{ color: "var(--border-soft)", marginBottom: 16 }} />
            <h2 className="not-found-title">Look not found</h2>
            <p className="not-found-desc">This look may have been deleted or doesn&apos;t exist.</p>
            <Link href="/my-looks" className="not-found-back">
              <ArrowLeft className="w-4 h-4" /> Return to My Looks
            </Link>
          </div>
        </div>
      </>
    );
  }

  // ── Main ──
  return (
    <>
      <style>{detailStyles}</style>
      <ToastContainer toasts={toasts} />

      <div className="detail-page">
        <div className="detail-container">

          {/* Back link */}
          <Link href="/my-looks" className="back-link">
            <ArrowLeft className="w-4 h-4" /> Back to My Looks
          </Link>

          {/* Card */}
          <div className="detail-card">

            {/* Left — Hero image */}
            <div className="detail-left">
              <LookHeroImage src={look.preview_image_url} alt={look.look_name ?? "Look preview"} />
            </div>

            {/* Right — Details */}
            <div className="detail-right">

              {/* Name + tags */}
              <div className="detail-header">
                <h1 className="detail-title">{look.look_name || "Untitled Look"}</h1>
                {look.tags && look.tags.length > 0 && (
                  <div className="detail-tags">
                    {look.tags.map((tag, i) => (
                      <span key={i} className="detail-tag">
                        <Tag className="w-2.5 h-2.5" /> {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Products section */}
              <div className="products-section">
                <div className="products-section-header">
                  <Layers className="w-4 h-4" style={{ color: "var(--rose-primary)" }} />
                  <h3 className="products-section-title">Products Used</h3>
                  {validItemCount > 0 && (
                    <span className="products-count">{validItemCount}</span>
                  )}
                </div>

                {items.length === 0 || validItemCount === 0 ? (
                  <p className="no-products">No products found for this look.</p>
                ) : (
                  <div className="products-list">
                    {items.map((item) => {
                      if (!item.product) return null;
                      const isAdded = addedIds.has(item.id);

                      return (
                        <div key={item.id} className="product-row">
                          <ProductImage
                            src={item.product.image_url}
                            alt={item.product.name}
                          />
                          <div className="product-info">
                            <h4 className="product-name">{item.product.name}</h4>
                            <div className="product-meta">
                              <span className="product-category">{item.product.category}</span>
                              {item.intensity != null && (
                                <>
                                  <span className="meta-dot">·</span>
                                  <span>Intensity: {item.intensity}%</span>
                                </>
                              )}
                            </div>
                            <div className="product-price">
                              ${(item.product.price ?? 0).toFixed(2)}
                            </div>
                          </div>
                          <button
                            onClick={() => handleAddToCart(item)}
                            className={`add-btn ${isAdded ? "add-btn--added" : ""}`}
                            aria-label={isAdded ? "Added to cart" : `Add ${item.product.name} to cart`}
                          >
                            {isAdded ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Plus className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer — total + CTA */}
              <div className="detail-footer">
                <div className="total-row">
                  <span className="total-label">Total Look Value</span>
                  <span className="total-price">${totalPrice.toFixed(2)}</span>
                </div>

                <button
                  onClick={handleAddAllToCart}
                  disabled={validItemCount === 0 || allAdded}
                  className={`add-all-btn ${allAdded ? "add-all-btn--done" : ""}`}
                >
                  {allAdded ? (
                    <>
                      <Check className="w-5 h-5" />
                      All Added to Cart
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5" />
                      Add All to Cart
                      {validItemCount > 0 && (
                        <span className="add-all-count">{validItemCount}</span>
                      )}
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Styles (scoped) ───────────────────────────────────────────────────────────
const detailStyles = `
  /* Page */
  .detail-page {
    min-height: 100vh;
    background: var(--bg-base);
    padding: 112px 16px 64px;
  }
  .detail-page--center {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .detail-container { max-width: 1280px; margin: 0 auto; }

  /* Spinner */
  @keyframes ld-spin { to { transform: rotate(360deg); } }
  .spinner {
    width: 44px; height: 44px;
    border-radius: 50%;
    border: 3px solid var(--border-soft);
    border-top-color: var(--rose-primary);
    animation: ld-spin 0.75s linear infinite;
  }

  /* Back link */
  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 13.5px;
    font-weight: 600;
    color: var(--text-muted);
    text-decoration: none;
    margin-bottom: 28px;
    transition: color 0.15s;
  }
  .back-link:hover { color: var(--rose-primary); }

  /* Not found */
  .not-found-box {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .not-found-title { font-size: 22px; font-weight: 700; color: var(--text-main); margin: 0 0 8px; }
  .not-found-desc  { font-size: 14px; color: var(--text-muted); margin: 0 0 20px; }
  .not-found-back {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 13.5px; font-weight: 600;
    color: var(--rose-primary); text-decoration: none;
    transition: opacity 0.15s;
  }
  .not-found-back:hover { opacity: 0.75; }

  /* Detail card */
  .detail-card {
    background: var(--bg-section);
    border: 1px solid var(--border-soft);
    border-radius: 28px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  }
  @media (min-width: 1024px) { .detail-card { flex-direction: row; } }

  /* Left — image */
  .detail-left {
    flex-shrink: 0;
    width: 100%;
    min-height: 340px;
    position: relative;
    overflow: hidden;
    background: var(--bg-base);
  }
  @media (min-width: 1024px) {
    .detail-left { width: 44%; min-height: 600px; }
  }
  .look-hero-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    min-height: inherit;
  }
  .look-hero-fallback {
    width: 100%;
    height: 100%;
    min-height: inherit;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  /* Right — details */
  .detail-right {
    flex: 1;
    padding: 32px 28px;
    display: flex;
    flex-direction: column;
    gap: 28px;
    overflow-y: auto;
  }
  @media (min-width: 1024px) { .detail-right { padding: 40px 44px; } }

  /* Header */
  .detail-header {}
  .detail-title {
    font-size: clamp(22px, 3vw, 32px);
    font-weight: 800;
    color: var(--text-main);
    letter-spacing: -0.02em;
    line-height: 1.2;
    margin: 0 0 14px;
  }
  .detail-tags { display: flex; flex-wrap: wrap; gap: 7px; }
  .detail-tag {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 12px;
    background: var(--bg-base);
    border: 1px solid var(--border-soft);
    border-radius: 99px;
    font-size: 12px; font-weight: 500;
    color: var(--text-muted);
  }

  /* Products section */
  .products-section { flex: 1; display: flex; flex-direction: column; gap: 14px; }
  .products-section-header {
    display: flex; align-items: center; gap: 8px;
  }
  .products-section-title {
    font-size: 15px; font-weight: 700;
    color: var(--text-main); margin: 0;
  }
  .products-count {
    margin-left: 2px;
    background: var(--bg-base);
    border: 1px solid var(--border-soft);
    border-radius: 99px;
    font-size: 11px; font-weight: 700;
    color: var(--text-muted);
    padding: 1px 8px;
    line-height: 18px;
  }
  .no-products { font-size: 13.5px; color: var(--text-muted); font-style: italic; }

  .products-list { display: flex; flex-direction: column; gap: 10px; }

  /* Product row */
  .product-row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 14px;
    background: var(--bg-base);
    border: 1px solid var(--border-soft);
    border-radius: 16px;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .product-row:hover {
    border-color: color-mix(in srgb, var(--rose-primary) 30%, transparent);
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }

  .product-img {
    width: 60px; height: 60px;
    border-radius: 12px;
    object-fit: cover;
    border: 1px solid var(--border-soft);
    flex-shrink: 0;
  }
  .product-img-fallback {
    width: 60px; height: 60px;
    border-radius: 12px;
    border: 1px solid var(--border-soft);
    background: var(--bg-section);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  .product-info { flex: 1; min-width: 0; }
  .product-name {
    font-size: 14px; font-weight: 700;
    color: var(--text-main);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    margin: 0 0 3px;
  }
  .product-meta {
    font-size: 11.5px; color: var(--text-muted);
    display: flex; align-items: center; gap: 5px;
    text-transform: capitalize;
    margin-bottom: 4px;
  }
  .meta-dot { opacity: 0.5; }
  .product-price { font-size: 14px; font-weight: 700; color: var(--rose-primary); }

  /* Add button */
  .add-btn {
    width: 36px; height: 36px; flex-shrink: 0;
    border-radius: 11px;
    border: 1.5px solid var(--border-soft);
    background: var(--bg-section);
    color: var(--text-main);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: all 0.18s;
  }
  .add-btn:hover {
    border-color: var(--rose-primary);
    color: var(--rose-primary);
    background: color-mix(in srgb, var(--rose-primary) 8%, transparent);
  }
  .add-btn--added {
    border-color: #22c55e;
    background: rgba(34,197,94,0.1);
    color: #22c55e;
  }
  .add-btn--added:hover {
    border-color: #22c55e;
    color: #22c55e;
    background: rgba(34,197,94,0.15);
  }

  /* Footer */
  .detail-footer {
    border-top: 1px solid var(--border-soft);
    padding-top: 22px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-top: auto;
  }
  .total-row {
    display: flex; align-items: center; justify-content: space-between;
  }
  .total-label { font-size: 13.5px; font-weight: 500; color: var(--text-muted); }
  .total-price { font-size: 24px; font-weight: 800; color: var(--text-main); letter-spacing: -0.02em; }

  .add-all-btn {
    width: 100%;
    display: flex; align-items: center; justify-content: center; gap: 9px;
    padding: 14px 24px;
    background: var(--rose-primary);
    color: white;
    border: none;
    border-radius: 16px;
    font-size: 14.5px; font-weight: 700;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.15s, background 0.2s;
  }
  .add-all-btn:hover:not(:disabled) { opacity: 0.9; transform: scale(1.01); }
  .add-all-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
  .add-all-btn--done {
    background: #22c55e;
  }
  .add-all-btn--done:hover:not(:disabled) { opacity: 0.9; transform: none; }
  .add-all-count {
    background: rgba(255,255,255,0.25);
    border-radius: 99px;
    font-size: 11px; font-weight: 700;
    padding: 1px 8px; line-height: 18px;
  }

  /* Toast */
  .toast-container {
    position: fixed;
    bottom: 24px; right: 24px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 10px;
    pointer-events: none;
  }
  @keyframes toast-in {
    from { opacity: 0; transform: translateY(12px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0)    scale(1); }
  }
  .toast {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 18px;
    border-radius: 14px;
    font-size: 13.5px; font-weight: 600;
    box-shadow: 0 4px 20px rgba(0,0,0,0.14);
    animation: toast-in 0.25s ease;
    max-width: 320px;
  }
  .toast--success { background: #fff; color: #1a1a1a; border: 1px solid rgba(34,197,94,0.3); }
  .toast--error   { background: #fff; color: #1a1a1a; border: 1px solid rgba(239,68,68,0.3); }
  .toast-icon { flex-shrink: 0; }
  .toast--success .toast-icon { color: #22c55e; }
  .toast--error   .toast-icon { color: #ef4444; }
`;
