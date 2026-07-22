"use client";

import { useState } from "react";
import Link from "next/link";

interface FilterOption {
  label: string;
  value: string;
  color?: string;
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: { label: string; href: string };
  count?: number;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: FilterOption[];
  activeFilter?: string;
  onFilterChange?: (value: string) => void;
  toolbarRight?: React.ReactNode;
}

export default function SectionHeader({
  title,
  subtitle,
  action,
  count,
  searchPlaceholder = "Buscar...",
  searchValue = "",
  onSearchChange,
  filters,
  activeFilter,
  onFilterChange,
  toolbarRight,
}: SectionHeaderProps) {
  const [localSearch, setLocalSearch] = useState(searchValue);
  const hasSearch = !!onSearchChange;

  const handleSearch = (value: string) => {
    setLocalSearch(value);
    onSearchChange?.(value);
  };

  return (
    <div className="mb-6">
      {/* Title row */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-bold font-[family-name:var(--font-heading)] text-ink">
            {title}
            {count !== undefined && (
              <span className="ml-2 text-sm font-normal text-muted">({count})</span>
            )}
          </h2>
          {subtitle && (
            <p className="text-xs text-muted mt-0.5">{subtitle}</p>
          )}
        </div>
        {action && (
          <Link
            href={action.href}
            className="shrink-0 px-4 py-2 bg-ink text-white text-sm font-bold rounded hover:bg-ink/80 transition-colors"
          >
            {action.label}
          </Link>
        )}
      </div>

      {/* Search + toolbar right */}
      {hasSearch && (
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 max-w-md min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              value={localSearch}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded bg-paper focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)] focus:border-transparent"
            />
          </div>
          {toolbarRight}
        </div>
      )}

      {/* Filter buttons */}
      {filters && filters.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => onFilterChange?.(filter.value)}
              className={`px-3 py-1.5 text-xs font-bold tracking-wide rounded transition-colors ${
                activeFilter === filter.value
                  ? "bg-ink text-white"
                  : "bg-paper border border-border text-muted hover:text-ink hover:border-ink/30"
              }`}
              style={activeFilter === filter.value && filter.color ? { backgroundColor: filter.color } : undefined}
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}