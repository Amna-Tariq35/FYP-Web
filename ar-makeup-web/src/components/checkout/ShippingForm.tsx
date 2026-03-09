"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ShippingInfo } from "@/src/types/order";
import {
  DEFAULT_SHIPPING,
  loadShippingInfo,
  saveShippingInfo,
} from "@/src/store/checkoutShipping";

type FieldKey = keyof ShippingInfo;

type Errors = Partial<Record<FieldKey, string>>;

function isValidEmail(email: string) {
  // Simple, practical validation for demo
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidPhone(phone: string) {
  // Allow digits + + + spaces + hyphen (basic)
  const cleaned = phone.trim();
  if (cleaned.length < 7) return false;
  return /^[0-9+\-\s()]+$/.test(cleaned);
}

function validate(values: ShippingInfo): Errors {
  const e: Errors = {};

  // Email optional; if provided must be valid
  if (values.email && values.email.trim().length > 0) {
    if (!isValidEmail(values.email)) e.email = "Enter a valid email address.";
  }

  if (!values.name.trim()) e.name = "Full name is required.";
  if (!values.phone.trim()) e.phone = "Phone number is required.";
  else if (!isValidPhone(values.phone)) e.phone = "Enter a valid phone number.";

  if (!values.address.trim()) e.address = "Address is required.";
  if (!values.city.trim()) e.city = "City is required.";
  if (!values.country.trim()) e.country = "Country is required.";

  return e;
}

export default function ShippingForm() {
  const router = useRouter();

  // Load initial values from localStorage safely
  const [values, setValues] = useState<ShippingInfo>(DEFAULT_SHIPPING);

  // track errors + touched for nice UX
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>(
    {}
  );
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    // on mount, prefill from storage
    const stored = loadShippingInfo();
    setValues(stored);
  }, []);

  // auto-save (debounce-lite)
  useEffect(() => {
    // Save whenever values change (safe + keeps user progress)
    saveShippingInfo(values);
  }, [values]);

  const computedErrors = useMemo(() => validate(values), [values]);

  const canContinue = useMemo(() => {
    // Continue allowed only if no validation errors
    return Object.keys(computedErrors).length === 0;
  }, [computedErrors]);

  function setField<K extends FieldKey>(key: K, value: ShippingInfo[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleBlur(key: FieldKey) {
    setTouched((prev) => ({ ...prev, [key]: true }));

    // Show only the specific field error when blurred
    const fieldError = validate(values)[key];
    setErrors((prev) => ({ ...prev, [key]: fieldError }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitAttempted(true);

    const finalErrors = validate(values);
    setErrors(finalErrors);

    if (Object.keys(finalErrors).length > 0) {
      // Focus first invalid field for accessibility
      const firstKey = Object.keys(finalErrors)[0] as FieldKey;
      const el = document.querySelector<HTMLInputElement>(
        `[data-field="${firstKey}"]`
      );
      el?.focus();
      return;
    }

    // Save once more (ensures latest)
    saveShippingInfo(values);

    router.push("/checkout/payment");
  }

  function showError(key: FieldKey) {
    // show error if:
    // - field is touched OR
    // - submit attempted
    return (touched[key] || submitAttempted) && errors[key];
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="ui-h2">Shipping details</h2>
        <p className="ui-muted mt-1">
          Enter the address where you want your items delivered.
        </p>
      </div>

      {/* Email (optional) */}
      <div>
        <label className="ui-label" htmlFor="email">
          Email <span className="ui-muted">(optional)</span>
        </label>
        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          className={[
            "ui-input mt-2",
            showError("email") ? "ui-input-error" : "",
          ].join(" ")}
          value={values.email ?? ""}
          onChange={(e) => setField("email", e.target.value)}
          onBlur={() => handleBlur("email")}
          data-field="email"
          placeholder="you@example.com"
        />
        {showError("email") ? <p className="ui-error">{errors.email}</p> : null}
        <p className="ui-helper">
          Guest checkout? Adding email helps you track your order later.
        </p>
      </div>

      {/* Full name */}
      <div>
        <label className="ui-label" htmlFor="name">
          Full name <span className="text-[var(--rose-primary)]">*</span>
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          className={[
            "ui-input mt-2",
            showError("name") ? "ui-input-error" : "",
          ].join(" ")}
          value={values.name}
          onChange={(e) => setField("name", e.target.value)}
          onBlur={() => handleBlur("name")}
          data-field="name"
          placeholder="Your full name"
        />
        {showError("name") ? <p className="ui-error">{errors.name}</p> : null}
      </div>

      {/* Phone */}
      <div>
        <label className="ui-label" htmlFor="phone">
          Phone number <span className="text-[var(--rose-primary)]">*</span>
        </label>
        <input
          id="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          className={[
            "ui-input mt-2",
            showError("phone") ? "ui-input-error" : "",
          ].join(" ")}
          value={values.phone}
          onChange={(e) => setField("phone", e.target.value)}
          onBlur={() => handleBlur("phone")}
          data-field="phone"
          placeholder="+92 3xx xxx xxxx"
        />
        {showError("phone") ? (
          <p className="ui-error">{errors.phone}</p>
        ) : null}
      </div>

      {/* Address */}
      <div>
        <label className="ui-label" htmlFor="address">
          Address <span className="text-[var(--rose-primary)]">*</span>
        </label>
        <input
          id="address"
          type="text"
          autoComplete="street-address"
          className={[
            "ui-input mt-2",
            showError("address") ? "ui-input-error" : "",
          ].join(" ")}
          value={values.address}
          onChange={(e) => setField("address", e.target.value)}
          onBlur={() => handleBlur("address")}
          data-field="address"
          placeholder="House, street, area"
        />
        {showError("address") ? (
          <p className="ui-error">{errors.address}</p>
        ) : null}
      </div>

      {/* City + Country (2 columns on desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="ui-label" htmlFor="city">
            City <span className="text-[var(--rose-primary)]">*</span>
          </label>
          <input
            id="city"
            type="text"
            autoComplete="address-level2"
            className={[
              "ui-input mt-2",
              showError("city") ? "ui-input-error" : "",
            ].join(" ")}
            value={values.city}
            onChange={(e) => setField("city", e.target.value)}
            onBlur={() => handleBlur("city")}
            data-field="city"
            placeholder="Lahore"
          />
          {showError("city") ? <p className="ui-error">{errors.city}</p> : null}
        </div>

        <div>
          <label className="ui-label" htmlFor="country">
            Country <span className="text-[var(--rose-primary)]">*</span>
          </label>
          <input
            id="country"
            type="text"
            autoComplete="country-name"
            className={[
              "ui-input mt-2",
              showError("country") ? "ui-input-error" : "",
            ].join(" ")}
            value={values.country}
            onChange={(e) => setField("country", e.target.value)}
            onBlur={() => handleBlur("country")}
            data-field="country"
            placeholder="Pakistan"
          />
          {showError("country") ? (
            <p className="ui-error">{errors.country}</p>
          ) : null}
        </div>
      </div>

      <div className="ui-divider" />

      {/* Actions */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          className="ui-btn-secondary"
          onClick={() => router.push("/cart")}
        >
          Back to cart
        </button>

        <button type="submit" className="ui-btn" disabled={!canContinue}>
          Continue to payment
        </button>
      </div>

      {!canContinue && submitAttempted ? (
        <p className="ui-error">
          Please fix the highlighted fields to continue.
        </p>
      ) : null}
    </form>
  );
}
