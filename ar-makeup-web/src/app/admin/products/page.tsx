"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Edit, Filter, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import useSWR from "swr";
import { supabase } from "@/src/lib/supabase/client";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  product_key: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  image_url: string;
  is_active: boolean;
}

type NotificationType = { message: string; type: "success" | "error" } | null;

// ─── Fetcher (consistent with other admin pages — uses API route + auth) ──────

const fetcher = async (url: string) => {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throw new Error("Session fetch failed");
  if (!session?.access_token) throw new Error("No active session");

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
};

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ notification }: { notification: NotificationType }) {
  if (!notification) return null;
  return (
    <div
      className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg text-sm font-medium border transition-all duration-300 ${
        notification.type === "success"
          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
          : "bg-red-50 text-red-700 border-red-200"
      }`}
    >
      {notification.type === "success" ? (
        <CheckCircle className="w-4 h-4 text-emerald-500" />
      ) : (
        <XCircle className="w-4 h-4 text-red-400" />
      )}
      {notification.message}
    </div>
  );
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function ToggleSwitch({
  active,
  disabled,
  onToggle,
}: {
  active: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      aria-label={active ? "Deactivate product" : "Activate product"}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C06C84] focus-visible:ring-offset-1 ${
        active ? "bg-emerald-500" : "bg-gray-200"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
          active ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminProductsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationType>(null);

  const { data, error, isLoading, mutate } = useSWR(
    "/api/admin/products",
    fetcher,
    { revalidateOnFocus: false }
  );

  const products: Product[] = data?.products ?? [];

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    setTogglingId(id);
    const newStatus = !currentStatus;

    // Optimistic update
    mutate(
      {
        ...data,
        products: products.map((p) =>
          p.id === id ? { ...p, is_active: newStatus } : p
        ),
      },
      false
    );

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch("/api/admin/products/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ id, is_active: newStatus }),
      });

      const result = await res.json();
      if (result.success) {
        showNotification(
          `Product ${newStatus ? "activated" : "deactivated"} successfully.`,
          "success"
        );
      } else {
        showNotification("Failed to update product status.", "error");
        mutate(); // Revert
      }
    } catch {
      showNotification("Network error. Please try again.", "error");
      mutate();
    } finally {
      setTogglingId(null);
    }
  };

  const categories = [
    "All",
    ...Array.from(new Set(products.map((p) => p.category))),
  ];

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q);
    const matchesCategory =
      selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <Toast notification={notification} />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-main)]">
            Inventory Management
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Manage your makeup products, stock status, and shades.
          </p>
        </div>
        <button
          onClick={() => router.push("/admin/products/new")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all shadow-sm hover:shadow-md"
          style={{ background: "var(--rose-primary, #C06C84)" }}
        >
          <Plus className="w-4 h-4" />
          Add New Product
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by product name or brand…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#F4C2C2] transition-shadow"
          />
        </div>
        <div className="relative min-w-[190px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#F4C2C2] appearance-none bg-white capitalize transition-shadow"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => mutate()}
          className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-gray-400 hover:text-[#C06C84]"
          title="Refresh products"
          aria-label="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--bg-base)] border-b border-gray-100">
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Stock Status
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl" />
                        <div>
                          <div className="h-3 bg-gray-100 rounded w-28 mb-1.5" />
                          <div className="h-2.5 bg-gray-100 rounded w-20" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-3 bg-gray-100 rounded w-16" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-3 bg-gray-100 rounded w-12" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-6 bg-gray-100 rounded-full w-11" />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="h-7 bg-gray-100 rounded-lg w-16 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-12 text-center text-red-400 text-sm"
                  >
                    Failed to load products. Please try refreshing.
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-12 text-center text-gray-400 text-sm"
                  >
                    No products match your search.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-gray-50/60 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            product.image_url ||
                            "https://picsum.photos/seed/makeup/100/100"
                          }
                          alt={product.name}
                          className="w-10 h-10 rounded-xl object-cover border border-gray-200 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-[var(--text-main)] truncate">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {product.brand}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">
                        {product.category.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm font-semibold text-[var(--text-main)]">
                        ${Number(product.price).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2.5">
                        <ToggleSwitch
                          active={product.is_active}
                          disabled={togglingId === product.id}
                          onToggle={() =>
                            handleToggleActive(product.id, product.is_active)
                          }
                        />
                        <span
                          className={`text-xs font-medium ${
                            product.is_active
                              ? "text-emerald-600"
                              : "text-gray-400"
                          }`}
                        >
                          {product.is_active ? "Active" : "Hidden"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() =>
                          router.push(`/admin/products/${product.id}`)
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-[#C06C84] hover:bg-[#F4C2C2]/30 rounded-lg transition-colors"
                        aria-label="Edit product"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        {!isLoading && !error && filteredProducts.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-400">
              Showing {filteredProducts.length} of {products.length} products
            </p>
          </div>
        )}
      </div>
    </div>
  );
}