"use client";

import React from "react";
import CheckoutSteps from "./CheckoutSteps";

type ShellStep = "shipping" | "payment" | "success";

type Props = {
  step: ShellStep;
  title?: string; // default "Checkout"
  subtitle?: string; // optional helper text
  left: React.ReactNode; // form/payment/success content
  right?: React.ReactNode; // order summary (optional on success)
};

export default function CheckoutShell({
  step,
  title = "Checkout",
  subtitle,
  left,
  right,
}: Props) {
  return (
    <div className="ui-container py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="ui-h1">{title}</h1>
        {subtitle ? <p className="ui-muted mt-1">{subtitle}</p> : null}
      </div>

      {/* Steps */}
      <div className="mb-6">
        <CheckoutSteps current={step} />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left */}
        <div className="lg:col-span-7">
          <div className="ui-card">
            <div className="ui-card-body">{left}</div>
          </div>
        </div>

        {/* Right summary */}
        {right ? (
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24 space-y-4">
              <div className="ui-card">
                <div className="ui-card-body">{right}</div>
              </div>

              <div className="ui-card">
                <div className="ui-card-body">
                  <div className="text-sm font-semibold text-[var(--text-main)]">
                    Need help?
                  </div>
                  <p className="ui-muted mt-1">
                    This is a demo checkout flow (Phase 2). Payment is simulated.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
