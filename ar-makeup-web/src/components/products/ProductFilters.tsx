"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { useState, useEffect } from "react";

export default function ProductFilters({
  categories,
  brands,
}: {
  categories: string[];
  brands: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const currentCategory = searchParams.get("category") || "";
  const currentBrand = searchParams.get("brand") || "";

  useEffect(() => {
    const timer = setTimeout(() => {
      updateParams("q", search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearch("");
    router.push(pathname);
  };

  const hasActiveFilters = searchParams.get("q") || searchParams.get("category") || searchParams.get("brand");

  return (
    <div className="space-y-8">
      
      {/* Search Bar (Fixed Overlap Issue) */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black transition-all placeholder:text-gray-400"
        />
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-3">
          Category
        </h3>
        <div className="space-y-1">
          <button 
            onClick={() => updateParams("category", "")}
            className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${!currentCategory ? "bg-black text-white font-medium" : "text-gray-600 hover:bg-gray-100"}`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button 
              key={c}
              onClick={() => updateParams("category", c)}
              className={`block w-full text-left text-sm px-3 py-2 rounded-lg capitalize transition-colors ${currentCategory === c ? "bg-black text-white font-medium" : "text-gray-600 hover:bg-gray-100"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-3">
          Brand
        </h3>
        <div className="space-y-1 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
          <button 
            onClick={() => updateParams("brand", "")}
            className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${!currentBrand ? "bg-black text-white font-medium" : "text-gray-600 hover:bg-gray-100"}`}
          >
            All Brands
          </button>
          {brands.map((b) => (
            <button 
              key={b}
              onClick={() => updateParams("brand", b)}
              className={`block w-full text-left text-sm px-3 py-2 rounded-lg capitalize transition-colors ${currentBrand === b ? "bg-black text-white font-medium" : "text-gray-600 hover:bg-gray-100"}`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center justify-center gap-2 w-full py-2.5 mt-4 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
        >
          <X className="w-4 h-4" />
          Clear all filters
        </button>
      )}
    </div>
  );
}