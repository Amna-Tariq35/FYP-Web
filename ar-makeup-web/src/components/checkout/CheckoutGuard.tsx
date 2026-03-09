"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { loadCart, getCartCount } from "@/src/store/cart";

type Props = {
  /** Where to send user if cart is empty */
  redirectTo?: string;
  /** What to show while we are checking cart */
  loadingText?: string;
  /** Checkout content that should render ONLY when cart has items */
  children: React.ReactNode;
};

export default function CheckoutGuard({
  redirectTo = "/cart",
  loadingText = "Redirecting…",
  children,
}: Props) {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  // small memo to avoid re-reading too much
  const hasItems = useMemo(() => {
    const state = loadCart();
    return getCartCount(state) > 0;
  }, []);

  useEffect(() => {
    // We intentionally do the check inside effect to avoid “flash”
    // The UI will show loader until we decide allowed/redirect.
 
    const state = loadCart();
    const count = getCartCount(state);

    if (count <= 0) {
      setAllowed(false);
      router.replace(redirectTo);
      return;
    }

    setAllowed(true);
  }, [router, redirectTo]);

  // Block UI until we decide
  if (allowed !== true) {
    return (
      <div className="ui-container py-12">
        <div className="ui-card">
          <div className="ui-card-body">
            <div className="flex items-center gap-3">
              <span
                className="inline-block h-4 w-4 rounded-full"
                style={{
                  background:
                    "color-mix(in srgb, var(--rose-primary) 25%, white)",
                  border: "1px solid var(--border-soft)",
                }}
              />
              <div>
                <div className="text-sm font-semibold text-[var(--text-main)]">
                  {loadingText}
                </div>
                <div className="ui-muted mt-1">
                  Your cart is empty. Taking you back to cart.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Only here checkout UI renders (no flash)
  return <>{children}</>;
}
