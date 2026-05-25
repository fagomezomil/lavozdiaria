"use client";

import { useState } from "react";
import SectionHeader from "./SectionHeader";
import ClientCard from "./ClientCard";

interface ClientesDashboardProps {
  clients: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    ad_count: number;
    active_ad_count: number;
  }[];
}

export default function ClientesDashboard({ clients }: ClientesDashboardProps) {
  const [search, setSearch] = useState("");

  const filtered = clients.filter((client) => {
    if (search === "") return true;
    const q = search.toLowerCase();
    return (
      client.name.toLowerCase().includes(q) ||
      (client.email || "").toLowerCase().includes(q) ||
      (client.phone || "").toLowerCase().includes(q)
    );
  });

  return (
    <>
      <SectionHeader
        title="Clientes"
        action={{ label: "+ Nuevo Cliente", href: "/admin/clients/new" }}
        count={clients.length}
        searchPlaceholder="Buscar por nombre, email o teléfono..."
        searchValue={search}
        onSearchChange={setSearch}
      />

      {filtered.length === 0 ? (
        <div className="bg-paper rounded-lg p-12 text-center border border-border">
          <p className="text-muted">No se encontraron clientes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}
    </>
  );
}