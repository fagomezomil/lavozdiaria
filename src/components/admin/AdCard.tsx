"use client";

import Link from "next/link";
import type { Ad, Section } from "@/lib/types";
import { sectionConfig } from "@/lib/types";
import AdDeleteButton from "./AdDeleteButton";

interface AdCardProps {
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

export default function AdCard({ ad }: AdCardProps) {
  const cfg = ad.section ? sectionConfig[ad.section as Section] : null;
  const remaining = daysRemaining(ad.expires_at);
  const isExpired = remaining !== null && remaining < 0;

  return (
    <div className="bg-paper rounded-lg border border-border overflow-hidden hover:shadow-md transition-shadow group">
      {/* Ad image preview */}
      <Link href={`/admin/ads/${ad.id}/edit`} className="block">
        {ad.image_url ? (
          <div className="relative bg-ink/5 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ad.image_url}
              alt={ad.title}
              className="w-full object-contain"
              style={{
                maxHeight: ad.type === "leaderboard" ? "60px" : ad.type === "sticky_footer" ? "40px" : "200px",
              }}
            />
            {/* Mobile image indicator */}
            {ad.mobile_image_url && (
              <span className="absolute top-1 right-1 text-[9px] font-bold bg-ink text-white px-1.5 py-0.5 rounded">
                Mobile
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center bg-ink/5 h-24 text-muted text-xs">
            Sin imagen
          </div>
        )}
      </Link>

      {/* Card body */}
      <div className="p-3">
        {/* Title */}
        <Link href={`/admin/ads/${ad.id}/edit`} className="block group-hover:underline">
          <h3 className="text-sm font-bold text-ink font-[family-name:var(--font-heading)] line-clamp-1">
            {ad.title}
          </h3>
        </Link>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <span className="text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded bg-ink/10 text-ink">
            {TYPE_LABELS[ad.type] || ad.type}
          </span>
          {cfg && (
            <span
              className="text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}
            >
              {cfg.label}
            </span>
          )}
          {ad.active ? (
            <span className="text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded bg-[#10b981]/15 text-[#10b981]">
              Activo
            </span>
          ) : (
            <span className="text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded bg-[#e63946]/15 text-[#e63946]">
              Inactivo
            </span>
          )}
          {isExpired && (
            <span className="text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded bg-[#e63946]/15 text-[#e63946]">
              Vencido
            </span>
          )}
        </div>

        {/* Meta */}
        <div className="mt-2 text-[11px] text-muted space-y-0.5">
          {ad.client_name && <div>Cliente: {ad.client_name}</div>}
          <div>
            {formatDate(ad.starts_at)} → {formatDate(ad.expires_at)}
            {remaining !== null && !isExpired && (
              <span className="ml-1 text-ink font-semibold">({remaining}d)</span>
            )}
          </div>
          <div>Prioridad: {ad.priority}</div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border">
          <Link
            href={`/admin/ads/${ad.id}/edit`}
            className="text-xs font-semibold text-ink hover:text-[var(--color-brand)] transition-colors"
          >
            Editar
          </Link>
          <span className="text-border">·</span>
          <AdDeleteButton id={ad.id} />
        </div>
      </div>
    </div>
  );
}