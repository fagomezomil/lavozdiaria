"use client";

import Link from "next/link";
import type { Ad } from "@/lib/types";
import AdDeleteButton from "./AdDeleteButton";

interface AdRowProps {
  ad: Ad;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

function daysRemaining(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

const TYPE_LABELS: Record<string, string> = {
  leaderboard: "Leaderboard",
  rectangle: "Rectangle",
  sidebar: "Sidebar",
  modal: "Modal",
  infeed: "In-Feed",
  sticky_footer: "Sticky Footer",
};

export default function AdRow({ ad }: AdRowProps) {
  const remaining = daysRemaining(ad.expires_at);
  const isExpired = remaining !== null && remaining < 0;
  const isExpiringSoon = remaining !== null && remaining >= 0 && remaining <= 7;

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 bg-paper border border-border rounded hover:border-ink/30 transition-colors group">
      {/* Mini image */}
      <Link href={`/admin/ads/${ad.id}/edit`} className="shrink-0">
        {ad.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ad.image_url}
            alt={ad.title}
            className="w-10 h-10 object-contain rounded bg-ink/5"
          />
        ) : (
          <div className="w-10 h-10 rounded bg-ink/5 flex items-center justify-center text-[9px] text-muted">
            sin img
          </div>
        )}
      </Link>

      {/* Title + client */}
      <Link href={`/admin/ads/${ad.id}/edit`} className="flex-1 min-w-0 group-hover:underline">
        {ad.client_name && (
          <div className="text-[10px] font-bold tracking-widest uppercase text-brand leading-tight truncate">
            {ad.client_name}
          </div>
        )}
        <div className="text-sm font-semibold text-ink font-[family-name:var(--font-heading)] truncate">
          {ad.title}
        </div>
      </Link>

      {/* Type badge */}
      <span className="hidden md:inline-block text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded bg-ink/10 text-ink whitespace-nowrap">
        {TYPE_LABELS[ad.type] || ad.type}
      </span>

      {/* Vigencia */}
      <div className="hidden lg:block text-[11px] text-muted whitespace-nowrap min-w-[140px]">
        {formatDate(ad.starts_at)} → {formatDate(ad.expires_at)}
        {remaining !== null && !isExpired && (
          <span className={`ml-1 font-semibold ${isExpiringSoon ? "text-[#e63946]" : "text-ink"}`}>
            ({remaining}d)
          </span>
        )}
      </div>

      {/* Estado */}
      <div className="hidden sm:block">
        {isExpired ? (
          <span className="text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded bg-[#e63946]/15 text-[#e63946] whitespace-nowrap">
            Vencido
          </span>
        ) : ad.active ? (
          <span className="text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] whitespace-nowrap">
            Activo
          </span>
        ) : (
          <span className="text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded bg-[#e63946]/15 text-[#e63946] whitespace-nowrap">
            Inactivo
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href={`/admin/ads/${ad.id}/edit`}
          className="text-xs font-semibold text-ink hover:text-[var(--color-brand)] transition-colors whitespace-nowrap"
        >
          Editar
        </Link>
        <span className="text-border">·</span>
        <AdDeleteButton id={ad.id} />
      </div>
    </div>
  );
}