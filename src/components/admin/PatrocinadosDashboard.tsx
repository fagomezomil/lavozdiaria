"use client";

import { useState } from "react";
import SectionHeader from "./SectionHeader";
import SponsoredCard from "./SponsoredCard";
import type { SponsoredContent } from "@/lib/types";

interface PatrocinadosDashboardProps {
  sponsored: SponsoredContent[];
}

export default function PatrocinadosDashboard({ sponsored }: PatrocinadosDashboardProps) {
  const [search, setSearch] = useState("");

  const filtered = sponsored.filter((item) => {
    if (search === "") return true;
    const q = search.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.clientName || "").toLowerCase().includes(q)
    );
  });

  return (
    <>
      <SectionHeader
        title="Contenido Patrocinado"
        action={{ label: "+ Nuevo Contenido", href: "/admin/sponsored/new" }}
        count={sponsored.length}
        searchPlaceholder="Buscar por título o cliente..."
        searchValue={search}
        onSearchChange={setSearch}
      />

      {filtered.length === 0 ? (
        <div className="bg-paper rounded-lg p-12 text-center border border-border">
          <p className="text-muted">No se encontró contenido patrocinado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <SponsoredCard key={item.id} content={item} />
          ))}
        </div>
      )}
    </>
  );
}