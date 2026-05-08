import { Sparkles, Download, Star } from 'lucide-react';

export default function MobilePromo() {
  const features = ['Foundation', 'Eyeliner', 'Skin Analysis', 'Save Looks'];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

        .promo-card {
          font-family: 'DM Sans', sans-serif;
          position: relative;
          border-radius: 28px;
          overflow: hidden;
          padding: 40px 44px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 32px;
          background: #fff;
          border: 1px solid rgba(192, 108, 132, 0.1);
          box-shadow: 0 8px 40px rgba(192, 108, 132, 0.1), 0 2px 8px rgba(0,0,0,0.04);
        }

        @media (max-width: 640px) {
          .promo-card {
            flex-direction: column;
            padding: 32px 24px;
            text-align: center;
          }
          .promo-features { justify-content: center; }
          .promo-right { width: 100%; align-items: center; }
        }

        /* Decorative blobs inside card */
        .promo-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          pointer-events: none;
          opacity: 0.5;
        }
        .promo-blob-1 {
          width: 280px; height: 280px;
          top: -80px; right: -60px;
          background: radial-gradient(circle, #f7d9e3, #e8b4c0);
        }
        .promo-blob-2 {
          width: 180px; height: 180px;
          bottom: -60px; left: 10%;
          background: radial-gradient(circle, #fce4ec, #f8bbd0);
          opacity: 0.3;
        }

        .promo-left {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: flex-start;
          gap: 20px;
          flex: 1;
        }

        /* Icon ring */
        .promo-icon-wrap {
          position: relative;
          flex-shrink: 0;
        }
        .promo-icon-ring {
          width: 56px; height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f9e4ea, #f0c0cc);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 16px rgba(192,108,132,0.25);
        }
        .promo-icon-dot {
          position: absolute;
          top: 2px; right: 2px;
          width: 14px; height: 14px;
          background: #C06C84;
          border-radius: 50%;
          border: 2px solid #fff;
          display: flex; align-items: center; justify-content: center;
        }
        .promo-icon-dot-inner {
          width: 5px; height: 5px;
          background: #fff;
          border-radius: 50%;
        }

        .promo-text { flex: 1; }

        .promo-eyebrow {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #C06C84;
          margin-bottom: 6px;
          display: flex; align-items: center; gap: 5px;
        }

        .promo-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(1.4rem, 2.5vw, 1.75rem);
          font-weight: 500;
          color: #1a1a1a;
          line-height: 1.2;
          margin: 0 0 8px;
          letter-spacing: -0.01em;
        }
        .promo-title em { font-style: italic; color: #C06C84; }

        .promo-desc {
          font-size: 13px;
          color: #9a8f8f;
          line-height: 1.65;
          max-width: 380px;
          margin: 0 0 16px;
        }

        .promo-features {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .promo-chip {
          font-size: 11px;
          font-weight: 500;
          color: #C06C84;
          background: rgba(192,108,132,0.08);
          border: 1px solid rgba(192,108,132,0.15);
          padding: 4px 12px;
          border-radius: 100px;
          letter-spacing: 0.02em;
        }

        /* Right side */
        .promo-right {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 16px;
          flex-shrink: 0;
        }

        /* Rating */
        .promo-rating {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }
        .promo-stars {
          display: flex; gap: 2px;
        }
        .promo-rating-text {
          font-size: 11px;
          color: #b0a0a8;
          font-weight: 500;
        }

        /* Download button */
        .promo-download-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #1a1a1a;
          color: #fff;
          border: none;
          padding: 14px 28px;
          border-radius: 100px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          letter-spacing: 0.02em;
          transition: all 0.25s ease;
          box-shadow: 0 6px 24px rgba(26,26,26,0.2);
          white-space: nowrap;
        }
        .promo-download-btn:hover {
          background: #2a2a2a;
          transform: translateY(-2px);
          box-shadow: 0 10px 32px rgba(26,26,26,0.28);
        }
        .promo-download-btn:active { transform: translateY(0); }

        .promo-btn-icon {
          width: 28px; height: 28px;
          background: rgba(255,255,255,0.12);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .promo-stores {
          font-size: 10px;
          color: #c0b0b8;
          font-weight: 500;
          letter-spacing: 0.04em;
          text-align: center;
        }
      `}</style>

      <div className="promo-card">
        {/* Background blobs */}
        <div className="promo-blob promo-blob-1" />
        <div className="promo-blob promo-blob-2" />

        {/* Left — text */}
        <div className="promo-left">
          <div className="promo-icon-wrap">
            <div className="promo-icon-ring">
              <Sparkles size={22} color="#C06C84" />
            </div>
            <div className="promo-icon-dot">
              <div className="promo-icon-dot-inner" />
            </div>
          </div>

          <div className="promo-text">
            <div className="promo-eyebrow">
              <Star size={9} fill="#C06C84" strokeWidth={0} />
              Full AR Experience
            </div>
            <h3 className="promo-title">
              Try More with Our <em>Mobile App</em>
            </h3>
            <p className="promo-desc">
              This web preview includes Lipstick &amp; Blush. Download the app for the complete experience — more products, real‑time skin analysis, and saved looks.
            </p>
            <div className="promo-features">
              {features.map((f) => (
                <span key={f} className="promo-chip">{f}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right — CTA */}
        <div className="promo-right">
          <div className="promo-rating">
            <div className="promo-stars">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={13} fill="#C06C84" color="#C06C84" strokeWidth={0} />
              ))}
            </div>
            <span className="promo-rating-text">4.9 · 12k reviews</span>
          </div>

          <button className="promo-download-btn">
            <div className="promo-btn-icon">
              <Download size={14} />
            </div>
            Download Free
          </button>

          <span className="promo-stores">iOS &amp; Android</span>
        </div>
      </div>
    </>
  );
}