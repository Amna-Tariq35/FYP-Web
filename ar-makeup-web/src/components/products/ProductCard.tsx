import Image from "next/image";
import Link from "next/link";
import { MakeupProduct } from "@/src/types/catalog";
import { getProductImageUrl } from "@/src/lib/catalog/image";

type ProductCardProps = {
  product: MakeupProduct;
};

export default function ProductCard({ product }: ProductCardProps) {
  const imageUrl = getProductImageUrl(product.image_url);

  const price =
    typeof product.price === "number"
      ? `$${product.price.toFixed(2)}`
      : "—";

  const brand = product.brand?.trim() || "—";
  const category = product.category?.trim() || "Makeup";

  return (
    <>
      <style>{`
        .product-card {
          border-radius: 18px;
          border: 1px solid var(--border-soft);
          background: var(--bg-section);
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          overflow: hidden;
          transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s;
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .product-card:hover {
          box-shadow: 0 6px 24px rgba(0,0,0,0.10);
          transform: translateY(-2px);
          border-color: rgba(220,100,120,0.25);
        }

        .product-card-link {
          display: flex;
          flex-direction: column;
          height: 100%;
          text-decoration: none;
          color: inherit;
        }

        /* Image */
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
          transition: transform 0.35s ease;
        }
        .product-card:hover .product-card-image-wrap img {
          transform: scale(1.04);
        }

        /* Category pill on top of image */
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
          z-index: 1;
          max-width: calc(100% - 24px);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Body */
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
          margin-bottom: 8px;
        }

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
          transform: scale(1.02);
        }
      `}</style>

      <div className="product-card">
        <Link href={`/products/${product.product_key}`} className="product-card-link">
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
