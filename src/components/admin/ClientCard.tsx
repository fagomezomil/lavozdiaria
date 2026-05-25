"use client";

import Link from "next/link";

interface ClientCardProps {
  client: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    ad_count: number;
    active_ad_count: number;
  };
}

export default function ClientCard({ client }: ClientCardProps) {
  const initials = client.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Link
      href={`/admin/clients/${client.id}`}
      className="block bg-paper rounded-lg border border-border p-4 hover:shadow-md hover:border-ink/20 transition-all group"
    >
      {/* Initials circle */}
      <div className="w-12 h-12 rounded-full bg-ink text-white flex items-center justify-center text-sm font-bold font-[family-name:var(--font-heading)] mb-3">
        {initials}
      </div>

      <h3 className="text-sm font-bold text-ink font-[family-name:var(--font-heading)] group-hover:underline">
        {client.name}
      </h3>

      <div className="mt-1 space-y-0.5 text-xs text-muted">
        {client.email && <div>{client.email}</div>}
        {client.phone && <div>{client.phone}</div>}
      </div>

      <div className="flex items-center gap-2 mt-3">
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#10b981]/15 text-[#10b981]">
          {client.active_ad_count} activo{client.active_ad_count !== 1 ? "s" : ""}
        </span>
        <span className="text-[10px] text-muted">
          {client.ad_count} total
        </span>
      </div>
    </Link>
  );
}