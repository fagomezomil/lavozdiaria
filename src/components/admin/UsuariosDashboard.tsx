"use client";

import { useState, useMemo } from "react";
import SectionHeader from "./SectionHeader";
import UserCard from "./UserCard";

interface UsuariosDashboardProps {
  users: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    created_at: string;
  }[];
  currentUserId: string;
}

type RoleFilter = "all" | "admin" | "editor" | "user" | "suspended";
type SortMode = "recent" | "oldest";

const ROLE_FILTERS: { label: string; value: RoleFilter }[] = [
  { label: "Todos los roles", value: "all" },
  { label: "Admins", value: "admin" },
  { label: "Editores", value: "editor" },
  { label: "Usuarios", value: "user" },
  { label: "Suspendidos", value: "suspended" },
];

export default function UsuariosDashboard({ users, currentUserId }: UsuariosDashboardProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [sort, setSort] = useState<SortMode>("recent");
  const [viewMode, setViewMode] = useState<"cards" | "list">("list");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const filteredList = users.filter((user) => {
      if (roleFilter !== "all" && user.role !== roleFilter) return false;
      if (search === "") return true;
      return (
        (user.full_name || "").toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q)
      );
    });
    return filteredList.sort((a, b) => {
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return sort === "recent" ? tb - ta : ta - tb;
    });
  }, [users, search, roleFilter, sort]);

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

  const hasActiveFilters = search !== "" || roleFilter !== "all" || sort !== "recent";

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("all");
    setSort("recent");
  };

  return (
    <>
      <SectionHeader
        title="Usuarios Registrados"
        count={users.length}
        searchPlaceholder="Buscar por nombre o email..."
        searchValue={search}
        onSearchChange={setSearch}
        toolbarRight={viewToggle}
      />

      {/* Filtros secundarios: rol + orden + borrar + count */}
      <div className="flex items-center gap-3 flex-wrap mb-4 -mt-3">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
          className="px-3 py-1.5 text-xs border border-border rounded bg-paper text-ink focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
        >
          {ROLE_FILTERS.map((rf) => (
            <option key={rf.value} value={rf.value}>{rf.label}</option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortMode)}
          className="px-3 py-1.5 text-xs border border-border rounded bg-paper text-ink focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
        >
          <option value="recent">Más recientes primero</option>
          <option value="oldest">Más antiguos primero</option>
        </select>

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
          {filtered.length} de {users.length} usuarios
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-paper rounded-lg p-12 text-center border border-border">
          <p className="text-muted">No se encontraron usuarios con los filtros actuales.</p>
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((user) => (
            <UserCard key={user.id} user={user} isCurrentUser={user.id === currentUserId} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((user) => (
            <UserCard key={user.id} user={user} isCurrentUser={user.id === currentUserId} />
          ))}
        </div>
      )}
    </>
  );
}