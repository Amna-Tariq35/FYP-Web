import Image from "next/image";
import Link from "next/link";
import { Heart, Star } from "lucide-react";
import { MakeupProduct } from "@/src/types/catalog";
import { getProductImageUrl } from "@/src/lib/catalog/image";

type ProductCardProps = {
  product: MakeupProduct;
  isWished?: boolean;
  onWishlistToggle?: (productKey: string) => void;
  onView?: (productKey: string) => void;
};

// ── Deterministic fake-but-realistic rating from product key ─────────────────
function getRating(key: string): { score: number; count: number } {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) & 0xffffffff;
  }
  const score = 3.5 + (Math.abs(hash % 15) / 10); // 3.5 – 5.0
  const count = 18 + Math.abs((hash >> 4) % 233);  // 18 – 250
  return { score: Math.min(5, parseFloat(score.toFixed(1))), count };
}

// ── StarRow ──────────────────────────────────────────────────────────────────
function StarRow({ score }: { score: number }) {
  return (
    <div className="star-row">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = score >= n;
        const half = !filled && score >= n - 0.5;
        return (
          <span key={n} className="star-wrap">
            {filled ? (
              <Star className="star star-filled" />
            ) : half ? (
              <span className="star-half-wrap">
                <Star className="star star-empty" />
                <span className="star-half-fill">
                  <Star className="star star-filled" />
                </span>
              </span>
            ) : (
              <Star className="star star-empty" />
            )}
          </span>
        );
      })}
    </div>
  );
}

// ── ProductCard ──────────────────────────────────────────────────────────────
export default function ProductCard({
  product,
  isWished = false,
  onWishlistToggle,
  onView,
}: ProductCardProps) {
  const imageUrl = getProductImageUrl(product.image_url);

  const price =
    typeof product.price === "number"
      ? `$${product.price.toFixed(2)}`
      : "—";

  const brand = product.brand?.trim() || "—";
  const category = product.category?.trim() || "Makeup";
  const { score, count } = getRating(product.product_key);

  return (
    <>
      <style>{`
        /* ── Card Shell ─────────────────────────────────────── */
        .product-card {
          border-radius: 18px;
          border: 1px solid var(--border-soft);
          background: var(--bg-section);
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          overflow: hidden;
          transition: box-shadow 0.22s, transform 0.22s, border-color 0.22s;
          display: flex;
          flex-direction: column;
          height: 100%;
          position: relative;
        }
        .product-card:hover {
          box-shadow: 0 8px 28px rgba(0,0,0,0.11);
          transform: translateY(-3px);
          border-color: rgba(192,108,132,0.28);
        }
        .product-card-link {
          display: flex;
          flex-direction: column;
          height: 100%;
          text-decoration: none;
          color: inherit;
        }

        /* ── Image Area ─────────────────────────────────────── */
        .product-card-image-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 4/3;
          background: var(--bg-base);
          overflow: hidden;
          flex-shrink: 0;
        }
        .product-card-image-wrap img {
          object-fit: cover;
          transition: transform 0.38s ease;
        }
        .product-card:hover .product-card-image-wrap img {
          transform: scale(1.055);
        }

        /* Category pill */
        .product-card-pill {
          position: absolute;
          top: 12px;
          left: 12px;
          background: white;
          border: 1px solid rgba(0,0,0,0.07);
          border-radius: 99px;
          padding: 3px 10px;
          font-size: 10.5px;
          font-weight: 600;
          color: var(--rose-primary);
          letter-spacing: 0.03em;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
          z-index: 2;
          max-width: calc(100% - 60px);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ── Wishlist Heart Button ───────────────────────────── */
        .wishlist-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 3;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.85);
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s, background 0.2s, border-color 0.2s;
          box-shadow: 0 1px 6px rgba(0,0,0,0.12);
        }
        .wishlist-btn:hover {
          transform: scale(1.12);
          box-shadow: 0 3px 12px rgba(192,108,132,0.30);
          background: white;
          border-color: rgba(192,108,132,0.40);
        }
        .wishlist-btn.wished {
          background: rgba(192,108,132,0.10);
          border-color: rgba(192,108,132,0.45);
        }
        .wishlist-btn.wished:hover {
          background: rgba(192,108,132,0.16);
        }
        .heart-icon-svg {
          width: 16px;
          height: 16px;
          color: var(--text-muted);
          transition: color 0.2s, transform 0.2s;
        }
        .wishlist-btn.wished .heart-icon-svg {
          color: var(--rose-primary);
          fill: var(--rose-primary);
        }
        .wishlist-btn:hover .heart-icon-svg { transform: scale(1.15); }

        /* ── Card Body ──────────────────────────────────────── */
        .product-card-body {
          padding: 14px 16px 16px;
          display: flex;
          flex-direction: column;
          gap: 0;
          flex: 1;
        }
        .product-card-brand {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .product-card-name {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-main);
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin-bottom: 7px;
        }

        /* ── Star Rating ────────────────────────────────────── */
        .rating-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
        }
        .star-row {
          display: flex;
          align-items: center;
          gap: 1.5px;
        }
        .star-wrap { display: inline-flex; align-items: center; position: relative; }
        .star {
          width: 12px;
          height: 12px;
        }
        .star-filled {
          color: #F4A830;
          fill: #F4A830;
        }
        .star-empty {
          color: #D9D9D9;
          fill: #D9D9D9;
        }
        .star-half-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
        }
        .star-half-fill {
          position: absolute;
          left: 0;
          top: 0;
          width: 50%;
          overflow: hidden;
          display: inline-flex;
        }
        .rating-score {
          font-size: 11.5px;
          font-weight: 700;
          color: var(--text-main);
        }
        .rating-count {
          font-size: 10.5px;
          color: var(--text-muted);
        }

        /* ── Description ────────────────────────────────────── */
        .product-card-desc {
          font-size: 12.5px;
          color: var(--text-muted);
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin-bottom: 14px;
          flex: 1;
        }

        /* ── Footer ─────────────────────────────────────────── */
        .product-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: auto;
        }
        .product-card-price {
          font-size: 18px;
          font-weight: 800;
          color: var(--rose-primary);
          letter-spacing: -0.01em;
          line-height: 1;
        }
        .product-card-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 18px;
          border-radius: 12px;
          background: var(--rose-primary);
          color: white;
          font-size: 12.5px;
          font-weight: 600;
          letter-spacing: 0.01em;
          transition: opacity 0.15s, transform 0.15s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .product-card:hover .product-card-cta {
          opacity: 0.92;
          transform: scale(1.03);
        }
      `}</style>

      <div className="product-card">
        {/* ── Wishlist Heart (absolutely positioned over image) ── */}
        {onWishlistToggle && (
          <button
            className={`wishlist-btn ${isWished ? "wished" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onWishlistToggle(product.product_key);
            }}
            aria-label={isWished ? "Remove from wishlist" : "Add to wishlist"}
            title={isWished ? "Remove from wishlist" : "Save to wishlist"}
          >
            <Heart className="heart-icon-svg" />
          </button>
        )}

        <Link
          href={`/products/${product.product_key}`}
          className="product-card-link"
          onClick={() => onView?.(product.product_key)}
        >
          {/* Image */}
          <div className="product-card-image-wrap">
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 480px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover"
            />
            <span className="product-card-pill">{category}</span>
          </div>

          {/* Body */}
          <div className="product-card-body">
            <p className="product-card-brand">{brand}</p>
            <h3 className="product-card-name">{product.name}</h3>

            {/* ── Star Rating ── */}
            <div className="rating-row">
              <StarRow score={score} />
              <span className="rating-score">{score}</span>
              <span className="rating-count">({count})</span>
            </div>

            <p className="product-card-desc">
              {product.description || "No description available."}
            </p>

            <div className="product-card-footer">
              <span className="product-card-price">{price}</span>
              <span className="product-card-cta">View details</span>
            </div>
          </div>
        </Link>
      </div>
    </>
  );
}