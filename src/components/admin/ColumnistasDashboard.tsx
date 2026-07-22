"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Columnist } from "@/lib/types";
import SectionHeader from "./SectionHeader";

interface ColumnistasDashboardProps {
  columnists: Columnist[];
}

async function deleteColumnistClient(id: string): Promise<{ error: string | null }> {
  const { deleteColumnist } = await import("@/app/admin/columnists/actions");
  return deleteColumnist(id);
}

export default function ColumnistasDashboard({ columnists }: ColumnistasDashboardProps) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const filters = [
    { label: "Todos", value: "all" },
    { label: "Activos", value: "active", color: "#10b981" },
    { label: "Inactivos", value: "inactive", color: "#94a3b8" },
  ];

  const filtered = useMemo(() => {
    const searchLower = search.toLowerCase();
    return columnists.filter((c) => {
      if (activeFilter === "active" && !c.active) return false;
      if (activeFilter === "inactive" && c.active) return false;
      if (search) {
        const matches =
          c.name.toLowerCase().includes(searchLower) ||
          (c.bio || "").toLowerCase().includes(searchLower) ||
          c.slug.toLowerCase().includes(searchLower);
        if (!matches) return false;
      }
      return true;
    });
  }, [columnists, search, activeFilter]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar a "${name}"? Las notas que lo citan quedarán sin columnista (no se rompen, solo dejan de mostrar foto).`)) return;
    setBusyId(id);
    const result = await deleteColumnistClient(id);
    setBusyId(null);
    if (result.error) {
      alert("Error: " + result.error);
    } else {
      // Force refresh — server action already revalidated
      window.location.reload();
    }
  };

  return (
    <>
      <SectionHeader
        title="Columnistas"
        subtitle="Quienes escriben las notas de opinión"
        action={{ label: "+ Nuevo Columnista", href: "/admin/columnists/new" }}
        count={columnists.length}
        searchPlaceholder="Buscar por nombre..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={filters}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      <div className="text-xs text-muted mb-3">
        {filtered.length} de {columnists.length} columnistas
      </div>

      {filtered.length === 0 ? (
        <div className="bg-paper rounded-lg p-12 text-center border border-border">
          <p className="text-muted">No hay columnistas con los filtros actuales.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="bg-paper rounded-lg border border-border p-4 flex gap-4">
              {c.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.photoUrl}
                  alt={c.name}
                  className="w-16 h-16 rounded-full object-cover flex-shrink-0 border border-border"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-ink/10 flex items-center justify-center text-2xl font-bold text-ink/40 flex-shrink-0">
                  {c.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-ink truncate">{c.name}</h3>
                  {!c.active && (
                    <span className="text-[10px] uppercase tracking-wider bg-ink/10 text-ink/60 px-1.5 py-0.5 rounded">
                      Inactivo
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted mb-2 line-clamp-2">
                  {c.bio || "Sin biografía."}
                </p>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/columnists/${c.id}/edit`}
                    className="text-xs font-bold px-2 py-1 bg-ink/5 hover:bg-ink/10 rounded transition-colors"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => handleDelete(c.id, c.name)}
                    disabled={busyId === c.id}
                    className="text-xs font-bold px-2 py-1 bg-[#e63946]/5 text-[#e63946] hover:bg-[#e63946]/10 rounded transition-colors disabled:opacity-50"
                  >
                    {busyId === c.id ? "..." : "Eliminar"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}