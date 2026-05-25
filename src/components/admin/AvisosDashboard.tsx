"use client";

import { useState } from "react";
import type { Ad, AdType } from "@/lib/types";
import AdTypeSelector from "./AdTypeSelector";
import AdCard from "./AdCard";
import SectionHeader from "./SectionHeader";

interface AvisosDashboardProps {
  ads: Ad[];
}

const AD_TYPE_LABELS: Record<AdType, string> = {
  leaderboard: "Leaderboard",
  rectangle: "Rectangle",
  sidebar: "Sidebar",
  modal: "Modal",
  infeed: "In-Feed",
  sticky_footer: "Sticky Footer",
};

export default function AvisosDashboard({ ads }: AvisosDashboardProps) {
  const [selectedType, setSelectedType] = useState<AdType | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = ads.filter((ad) => {
    const matchesType = selectedType === "all" || ad.type === selectedType;
    const matchesSearch =
      search === "" ||
      ad.title.toLowerCase().includes(search.toLowerCase()) ||
      (ad.client_name || "").toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <>
      <SectionHeader
        title="Avisos Publicitarios"
        action={{ label: "+ Nuevo Aviso", href: "/admin/ads/new" }}
        count={ads.length}
        searchPlaceholder="Buscar por título o cliente..."
        searchValue={search}
        onSearchChange={setSearch}
      />

      <AdTypeSelector
        ads={ads}
        selectedType={selectedType}
        onSelectType={setSelectedType}
      />

      {filtered.length === 0 ? (
        <div className="bg-paper rounded-lg p-12 text-center border border-border">
          <p className="text-muted">No se encontraron avisos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ad) => (
            <AdCard key={ad.id} ad={ad} />
          ))}
        </div>
      )}
    </>
  );
}