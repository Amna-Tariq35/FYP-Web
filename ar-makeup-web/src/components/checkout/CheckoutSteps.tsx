"use client";

import React from "react";

type StepKey = "shipping" | "payment" | "success";

const steps: { key: StepKey; label: string }[] = [
  { key: "shipping", label: "Shipping" },
  { key: "payment", label: "Payment" },
  { key: "success", label: "Done" },
];

function isCompleted(current: StepKey, step: StepKey) {
  const order: StepKey[] = ["shipping", "payment", "success"];
  return order.indexOf(step) < order.indexOf(current);
}

function isActive(current: StepKey, step: StepKey) {
  return current === step;
}

export default function CheckoutSteps({ current }: { current: StepKey }) {
  return (
    <div className="ui-card">
      <div className="ui-card-body">
        <div className="flex items-center justify-between gap-3">
          {steps.map((s, idx) => {
            const completed = isCompleted(current, s.key);
            const active = isActive(current, s.key);

            return (
              <React.Fragment key={s.key}>
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={[
                      "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border",
                      active
                        ? "bg-[var(--rose-primary)] text-white border-transparent"
                        : completed
                        ? "bg-white text-[var(--text-main)] border-[var(--rose-primary)]"
                        : "bg-white text-[var(--text-muted)] border-[var(--border-soft)]",
                    ].join(" ")}
                    aria-hidden="true"
                  >
                    {idx + 1}
                  </div>

                  <div className="min-w-0">
                    <div
                      className={[
                        "text-sm font-semibold truncate",
                        active
                          ? "text-[var(--text-main)]"
                          : completed
                          ? "text-[var(--text-secondary)]"
                          : "text-[var(--text-muted)]",
                      ].join(" ")}
                    >
                      {s.label}
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {active ? "Current step" : completed ? "Completed" : "Upcoming"}
                    </div>
                  </div>
                </div>

                {idx !== steps.length - 1 && (
                  <div
                    className="hidden sm:block flex-1 h-[1px]"
                    style={{
                      background: completed
                        ? "color-mix(in srgb, var(--rose-primary) 35%, var(--border-soft))"
                        : "var(--border-soft)",
                    }}
                    aria-hidden="true"
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
