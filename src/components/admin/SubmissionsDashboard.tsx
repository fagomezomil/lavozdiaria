"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { EventSubmission, SubmissionStatus, AgendaCategory } from "@/lib/types";
import SectionHeader from "./SectionHeader";
import {
  approveSubmission,
  rejectSubmission,
  deleteSubmission,
} from "@/app/agenda/submit/actions";

const CAT_LABEL: Record<AgendaCategory, string> = {
  cultural: "Cultural",
  turistico: "Turístico",
  deportivo: "Deportivo",
};

const STATUS_LABEL: Record<SubmissionStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
};

const STATUS_COLOR: Record<SubmissionStatus, string> = {
  pending: "#f59e0b",
  approved: "#10b981",
  rejected: "#e63946",
};

const STATUS_FILTERS = [
  { label: "Pendientes", value: "pending" },
  { label: "Aprobadas", value: "approved" },
  { label: "Rechazadas", value: "rejected" },
];

/** Solo http(s):// — defense in depth contra javascript:/data: schemes. */
function isSafeUrl(u?: string | null): u is string {
  return !!u && /^https?:\/\//i.test(u);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function SubmissionCard({ sub }: { sub: EventSubmission }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const doApprove = () => {
    setError(null);
    startTransition(async () => {
      const res = await approveSubmission(sub.id);
      if (res.error) { setError(res.error); return; }
      router.refresh();
    });
  };

  const doReject = () => {
    setError(null);
    startTransition(async () => {
      const res = await rejectSubmission(sub.id, reason || undefined);
      if (res.error) { setError(res.error); return; }
      setShowReject(false);
      setReason("");
      router.refresh();
    });
  };

  const doDelete = () => {
    if (!confirm("¿Eliminar esta propuesta definitivamente?")) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteSubmission(sub.id);
      if (res.error) { setError(res.error); return; }
      router.refresh();
    });
  };

  return (
    <div className="bg-paper border border-border rounded-lg p-5 shadow-sm">
      <div className="flex items-start gap-4 flex-wrap">
        {isSafeUrl(sub.imageUrl) ? (
          <img
            src={sub.imageUrl}
            alt={sub.title}
            className="w-20 h-20 rounded object-cover border border-border shrink-0"
            onError={(e) => { (e.currentTarget.style.display = "none"); }}
          />
        ) : (
          <div className="w-20 h-20 rounded bg-ink/5 border border-border shrink-0 flex items-center justify-center text-muted text-xs">
            sin img
          </div>
        )}
        <div className="flex-1 min-w-[240px]">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded text-white"
              style={{ backgroundColor: STATUS_COLOR[sub.status] }}
            >
              {STATUS_LABEL[sub.status]}
            </span>
            <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-ink/10 text-ink">
              {CAT_LABEL[sub.category]}
            </span>
            {sub.subcategory && (
              <span className="text-xs text-muted">{sub.subcategory}</span>
            )}
          </div>
          <h3 className="font-bold text-ink text-lg leading-tight">{sub.title}</h3>
          <div className="text-xs text-muted mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
            <span>📅 {sub.date}{sub.endDate ? ` → ${sub.endDate}` : ""}{sub.time ? ` · ${sub.time}` : ""}</span>
            {sub.venueName && <span>📍 {sub.venueName}{sub.venueCity ? `, ${sub.venueCity}` : ""}</span>}
            {sub.priceRange && <span>💰 {sub.priceRange}</span>}
          </div>
          {sub.description && (
            <p className="text-sm text-ink/80 mt-2 line-clamp-3">{sub.description}</p>
          )}
          {isSafeUrl(sub.ticketUrl) && (
            <a href={sub.ticketUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#3b82f6] hover:underline mt-1 inline-block">
              Link entradas ↗
            </a>
          )}
          <div className="text-[11px] text-muted mt-2">
            Enviada {formatDate(sub.submittedAt)}
            {sub.reviewedAt && <> · Revisada {formatDate(sub.reviewedAt)}</>}
            {sub.contactEmail && <> · ✉ {sub.contactEmail}</>}
            {sub.publishedEventId && (
              <> · <Link href={`/agenda`} className="text-[#10b981] hover:underline">Evento publicado</Link></>
            )}
          </div>
          {sub.status === "rejected" && sub.rejectionReason && (
            <div className="mt-2 text-xs text-[#e63946] bg-[#e63946]/10 border border-[#e63946]/20 rounded p-2">
              Motivo: {sub.rejectionReason}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-3 text-xs text-[#e63946] bg-[#e63946]/10 border border-[#e63946]/20 rounded p-2">
          {error}
        </div>
      )}

      {showReject && sub.status === "pending" && (
        <div className="mt-3 bg-cream border border-border rounded p-3">
          <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">
            Motivo del rechazo (opcional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Ej: Falta información del lugar, la imagen no corresponde, etc."
            className="w-full px-2 py-1.5 text-sm border border-border rounded bg-white text-ink focus:outline-none focus:border-ink/30"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={doReject}
              disabled={pending}
              className="px-3 py-1.5 text-xs font-bold rounded bg-[#e63946] text-white hover:bg-[#c2410c] transition-colors disabled:opacity-50"
            >
              {pending ? "Rechazando…" : "Confirmar rechazo"}
            </button>
            <button
              onClick={() => { setShowReject(false); setReason(""); }}
              className="px-3 py-1.5 text-xs font-semibold rounded border border-border bg-paper text-ink hover:bg-ink/5"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {sub.status === "pending" && !showReject && (
        <div className="flex gap-2 mt-3 flex-wrap">
          <button
            onClick={doApprove}
            disabled={pending}
            className="px-3 py-1.5 text-xs font-bold rounded bg-[#10b981] text-white hover:bg-[#0d9488] transition-colors disabled:opacity-50"
          >
            {pending ? "…" : "✓ Aprobar y publicar"}
          </button>
          <button
            onClick={() => setShowReject(true)}
            disabled={pending}
            className="px-3 py-1.5 text-xs font-bold rounded bg-[#e63946] text-white hover:bg-[#c2410c] transition-colors disabled:opacity-50"
          >
            ✕ Rechazar
          </button>
          <button
            onClick={doDelete}
            disabled={pending}
            className="px-3 py-1.5 text-xs font-semibold rounded border border-border bg-paper text-muted hover:text-[#e63946] hover:border-[#e63946]/30"
          >
            Eliminar
          </button>
        </div>
      )}

      {sub.status !== "pending" && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={doDelete}
            disabled={pending}
            className="px-3 py-1.5 text-xs font-semibold rounded border border-border bg-paper text-muted hover:text-[#e63946] hover:border-[#e63946]/30"
          >
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}

interface SubmissionsDashboardProps {
  submissions: EventSubmission[];
  currentStatus: SubmissionStatus;
}

export default function SubmissionsDashboard({ submissions, currentStatus }: SubmissionsDashboardProps) {
  const router = useRouter();

  const changeStatus = (value: string) => {
    router.push(`/admin/agenda/submissions?status=${value}`);
  };

  return (
    <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto">
      <SectionHeader
        title="Propuestas de eventos"
        subtitle="Cola de moderación de eventos enviados por usuarios desde /agenda/submit"
        count={submissions.length}
        filters={STATUS_FILTERS}
        activeFilter={currentStatus}
        onFilterChange={changeStatus}
      />

      {submissions.length === 0 ? (
        <div className="bg-paper border border-dashed border-border rounded-lg p-12 text-center">
          <p className="text-muted text-sm">
            No hay propuestas <span className="font-semibold">{STATUS_LABEL[currentStatus].toLowerCase()}</span>.
          </p>
          <p className="text-muted text-xs mt-1">
            Cuando un usuario envíe una propuesta desde /agenda/submit, aparece acá.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {submissions.map((sub) => (
            <SubmissionCard key={sub.id} sub={sub} />
          ))}
        </div>
      )}
    </div>
  );
}