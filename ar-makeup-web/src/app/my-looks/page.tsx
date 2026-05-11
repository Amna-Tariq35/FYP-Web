"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Clock, Tag, ImageOff, ArrowRight } from "lucide-react";
import { SavedLook } from "../../types";
import { supabase } from "../../lib/supabase/client";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function SkeletonCard() {
  return (
    <div className="look-card look-card--skeleton" aria-hidden>
      <div className="look-card-image skeleton-block" />
      <div className="look-card-body">
        <div className="skeleton-line skeleton-line--title" />
        <div className="skeleton-line skeleton-line--short" />
        <div className="skeleton-tags-row">
          <div className="skeleton-tag" />
          <div className="skeleton-tag" />
        </div>
      </div>
    </div>
  );
}

function LookImage({ src, alt }: { src?: string | null; alt: string }) {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <div className="look-card-image look-card-image--placeholder">
        <ImageOff className="placeholder-icon" />
        <span className="placeholder-label">No preview</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="look-card-image look-card-image--photo"
      onError={() => setErrored(true)}
    />
  );
}

export default function MyLooksPage() {
  const [looks, setLooks] = useState<SavedLook[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    const fetchLooks = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setAuthError(true);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("saved_looks")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setLooks((data as SavedLook[]) ?? []);
      } catch (err) {
        console.error("Error fetching looks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLooks();
  }, []);

  return (
    <>
      <style>{`
        /* ── Page ───────────────────────────────────────────── */
        .looks-page {
          min-height: 100vh;
          background: var(--bg-base);
          padding: 80px 16px 64px;
        }
        .looks-container { max-width: 1200px; margin: 0 auto; }

        /* ── Header ─────────────────────────────────────────── */
        .looks-header { margin-bottom: 36px; }
        .looks-header-top {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .looks-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--rose-primary);
          margin-bottom: 8px;
        }
        .looks-title {
          font-size: clamp(22px, 3.5vw, 30px);
          font-weight: 600;
          color: var(--text-main);
          letter-spacing: -0.015em;
          line-height: 1.2;
          margin: 0 0 5px;
        }
        .looks-subtitle {
          font-size: 13px;
          font-weight: 300;
          color: var(--text-muted);
          margin: 0;
        }

        .looks-count-badge {
          background: var(--bg-section);
          border: 1px solid var(--border-soft);
          border-radius: 16px;
          padding: 12px 22px;
          text-align: center;
          flex-shrink: 0;
        }
        .looks-count-num {
          display: block;
          font-size: 26px;
          font-weight: 700;
          color: var(--rose-primary);
          line-height: 1;
        }
        .looks-count-label {
          display: block;
          font-size: 10.5px;
          font-weight: 500;
          color: var(--text-muted);
          margin-top: 3px;
          letter-spacing: 0.03em;
        }

        /* ── Grid ───────────────────────────────────────────── */
        .looks-grid {
          display: grid;
          gap: 20px;
          grid-template-columns: 1fr;
        }
        @media (min-width: 540px) { .looks-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) { .looks-grid { grid-template-columns: repeat(3, 1fr); } }

        /* ── Card ───────────────────────────────────────────── */
        .look-card {
          background: var(--bg-section);
          border: 1px solid var(--border-soft);
          border-radius: 20px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          text-decoration: none;
          color: inherit;
          transition: box-shadow 0.22s, transform 0.22s, border-color 0.22s;
        }
        .look-card:not(.look-card--skeleton):hover {
          box-shadow: 0 8px 28px rgba(0,0,0,0.09);
          transform: translateY(-2px);
          border-color: rgba(192,108,132,0.30);
        }

        .look-card-image {
          width: 100%;
          height: 210px;
          flex-shrink: 0;
          display: block;
          object-fit: cover;
          transition: transform 0.4s ease;
        }
        .look-card:hover .look-card-image--photo { transform: scale(1.04); }
        .look-card-image--placeholder {
          background: var(--bg-base);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 7px;
        }
        .placeholder-icon { width: 26px; height: 26px; color: var(--border-soft); }
        .placeholder-label { font-size: 11.5px; color: var(--text-muted); }

        /* Body */
        .look-card-body {
          padding: 16px 18px 18px;
          display: flex;
          flex-direction: column;
          gap: 7px;
          flex: 1;
        }
        .look-card-name {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-main);
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: color 0.15s;
        }
        .look-card:hover .look-card-name { color: var(--rose-primary); }

        .look-card-meta {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11.5px;
          font-weight: 400;
          color: var(--text-muted);
        }

        .look-card-tags { display: flex; flex-wrap: wrap; gap: 5px; }
        .look-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 9px;
          background: var(--bg-base);
          border: 1px solid var(--border-soft);
          border-radius: 99px;
          font-size: 10.5px;
          font-weight: 500;
          color: var(--text-muted);
        }
        .no-tags { font-size: 11px; color: var(--text-muted); font-style: italic; }

        .look-card-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          margin-top: auto;
          padding-top: 10px;
          border-top: 1px solid var(--border-soft);
        }
        .look-card-cta {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          font-weight: 600;
          color: var(--rose-primary);
          transition: gap 0.15s;
        }
        .look-card:hover .look-card-cta { gap: 8px; }

        /* ── Skeleton ────────────────────────────────────────── */
        .look-card--skeleton { pointer-events: none; }
        @keyframes ml-shimmer {
          0%   { background-position: -500px 0; }
          100% { background-position:  500px 0; }
        }
        .skeleton-block,
        .skeleton-line,
        .skeleton-tag {
          background: linear-gradient(90deg, var(--border-soft) 25%, var(--bg-base) 50%, var(--border-soft) 75%);
          background-size: 1000px 100%;
          animation: ml-shimmer 1.5s infinite;
          border-radius: 8px;
        }
        .skeleton-block  { height: 210px; border-radius: 0; }
        .skeleton-line   { height: 13px; }
        .skeleton-line--title { width: 58%; height: 17px; margin-bottom: 5px; }
        .skeleton-line--short { width: 36%; }
        .skeleton-tags-row { display: flex; gap: 7px; margin-top: 3px; }
        .skeleton-tag  { height: 22px; width: 55px; border-radius: 99px; }

        /* ── Empty / Auth ────────────────────────────────────── */
        .looks-empty {
          background: var(--bg-section);
          border: 1px solid var(--border-soft);
          border-radius: 22px;
          padding: 64px 24px;
          text-align: center;
        }
        .empty-icon-wrap {
          width: 64px; height: 64px;
          border-radius: 18px;
          background: rgba(192,108,132,0.09);
          border: 1px solid rgba(192,108,132,0.14);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 18px;
        }
        .empty-title { font-size: 17px; font-weight: 600; color: var(--text-main); margin: 0 0 7px; }
        .empty-desc  { font-size: 13px; font-weight: 300; color: var(--text-muted); margin: 0 auto 22px; max-width: 340px; line-height: 1.7; }
        .empty-cta {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 10px 24px;
          background: var(--rose-primary);
          color: white;
          border-radius: 13px;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: opacity 0.15s;
        }
        .empty-cta:hover { opacity: 0.88; }
      `}</style>

      <div className="looks-page">
        <div className="looks-container">

          {/* Header */}
          <div className="looks-header">
            <div className="looks-header-top">
              <div>
                <div className="looks-eyebrow">
                  <Sparkles className="w-3 h-3" /> AR Studio
                </div>
                <h1 className="looks-title">My Saved Looks</h1>
                <p className="looks-subtitle">Your personal AR makeup gallery</p>
              </div>

              {!loading && !authError && (
                <div className="looks-count-badge">
                  <span className="looks-count-num">{looks.length}</span>
                  <span className="looks-count-label">{looks.length === 1 ? "Look" : "Looks"} saved</span>
                </div>
              )}
            </div>
          </div>

          {/* Auth error */}
          {authError && (
            <div className="looks-empty">
              <div className="empty-icon-wrap">
                <Sparkles className="w-7 h-7" style={{ color: "var(--rose-primary)" }} />
              </div>
              <h3 className="empty-title">Sign in to see your looks</h3>
              <p className="empty-desc">Please sign in to access your personal AR makeup gallery.</p>
              <Link href="/auth/sign-in" className="empty-cta">
                Sign in <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Skeleton loading */}
          {loading && (
            <div className="looks-grid">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Empty state */}
          {!loading && !authError && looks.length === 0 && (
            <div className="looks-empty">
              <div className="empty-icon-wrap">
                <Sparkles className="w-7 h-7" style={{ color: "var(--rose-primary)" }} />
              </div>
              <h3 className="empty-title">No looks saved yet</h3>
              <p className="empty-desc">
                Try on makeup in the AR Studio, then save your favorite combinations here.
              </p>
              <Link href="/ar-studio" className="empty-cta">
                Open AR Studio <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Looks grid */}
          {!loading && !authError && looks.length > 0 && (
            <div className="looks-grid">
              {looks.map((look) => (
                <Link key={look.id} href={`/looks/${look.id}`} className="look-card">
                  <LookImage src={look.preview_image_url} alt={look.look_name ?? "Saved Look"} />

                  <div className="look-card-body">
                    <h3 className="look-card-name">{look.look_name || "Untitled Look"}</h3>

                    {look.created_at && (
                      <div className="look-card-meta">
                        <Clock className="w-3 h-3" />
                        {formatDate(look.created_at)}
                      </div>
                    )}

                    <div className="look-card-tags">
                      {look.tags && look.tags.length > 0 ? (
                        <>
                          {look.tags.slice(0, 4).map((tag, i) => (
                            <span key={i} className="look-tag">
                              <Tag className="w-2.5 h-2.5" />
                              {tag}
                            </span>
                          ))}
                          {look.tags.length > 4 && (
                            <span className="look-tag">+{look.tags.length - 4}</span>
                          )}
                        </>
                      ) : (
                        <span className="no-tags">No tags</span>
                      )}
                    </div>

                    <div className="look-card-footer">
                      <span className="look-card-cta">
                        View look <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  );
}