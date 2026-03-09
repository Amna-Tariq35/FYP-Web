"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  Tag,
  Layers,
} from "lucide-react";
import ProductCard from "./ProductCard";
import { MakeupProduct } from "@/src/types/catalog";

const ITEMS_PER_PAGE = 9;

// ── Defined OUTSIDE to prevent remount on every render ──────────────────────
function FilterGroup({
  title,
  icon,
  options,
  selected,
  onChange,
  name,
}: {
  title: string;
  icon: React.ReactNode;
  options: string[];
  selected: string;
  onChange: (v: string) => void;
  name: string;
}) {
  return (
    <div className="filter-group">
      <div className="filter-group-header">
        {icon}
        <span>{title}</span>
      </div>
      <div className="filter-options-list">
        {options.map((opt) => (
          <label key={opt} className="filter-radio-label">
            <input
              type="radio"
              name={name}
              value={opt}
              checked={selected === opt}
              onChange={(e) => onChange(e.target.value)}
              className="filter-radio-input"
            />
            <span className={`filter-radio-dot ${selected === opt ? "active" : ""}`} />
            <span className={`filter-radio-text ${selected === opt ? "selected" : ""}`}>
              {opt}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function ProductsClient({
  initialProducts,
}: {
  initialProducts: MakeupProduct[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [sortBy, setSortBy] = useState("featured");
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const categories = useMemo(() => {
    const cats = new Set(
      initialProducts.map((p) => p.category?.trim() || "Makeup")
    );
    return ["All", ...Array.from(cats)].sort();
  }, [initialProducts]);

  const brands = useMemo(() => {
    const brs = new Set(
      initialProducts.map((p) => p.brand?.trim()).filter(Boolean)
    );
    return ["All", ...Array.from(brs)].sort();
  }, [initialProducts]);

  const filteredProducts = useMemo(() => {
    let result = [...initialProducts];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== "All") {
      result = result.filter(
        (p) => (p.category?.trim() || "Makeup") === selectedCategory
      );
    }

    if (selectedBrand !== "All") {
      result = result.filter((p) => p.brand?.trim() === selectedBrand);
    }

    if (sortBy === "price-asc") {
      result.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === "name-asc") {
      result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }

    return result;
  }, [initialProducts, searchQuery, selectedCategory, selectedBrand, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedBrand, sortBy]);

  const activeFiltersCount = [
    selectedCategory !== "All",
    selectedBrand !== "All",
    searchQuery.trim() !== "",
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedBrand("All");
  };

  const renderSidebarContent = () => (
    <div className="sidebar-content">
      {/* Search */}
      <div className="filter-group">
        <div className="filter-group-header">
          <Search className="w-3.5 h-3.5" />
          <span>Search</span>
        </div>
        <div className="search-input-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Products, brands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="search-clear-btn"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="sidebar-divider" />

      <FilterGroup
        title="Category"
        icon={<Layers className="w-3.5 h-3.5" />}
        options={categories}
        selected={selectedCategory}
        onChange={setSelectedCategory}
        name="category"
      />

      {brands.length > 1 && (
        <>
          <div className="sidebar-divider" />
          <FilterGroup
            title="Brand"
            icon={<Tag className="w-3.5 h-3.5" />}
            options={brands}
            selected={selectedBrand}
            onChange={setSelectedBrand}
            name="brand"
          />
        </>
      )}

      {activeFiltersCount > 0 && (
        <>
          <div className="sidebar-divider" />
          <button onClick={clearAllFilters} className="clear-filters-btn">
            <X className="w-3.5 h-3.5" />
            Clear all filters
            <span className="clear-badge">{activeFiltersCount}</span>
          </button>
        </>
      )}
    </div>
  );

  return (
    <>
      {/* Scoped Styles */}
      <style>{`
        /* ── Layout ─────────────────────────────────────────── */
        .products-layout {
          display: flex;
          gap: 28px;
          align-items: flex-start;
          width: 100%;
        }

        /* ── Desktop Sidebar ─────────────────────────────────── */
        .products-sidebar {
          display: none;
          width: 248px;
          flex-shrink: 0;
          position: sticky;
          top: 88px;
          background: var(--bg-section);
          border: 1px solid var(--border-soft);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04);
        }
        @media (min-width: 1024px) {
          .products-sidebar { display: block; }
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 18px 20px 14px;
          border-bottom: 1px solid var(--border-soft);
          background: var(--bg-base);
        }
        .sidebar-header-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-main);
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .sidebar-filter-icon {
          color: var(--rose-primary);
        }
        .sidebar-badge {
          margin-left: auto;
          background: var(--rose-primary);
          color: white;
          font-size: 10px;
          font-weight: 700;
          border-radius: 99px;
          padding: 1px 7px;
          line-height: 18px;
        }

        .sidebar-content {
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        /* ── Filter Groups ───────────────────────────────────── */
        .filter-group { margin-bottom: 4px; }

        .filter-group-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 10px;
        }

        .filter-options-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
          max-height: 200px;
          overflow-y: auto;
          padding-right: 2px;
        }
        .filter-options-list::-webkit-scrollbar { width: 3px; }
        .filter-options-list::-webkit-scrollbar-track { background: transparent; }
        .filter-options-list::-webkit-scrollbar-thumb {
          background: var(--border-soft);
          border-radius: 99px;
        }

        .filter-radio-label {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          padding: 6px 8px;
          border-radius: 10px;
          transition: background 0.15s;
        }
        .filter-radio-label:hover { background: var(--bg-base); }
        .filter-radio-input { display: none; }

        .filter-radio-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid var(--border-soft);
          flex-shrink: 0;
          position: relative;
          transition: border-color 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .filter-radio-dot.active {
          border-color: var(--rose-primary);
        }
        .filter-radio-dot.active::after {
          content: '';
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--rose-primary);
          position: absolute;
        }

        .filter-radio-text {
          font-size: 13px;
          color: var(--text-muted);
          transition: color 0.15s;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .filter-radio-text.selected {
          color: var(--text-main);
          font-weight: 600;
        }

        /* ── Search ──────────────────────────────────────────── */
        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .search-icon {
          position: absolute;
          left: 11px;
          width: 14px;
          height: 14px;
          color: var(--text-muted);
          pointer-events: none;
        }
        .search-input {
          width: 100%;
          padding: 9px 36px 9px 34px;
          font-size: 13px;
          border-radius: 12px;
          border: 1.5px solid var(--border-soft);
          background: var(--bg-base);
          color: var(--text-main);
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .search-input::placeholder { color: var(--text-muted); }
        .search-input:focus {
          border-color: var(--rose-primary);
          box-shadow: 0 0 0 3px rgba(var(--rose-primary-rgb, 220,100,120), 0.10);
        }
        .search-clear-btn {
          position: absolute;
          right: 10px;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2px;
          border-radius: 50%;
          cursor: pointer;
          background: none;
          border: none;
          transition: color 0.15s;
        }
        .search-clear-btn:hover { color: var(--text-main); }

        .sidebar-divider {
          height: 1px;
          background: var(--border-soft);
          margin: 14px 0;
          opacity: 0.7;
        }

        .clear-filters-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12.5px;
          font-weight: 500;
          color: var(--rose-primary);
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px 10px;
          border-radius: 10px;
          border: 1.5px dashed var(--rose-primary);
          width: 100%;
          transition: background 0.15s;
        }
        .clear-filters-btn:hover { background: rgba(220,100,120,0.06); }
        .clear-badge {
          margin-left: auto;
          background: var(--rose-primary);
          color: white;
          font-size: 10px;
          font-weight: 700;
          border-radius: 99px;
          padding: 1px 7px;
          line-height: 17px;
        }

        /* ── Main Content ────────────────────────────────────── */
        .products-main { flex: 1; min-width: 0; }

        /* ── Top Bar ─────────────────────────────────────────── */
        .products-topbar {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
          background: var(--bg-section);
          border: 1px solid var(--border-soft);
          border-radius: 16px;
          padding: 14px 18px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        @media (min-width: 640px) {
          .products-topbar {
            flex-direction: row;
            align-items: center;
          }
        }

        .results-count {
          font-size: 13px;
          color: var(--text-muted);
          white-space: nowrap;
        }
        .results-count strong {
          font-weight: 700;
          color: var(--text-main);
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-left: auto;
          width: 100%;
        }
        @media (min-width: 640px) {
          .topbar-right { width: auto; }
        }

        .mobile-filter-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 500;
          border-radius: 12px;
          border: 1.5px solid var(--border-soft);
          background: var(--bg-base);
          color: var(--text-main);
          cursor: pointer;
          white-space: nowrap;
          transition: border-color 0.15s;
          position: relative;
        }
        .mobile-filter-btn:hover { border-color: var(--rose-primary); }
        @media (min-width: 1024px) { .mobile-filter-btn { display: none; } }

        .mobile-filter-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background: var(--rose-primary);
          color: white;
          font-size: 9px;
          font-weight: 700;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sort-select-wrapper {
          position: relative;
          flex: 1;
        }
        @media (min-width: 640px) { .sort-select-wrapper { flex: 0 0 auto; } }
        .sort-icon {
          position: absolute;
          left: 11px;
          top: 50%;
          transform: translateY(-50%);
          width: 14px;
          height: 14px;
          color: var(--text-muted);
          pointer-events: none;
        }
        .sort-select {
          width: 100%;
          padding: 8px 12px 8px 33px;
          font-size: 13px;
          border-radius: 12px;
          border: 1.5px solid var(--border-soft);
          background: var(--bg-base);
          color: var(--text-main);
          outline: none;
          appearance: none;
          cursor: pointer;
          transition: border-color 0.15s;
          white-space: nowrap;
        }
        .sort-select:focus { border-color: var(--rose-primary); }

        /* ── Products Grid ───────────────────────────────────── */
        .products-grid {
          display: grid;
          gap: 20px;
          grid-template-columns: 1fr;
        }
        @media (min-width: 480px) {
          .products-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1280px) {
          .products-grid { grid-template-columns: repeat(3, 1fr); }
        }

        /* ── Empty State ─────────────────────────────────────── */
        .empty-state {
          border: 1px solid var(--border-soft);
          border-radius: 20px;
          background: var(--bg-section);
          padding: 64px 24px;
          text-align: center;
        }
        .empty-icon-wrap {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: var(--rose-soft, rgba(220,100,120,0.1));
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }
        .empty-title {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 6px;
        }
        .empty-desc {
          font-size: 14px;
          color: var(--text-muted);
          max-width: 340px;
          margin: 0 auto 20px;
          line-height: 1.55;
        }
        .empty-clear-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 9px 22px;
          border-radius: 12px;
          border: 1.5px solid var(--border-soft);
          background: var(--bg-base);
          color: var(--text-main);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
        }
        .empty-clear-btn:hover {
          border-color: var(--rose-primary);
          background: rgba(220,100,120,0.04);
        }

        /* ── Pagination ──────────────────────────────────────── */
        .pagination-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 36px;
          padding-top: 24px;
          border-top: 1px solid var(--border-soft);
          flex-wrap: wrap;
        }
        .pagination-arrow {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          border: 1.5px solid var(--border-soft);
          background: var(--bg-section);
          color: var(--text-main);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
          flex-shrink: 0;
        }
        .pagination-arrow:hover:not(:disabled) {
          border-color: var(--rose-primary);
          background: var(--bg-base);
        }
        .pagination-arrow:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .pagination-nums {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .pagination-num {
          min-width: 38px;
          height: 38px;
          padding: 0 8px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: 1.5px solid transparent;
          background: none;
          color: var(--text-main);
          transition: all 0.15s;
        }
        .pagination-num:hover:not(.active) {
          border-color: var(--border-soft);
          background: var(--bg-section);
        }
        .pagination-num.active {
          background: var(--rose-primary);
          color: white;
          border-color: var(--rose-primary);
          box-shadow: 0 2px 8px rgba(220,100,120,0.25);
        }
        .pagination-dots {
          font-size: 13px;
          color: var(--text-muted);
          padding: 0 2px;
          line-height: 38px;
        }

        /* ── Mobile Filter Drawer ────────────────────────────── */
        .mobile-drawer-overlay {
          position: fixed;
          inset: 0;
          z-index: 60;
          display: flex;
        }
        @media (min-width: 1024px) {
          .mobile-drawer-overlay { display: none; }
        }
        .mobile-drawer-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(4px);
        }
        .mobile-drawer {
          position: relative;
          z-index: 61;
          width: 100%;
          max-width: 300px;
          background: var(--bg-section);
          height: 100%;
          overflow-y: auto;
          box-shadow: 4px 0 32px rgba(0,0,0,0.15);
        }
        .mobile-drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px 14px;
          border-bottom: 1px solid var(--border-soft);
          background: var(--bg-base);
          position: sticky;
          top: 0;
          z-index: 1;
        }
        .mobile-drawer-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-main);
        }
        .drawer-close-btn {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          border: 1.5px solid var(--border-soft);
          background: var(--bg-section);
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: color 0.15s, border-color 0.15s;
        }
        .drawer-close-btn:hover {
          color: var(--text-main);
          border-color: var(--rose-primary);
        }
      `}</style>

      <div className="products-layout">
        {/* ── Desktop Sidebar ── */}
        <aside className="products-sidebar">
          <div className="sidebar-header">
            <Filter className="w-4 h-4 sidebar-filter-icon" />
            <span className="sidebar-header-title">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="sidebar-badge">{activeFiltersCount}</span>
            )}
          </div>
          {renderSidebarContent()}
        </aside>

        {/* ── Mobile Filter Drawer ── */}
        {isMobileFiltersOpen && (
          <div className="mobile-drawer-overlay">
            <div
              className="mobile-drawer-backdrop"
              onClick={() => setIsMobileFiltersOpen(false)}
            />
            <div className="mobile-drawer">
              <div className="mobile-drawer-header">
                <span className="mobile-drawer-title">Filters</span>
                <button
                  className="drawer-close-btn"
                  onClick={() => setIsMobileFiltersOpen(false)}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {renderSidebarContent()}
            </div>
          </div>
        )}

        {/* ── Main Content ── */}
        <div className="products-main">
          {/* Top Bar */}
          <div className="products-topbar">
            <span className="results-count">
              Showing <strong>{filteredProducts.length}</strong>{" "}
              {filteredProducts.length === 1 ? "product" : "products"}
            </span>

            <div className="topbar-right">
              <button
                className="mobile-filter-btn"
                onClick={() => setIsMobileFiltersOpen(true)}
              >
                <Filter className="w-4 h-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="mobile-filter-badge">{activeFiltersCount}</span>
                )}
              </button>

              <div className="sort-select-wrapper">
                <SlidersHorizontal className="sort-icon" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                >
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price: Low → High</option>
                  <option value="price-desc">Price: High → Low</option>
                  <option value="name-asc">Name: A → Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* Grid or Empty State */}
          {filteredProducts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon-wrap">
                <Search className="w-7 h-7" style={{ color: "var(--rose-primary)" }} />
              </div>
              <p className="empty-title">No products found</p>
              <p className="empty-desc">
                Nothing matched your current filters. Try adjusting your search
                or clearing the filters.
              </p>
              <button className="empty-clear-btn" onClick={clearAllFilters}>
                <X className="w-4 h-4" />
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="products-grid">
              {paginatedProducts.map((p) => (
                <ProductCard key={p.product_key} product={p} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-row">
              <button
                className="pagination-arrow"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="pagination-nums">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const page = i + 1;
                  const isFirst = page === 1;
                  const isLast = page === totalPages;
                  const isNear = Math.abs(currentPage - page) <= 1;

                  if (!isFirst && !isLast && !isNear) {
                    if (page === 2 || page === totalPages - 1) {
                      return (
                        <span key={page} className="pagination-dots">
                          ···
                        </span>
                      );
                    }
                    return null;
                  }

                  return (
                    <button
                      key={page}
                      className={`pagination-num ${currentPage === page ? "active" : ""}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                className="pagination-arrow"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
