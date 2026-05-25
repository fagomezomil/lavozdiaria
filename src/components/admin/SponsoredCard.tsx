"use client";

import Link from "next/link";
import type { SponsoredContent, Section } from "@/lib/types";
import { sectionConfig } from "@/lib/types";

interface SponsoredCardProps {
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

export default function SponsoredCard({ content }: SponsoredCardProps) {
  const cfg = sectionConfig[content.section as Section];
  const remaining = daysRemaining(content.expiresAt);
  const isExpired = content.expiresAt && new Date(content.expiresAt) < new Date();
  const isActive = content.active && !isExpired;

  return (
    <div className="bg-paper rounded-lg border border-border overflow-hidden hover:shadow-md transition-shadow group">
      {/* Image */}
      <Link href={`/admin/sponsored/${content.id}/edit`} className="block">
        {content.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={content.imageUrl}
            alt={content.imageAlt || content.title}
            className="w-full h-40 object-cover border-t-2"
            style={{ borderTopColor: cfg?.color }}
          />
        ) : (
          <div
            className="w-full h-40 flex items-center justify-center border-t-2"
            style={{ borderTopColor: cfg?.color, background: cfg ? `linear-gradient(135deg, ${cfg.color}15, ${cfg.color}05)` : undefined }}
          >
            <span className="text-3xl font-[family-name:var(--font-heading)] opacity-15" style={{ color: cfg?.color }}>LV</span>
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="p-3">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
          {cfg && (
            <span
              className="text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}
            >
              {cfg.label}
            </span>
          )}
          {isActive ? (
            <span className="text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded bg-[#10b981]/15 text-[#10b981]">
              Activo
            </span>
          ) : (
            <span className="text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded bg-[#e63946]/15 text-[#e63946]">
              Inactivo
            </span>
          )}
          {content.showOnHomepage && (
            <span className="text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded bg-[#10b981]/10 text-[#10b981]">
              Portada
            </span>
          )}
          {content.showInSidebar && (
            <span className="text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded bg-[#8b5cf6]/10 text-[#8b5cf6]">
              Sidebar
            </span>
          )}
        </div>

        <Link href={`/admin/sponsored/${content.id}/edit`} className="block group-hover:underline">
          <h3 className="text-sm font-bold text-ink font-[family-name:var(--font-heading)] line-clamp-2">
            {content.title}
          </h3>
        </Link>

        {content.excerpt && (
          <p className="text-xs text-muted line-clamp-2 mt-0.5">{content.excerpt}</p>
        )}

        <div className="text-[11px] text-muted mt-2 space-y-0.5">
          {content.clientName && <div>Cliente: {content.clientName}</div>}
          <div>
            {formatDate(content.startsAt)} → {formatDate(content.expiresAt)}
            {remaining !== null && remaining >= 0 && (
              <span className="ml-1 text-ink font-semibold">({remaining}d)</span>
            )}
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-border">
          <Link
            href={`/admin/sponsored/${content.id}/edit`}
            className="text-xs font-semibold text-ink hover:text-[var(--color-brand)] transition-colors"
          >
            Editar
          </Link>
        </div>
      </div>
    </div>
  );
}