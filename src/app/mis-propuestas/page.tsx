import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMySubmissions } from "@/lib/submissions";
import type { EventSubmission, SubmissionStatus, AgendaCategory } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mis propuestas | ¡QUE NOTICIA!",
  description: "Estado de las propuestas de eventos que enviaste.",
};

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

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function isSafeUrl(u?: string | null): u is string {
  return !!u && /^https?:\/\//i.test(u);
}

export default async function MyPropuestasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/mis-propuestas");

  const submissions = await getMySubmissions();

  return (
    <div className="min-h-screen bg-cream py-10">
      <div className="max-w-3xl mx-auto px-4">
        <p className="text-agenda text-xs font-semibold uppercase tracking-widest mb-2">
          Agenda Cultural Tucumán
        </p>
        <h1 className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl uppercase tracking-tight text-ink leading-none">
          Mis propuestas
        </h1>
        <p className="text-muted text-sm mt-3">
          Acá ves el estado de los eventos que mandaste a la cola de moderación.
        </p>

        <div className="mt-4 mb-8 flex gap-2 flex-wrap">
          <a
            href="/agenda/submit"
            className="px-4 py-2 bg-agenda text-white text-sm font-bold rounded hover:bg-agenda-deep transition-colors font-[family-name:var(--font-heading)] uppercase tracking-wide"
          >
            + Enviar otra propuesta
          </a>
          <a
            href="/agenda"
            className="px-4 py-2 border border-border bg-paper text-ink text-sm font-semibold rounded hover:bg-ink/5"
          >
            Volver a Agenda
          </a>
        </div>

        {submissions.length === 0 ? (
          <div className="bg-paper border border-dashed border-border rounded-lg p-12 text-center">
            <p className="text-muted text-sm">Todavía no enviaste ninguna propuesta.</p>
            <p className="text-muted text-xs mt-1">
              Andá a <a href="/agenda/submit" className="text-agenda hover:underline">/agenda/submit</a> para mandar la primera.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((s) => (
              <div key={s.id} className="bg-paper border border-border rounded-lg p-4 flex gap-4">
                {isSafeUrl(s.imageUrl) ? (
                  <img
                    src={s.imageUrl}
                    alt={s.title}
                    className="w-16 h-16 rounded object-cover border border-border shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded bg-ink/5 border border-border shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded text-white"
                      style={{ backgroundColor: STATUS_COLOR[s.status] }}
                    >
                      {STATUS_LABEL[s.status]}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-ink/10 text-ink">
                      {CAT_LABEL[s.category]}
                    </span>
                  </div>
                  <h3 className="font-bold text-ink leading-tight">{s.title}</h3>
                  <div className="text-xs text-muted mt-1">
                    📅 {s.date}{s.time ? ` · ${s.time}` : ""}
                    {s.venueName ? ` · 📍 ${s.venueName}` : ""}
                  </div>
                  <div className="text-[11px] text-muted mt-1">
                    Enviada {formatDate(s.submittedAt)}
                    {s.reviewedAt && <> · Revisada {formatDate(s.reviewedAt)}</>}
                  </div>
                  {s.status === "rejected" && s.rejectionReason && (
                    <div className="mt-2 text-xs text-[#e63946] bg-[#e63946]/10 border border-[#e63946]/20 rounded p-2">
                      Motivo del rechazo: {s.rejectionReason}
                    </div>
                  )}
                  {s.status === "approved" && (
                    <div className="mt-2 text-xs text-[#10b981] bg-[#10b981]/10 border border-[#10b981]/20 rounded p-2">
                      ✓ Tu evento fue publicado en /agenda
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}