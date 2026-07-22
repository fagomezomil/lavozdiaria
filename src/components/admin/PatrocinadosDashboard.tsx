"use client";

import { useState, useMemo } from "react";
import type { SponsoredContent } from "@/lib/types";
import SponsoredCard from "./SponsoredCard";
import SponsoredRow from "./SponsoredRow";
import SectionHeader from "./SectionHeader";

interface PatrocinadosDashboardProps {
  sponsored: SponsoredContent[];
}

export default function PatrocinadosDashboard({ sponsored }: PatrocinadosDashboardProps) {
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [expiringSoon, setExpiringSoon] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "list">("list");

  // Lista única de clientes (por id, ordenada por nombre)
  const clients = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of sponsored) {
      if (item.clientId && item.clientName && !map.has(item.clientId)) {
        map.set(item.clientId, item.clientName);
      }
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [sponsored]);

  const filtered = useMemo(() => {
    const searchLower = search.toLowerCase();
    return sponsored.filter((item) => {
      if (selectedClient !== "all" && item.clientId !== selectedClient) return false;
      if (expiringSoon) {
        if (!item.expiresAt) return false;
        const diff = new Date(item.expiresAt).getTime() - Date.now();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        if (days < 0 || days > 7) return false;
      }
      if (search !== "") {
        const matchesSearch =
          item.title.toLowerCase().includes(searchLower) ||
          (item.clientName || "").toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      return true;
    });
  }, [sponsored, selectedClient, expiringSoon, search]);

  const hasActiveFilters = selectedClient !== "all" || expiringSoon || search !== "";

  const clearFilters = () => {
    setSelectedClient("all");
    setExpiringSoon(false);
    setSearch("");
  };

  const viewToggle = (
    <div className="ml-auto flex items-center gap-1 p-1 bg-ink/5 rounded">
      <button
        onClick={() => setViewMode("cards")}
        title="Vista de tarjetas"
        className={`p-1.5 rounded transition-colors ${
          viewMode === "cards" ? "bg-white shadow-sm text-ink" : "text-muted hover:text-ink"
        }`}
        aria-label="Vista de tarjetas"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      </button>
      <button
        onClick={() => setViewMode("list")}
        title="Vista de lista"
        className={`p-1.5 rounded transition-colors ${
          viewMode === "list" ? "bg-white shadow-sm text-ink" : "text-muted hover:text-ink"
        }`}
        aria-label="Vista de lista"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <circle cx="3.5" cy="6" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="3.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="3.5" cy="18" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      </button>
    </div>
  );

  return (
    <>
      <SectionHeader
        title="Contenido Patrocinado"
        action={{ label: "+ Nuevo Contenido", href: "/admin/sponsored/new" }}
        count={sponsored.length}
        searchPlaceholder="Buscar por título o cliente..."
        searchValue={search}
        onSearchChange={setSearch}
        toolbarRight={viewToggle}
      />

      {/* Filtros secundarios: cliente + próximos a vencer + borrar + count */}
      <div className="flex items-center gap-3 flex-wrap mb-4 -mt-3">
        <select
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          className="px-3 py-1.5 text-xs border border-border rounded bg-paper text-ink focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
        >
          <option value="all">Todos los clientes</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <button
          onClick={() => setExpiringSoon((v) => !v)}
          className={`px-3 py-1.5 text-xs font-bold tracking-wide rounded whitespace-nowrap transition-colors ${
            expiringSoon
              ? "bg-[#e63946] text-white"
              : "bg-paper border border-border text-muted hover:text-ink hover:border-ink/30"
          }`}
          title="Contenido que vence en los próximos 7 días"
        >
          Próximos a vencer (7d)
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-1.5 text-xs font-bold tracking-wide rounded whitespace-nowrap transition-colors bg-paper border border-border text-muted hover:text-ink hover:border-ink/30 flex items-center gap-1"
            title="Borrar todos los filtros"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Borrar filtros
          </button>
        )}

        <span className="text-xs text-muted ml-auto">
          {filtered.length} de {sponsored.length} contenidos
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-paper rounded-lg p-12 text-center border border-border">
          <p className="text-muted">No se encontró contenido patrocinado con los filtros actuales.</p>
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <SponsoredCard key={item.id} content={item} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((item) => (
            <SponsoredRow key={item.id} content={item} />
          ))}
        </div>
      )}
    </>
  );
}