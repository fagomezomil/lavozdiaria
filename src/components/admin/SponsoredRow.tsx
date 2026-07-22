"use client";

import Link from "next/link";
import type { SponsoredContent, Section } from "@/lib/types";
import { sectionConfig } from "@/lib/types";
import ToggleSponsoredActiveButton from "./ToggleSponsoredActiveButton";

interface SponsoredRowProps {
  content: SponsoredContent;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

function daysRemaining(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function SponsoredRow({ content }: SponsoredRowProps) {
  const cfg = sectionConfig[content.section as Section];
  const remaining = daysRemaining(content.expiresAt);
  const isExpired = content.expiresAt && new Date(content.expiresAt) < new Date();
  const isActive = content.active && !isExpired;
  const isExpiringSoon = remaining !== null && remaining >= 0 && remaining <= 7;

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 bg-paper border border-border rounded hover:border-ink/30 transition-colors group">
      {/* Mini image */}
      <Link href={`/admin/sponsored/${content.id}/edit`} className="shrink-0">
        {content.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={content.imageUrl}
            alt={content.imageAlt || content.title}
            className="w-10 h-10 object-cover rounded bg-ink/5"
          />
        ) : (
          <div
            className="w-10 h-10 rounded flex items-center justify-center text-[9px] font-bold text-muted"
            style={{ background: cfg ? `${cfg.color}15` : undefined }}
          >
            sin img
          </div>
        )}
      </Link>

      {/* Title + client */}
      <Link href={`/admin/sponsored/${content.id}/edit`} className="flex-1 min-w-0 group-hover:underline">
        {content.clientName && (
          <div className="text-[10px] font-bold tracking-widest uppercase text-brand leading-tight truncate">
            {content.clientName}
          </div>
        )}
        <div className="text-sm font-semibold text-ink font-[family-name:var(--font-heading)] truncate">
          {content.title}
        </div>
      </Link>

      {/* Section badge */}
      {cfg && (
        <span
          className="hidden md:inline-block text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded whitespace-nowrap"
          style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}
        >
          {cfg.label}
        </span>
      )}

      {/* Vigencia */}
      <div className="hidden lg:block text-[11px] text-muted whitespace-nowrap min-w-[140px]">
        {formatDate(content.startsAt)} → {formatDate(content.expiresAt)}
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
        ) : isActive ? (
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
          href={`/admin/sponsored/${content.id}/edit`}
          className="text-xs font-semibold text-ink hover:text-[var(--color-brand)] transition-colors whitespace-nowrap"
        >
          Editar
        </Link>
        <span className="text-border">·</span>
        <ToggleSponsoredActiveButton sponsoredId={content.id} currentActive={content.active} />
      </div>
    </div>
  );
}