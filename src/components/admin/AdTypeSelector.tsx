"use client";

import type { AdType, Ad } from "@/lib/types";

const AD_TYPE_INFO: Record<AdType, { label: string; dimensions: string; description: string }> = {
  leaderboard: { label: "Leaderboard", dimensions: "1280 × 160 · 8:1", description: "Barra horizontal superior" },
  rectangle: { label: "Rectangle", dimensions: "400 × 250 · 8:5", description: "Rectángulo medio" },
  sidebar: { label: "Sidebar", dimensions: "400 × 250 · 8:5", description: "Columna lateral" },
  modal: { label: "Modal", dimensions: "hasta 900 × 600", description: "Ventana emergente" },
  infeed: { label: "In-Feed", dimensions: "400 × 250 · 8:5", description: "Dentro del contenido" },
  sticky_footer: { label: "Sticky Footer", dimensions: "1280 × 160 · 8:1", description: "Barra inferior fija (móvil)" },
};

// Silhouette proportions for each ad type on a miniature page
const AD_TYPE_SILHOUETTES: Record<AdType, { top: number; left: number; width: number; height: number; color: string }> = {
  leaderboard: { top: 0, left: 0, width: 100, height: 12, color: "#c8102e" },
  rectangle: { top: 10, left: 68, width: 30, height: 40, color: "#c8102e" },
  sidebar: { top: 10, left: 72, width: 26, height: 75, color: "#c8102e" },
  modal: { top: 25, left: 20, width: 60, height: 35, color: "#c8102e" },
  infeed: { top: 40, left: 0, width: 100, height: 18, color: "#c8102e" },
  sticky_footer: { top: 88, left: 0, width: 100, height: 12, color: "#c8102e" },
};

interface AdTypeSelectorProps {
  ads: Ad[];
  selectedType: AdType | "all";
  onSelectType: (type: AdType | "all") => void;
}

export default function AdTypeSelector({ ads, selectedType, onSelectType }: AdTypeSelectorProps) {
  const types: AdType[] = ["leaderboard", "rectangle", "sidebar", "modal", "infeed", "sticky_footer"];

  const getCounts = (type: AdType) => {
    const filtered = ads.filter((ad) => ad.type === type);
    return { active: filtered.filter((ad) => ad.active).length, total: filtered.length };
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {/* "All" card */}
      <button
        onClick={() => onSelectType("all")}
        className={`rounded-lg border-2 p-3 text-left transition-all ${
          selectedType === "all"
            ? "border-[var(--color-brand)] bg-[var(--color-brand)]/5"
            : "border-border bg-paper hover:border-ink/30"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold tracking-wide uppercase text-ink">Todos</span>
          <span className="text-[10px] text-muted">{ads.length}</span>
        </div>
        <div className="text-[10px] text-muted leading-tight">
          {ads.filter((a) => a.active).length} activos
        </div>
      </button>

      {types.map((type) => {
        const info = AD_TYPE_INFO[type];
        const silhouette = AD_TYPE_SILHOUETTES[type];
        const counts = getCounts(type);
        const isActive = selectedType === type;

        return (
          <button
            key={type}
            onClick={() => onSelectType(type)}
            className={`rounded-lg border-2 p-3 text-left transition-all ${
              isActive
                ? "border-[var(--color-brand)] bg-[var(--color-brand)]/5"
                : "border-border bg-paper hover:border-ink/30"
            }`}
          >
            {/* Miniature page silhouette */}
            <div className="relative w-full h-16 mb-2 bg-ink/5 rounded overflow-hidden">
              {/* Page lines */}
              <div className="absolute top-[4%] left-[5%] w-[55%] h-[4%] bg-ink/10 rounded-sm" />
              <div className="absolute top-[10%] left-[5%] w-[55%] h-[3%] bg-ink/6 rounded-sm" />
              <div className="absolute top-[60%] left-[5%] w-[55%] h-[3%] bg-ink/6 rounded-sm" />
              <div className="absolute top-[65%] left-[5%] w-[40%] h-[3%] bg-ink/6 rounded-sm" />
              <div className="absolute top-[72%] left-[5%] w-[55%] h-[3%] bg-ink/6 rounded-sm" />
              {/* Ad position highlight */}
              <div
                className="absolute rounded-sm opacity-80"
                style={{
                  top: `${silhouette.top}%`,
                  left: `${silhouette.left}%`,
                  width: `${silhouette.width}%`,
                  height: `${silhouette.height}%`,
                  backgroundColor: silhouette.color,
                }}
              />
            </div>

            <span className="text-xs font-bold text-ink block leading-tight">{info.label}</span>
            <span className="text-[10px] text-muted">{info.dimensions}</span>
            <div className="text-[10px] text-muted mt-0.5">
              {counts.active} activo{counts.active !== 1 ? "s" : ""} de {counts.total}
            </div>
          </button>
        );
      })}
    </div>
  );
}