"use client";

import { useState, useTransition } from "react";
import { sectionConfig } from "@/lib/types";
import {
  retrySocialPost,
  triggerNewPostDryRun,
  publishNow,
  publishArticle,
  publishEvent,
  deleteSocialPost,
} from "@/app/admin/redes/actions";
import { AGENDA_COLORS, AGENDA_LABELS } from "@/lib/social/slide-template";

interface PostRow {
  id: string;
  scheduled_at: string;
  published_at: string | null;
  article_ids: (string | null)[];
  sections: string[];
  slide_image_urls: string[];
  caption: string;
  buffer_update_ids: string[] | null;
  status: "pending" | "published" | "failed" | "skipped";
  kind: "nota" | "evento";
  error_message: string | null;
  created_at: string;
}

interface ArticleOption {
  id: string;
  title: string;
  section: string;
  created_at: string;
}

interface EventOption {
  id: string;
  title: string;
  category: string;
  date_iso: string | null;
  venue_name: string | null;
  created_at: string;
}

interface ChannelOption {
  id: string;
  service: string;
  name: string;
  usedToday: number;
  limit: number;
  remaining: number;
}

interface RedesDashboardProps {
  posts: PostRow[];
  articles: ArticleOption[];
  events: EventOption[];
  channels: ChannelOption[];
  config: {
    bufferKeyConfigured: boolean;
    channelIdsCount: number;
    cronSecretConfigured: boolean;
  };
}

const STATUS_STYLES: Record<PostRow["status"], string> = {
  published: "bg-emerald-100 text-emerald-800 border-emerald-300",
  pending: "bg-amber-100 text-amber-800 border-amber-300",
  failed: "bg-red-100 text-red-800 border-red-300",
  skipped: "bg-zinc-100 text-zinc-600 border-zinc-300",
};

const STATUS_LABELS: Record<PostRow["status"], string> = {
  published: "Publicado",
  pending: "Pendiente",
  failed: "Fallido",
  skipped: "Salteado",
};

/** Formato determinista (sin locale-specific separators que rompen hydration). */
function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dd}/${mm} ${hh}:${min}`;
  } catch {
    return iso;
  }
}

export default function RedesDashboard({ posts, articles, events, channels, config }: RedesDashboardProps) {
  const [filter, setFilter] = useState<PostRow["status"] | "all">("all");
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  // Manual publish state
  const [contentType, setContentType] = useState<"nota" | "evento">("nota");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedArticleId, setSelectedArticleId] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState<string>("");

  const filtered = filter === "all" ? posts : posts.filter((p) => p.status === filter);

  const counts = posts.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1;
    return acc;
  }, {});

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleRetry = (postId: string) => {
    startTransition(async () => {
      const r = await retrySocialPost(postId);
      showToast(r.success ? "Republicado a Buffer" : `Error: ${r.error}`);
    });
  };

  const handleDryRun = () => {
    startTransition(async () => {
      const r = await triggerNewPostDryRun();
      showToast(r.success ? `Generado: ${r.slides} slides` : `Error: ${r.error}`);
    });
  };

  const handlePublish = () => {
    if (
      !confirm(
        "¿Publicar ahora a Buffer? Va a postear el carrusel a tus cuentas de FB + IG reales.",
      )
    )
      return;
    startTransition(async () => {
      const r = await publishNow();
      showToast(
        r.success
          ? `Publicado: ${r.slides} slides a Buffer`
          : `Error: ${r.error ?? "falló la publicación"}`,
      );
    });
  };

  const handleDelete = (postId: string) => {
    if (!confirm("¿Eliminar este registro del historial?")) return;
    startTransition(async () => {
      await deleteSocialPost(postId);
      showToast("Registro eliminado");
    });
  };

  const handlePublishArticle = () => {
    if (contentType === "nota" && !selectedArticleId) {
      showToast("Elegí una nota primero");
      return;
    }
    if (contentType === "evento" && !selectedEventId) {
      showToast("Elegí un evento primero");
      return;
    }
    if (selectedChannels.length === 0 && channels.length > 0) {
      showToast("Elegí al menos un canal");
      return;
    }
    const confirmMsg = scheduledAt
      ? `¿Programar para ${new Date(scheduledAt).toLocaleString("es-AR")}?`
      : "¿Publicar ahora mismo a los canales seleccionados?";
    if (!confirm(confirmMsg)) return;
    startTransition(async () => {
      const r =
        contentType === "evento"
          ? await publishEvent(selectedEventId, selectedChannels, scheduledAt || undefined)
          : await publishArticle(selectedArticleId, selectedChannels, scheduledAt || undefined);
      showToast(
        r.success
          ? `Publicado: ${selectedChannels.length || channels.length} canal(es)`
          : `Error: ${r.error ?? "falló"}`,
      );
      if (r.success) {
        setSelectedArticleId("");
        setSelectedEventId("");
        setSelectedSection("");
        setSelectedCategory("");
        setSelectedChannels([]);
        setScheduledAt("");
      }
    });
  };

  const filteredArticles = selectedSection
    ? articles.filter((a) => a.section === selectedSection)
    : articles;
  const filteredEvents = selectedCategory
    ? events.filter((e) => e.category === selectedCategory)
    : events;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-ink">
          Redes — Publicación automática
        </h1>
        <p className="text-sm text-muted mt-1">
          Carrusel de 5 noticias (1 por sección) publicado a FB + IG + TikTok via Buffer, 2×/día.
        </p>
      </header>

      {/* Config status */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <ConfigCard
          label="Buffer API Key"
          ok={config.bufferKeyConfigured}
          okLabel="Configurada"
          notOkLabel="Falta cargar BUFFER_API_KEY"
        />
        <ConfigCard
          label="Buffer Channels"
          ok={config.channelIdsCount > 0}
          okLabel={`${config.channelIdsCount} canal(es) explícito(s)`}
          notOkLabel="Sin filtro (auto-detecta todos)"
        />
        <ConfigCard
          label="CRON_SECRET"
          ok={config.cronSecretConfigured}
          okLabel="Configurado"
          notOkLabel="Falta cargar CRON_SECRET"
        />
      </section>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={handleDryRun}
          disabled={pending}
          className="px-4 py-2 bg-ink text-white text-sm font-bold rounded hover:bg-ink/80 disabled:opacity-50"
        >
          Generar carrusel ahora (dry-run)
        </button>
        <button
          onClick={handlePublish}
          disabled={pending}
          className="px-4 py-2 bg-brand text-white text-sm font-bold rounded hover:bg-brand/80 disabled:opacity-50"
        >
          Publicar ahora a Buffer
        </button>
      </div>

      {/* Publicación manual de nota o evento específico */}
      <section className="mb-6 p-4 border border-border rounded bg-paper">
        <h2 className="text-sm font-bold font-[family-name:var(--font-heading)] text-ink mb-3">
          Publicar contenido específico
        </h2>
        <p className="text-xs text-muted mb-4">
          Elegí una nota o un evento de agenda y publicalo a uno o más canales ahora mismo, o programalo para una fecha/hora específica.
        </p>

        {/* Selector tipo */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => {
              setContentType("nota");
              setSelectedArticleId("");
              setSelectedEventId("");
            }}
            className={`px-4 py-2 text-xs font-bold rounded border ${
              contentType === "nota"
                ? "bg-ink text-white border-ink"
                : "bg-paper text-ink border-border hover:bg-ink/5"
            }`}
          >
            Nota
          </button>
          <button
            type="button"
            onClick={() => {
              setContentType("evento");
              setSelectedArticleId("");
              setSelectedEventId("");
            }}
            className={`px-4 py-2 text-xs font-bold rounded border ${
              contentType === "evento"
                ? "bg-ink text-white border-ink"
                : "bg-paper text-ink border-border hover:bg-ink/5"
            }`}
          >
            Evento de agenda
          </button>
        </div>

        {contentType === "nota" && articles.length === 0 ? (
          <div className="text-xs text-muted p-3 bg-cream rounded">
            No hay notas recientes (últimos 7 días) para publicar.
          </div>
        ) : contentType === "evento" && events.length === 0 ? (
          <div className="text-xs text-muted p-3 bg-cream rounded">
            No hay eventos próximos para publicar.
          </div>
        ) : (
          <>
            {/* Selector nota */}
            {contentType === "nota" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                    Sección
                  </label>
                  <select
                    value={selectedSection}
                    onChange={(e) => {
                      setSelectedSection(e.target.value);
                      setSelectedArticleId("");
                    }}
                    className="w-full px-3 py-2 text-sm border border-border rounded bg-white"
                  >
                    <option value="">Todas las secciones</option>
                    {Object.entries(sectionConfig).map(([key, cfg]) => {
                      const count = articles.filter((a) => a.section === key).length;
                      return (
                        <option key={key} value={key}>
                          {cfg.label} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                    Nota
                  </label>
                  <select
                    value={selectedArticleId}
                    onChange={(e) => setSelectedArticleId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded bg-white"
                  >
                    <option value="">Elegir nota…</option>
                    {filteredArticles.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title.length > 70 ? a.title.slice(0, 70) + "…" : a.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Selector evento */}
            {contentType === "evento" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                    Categoría
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setSelectedEventId("");
                    }}
                    className="w-full px-3 py-2 text-sm border border-border rounded bg-white"
                  >
                    <option value="">Todas las categorías</option>
                    {Object.entries(AGENDA_LABELS).map(([key, label]) => {
                      const count = events.filter((e) => e.category === key).length;
                      if (count === 0) return null;
                      return (
                        <option key={key} value={key}>
                          {label} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                    Evento
                  </label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded bg-white"
                  >
                    <option value="">Elegir evento…</option>
                    {filteredEvents.map((e) => {
                      const date = e.date_iso ? e.date_iso.slice(8, 10) + "/" + e.date_iso.slice(5, 7) : "";
                      const venue = e.venue_name ? ` · ${e.venue_name}` : "";
                      const label = `${date} ${e.title}${venue}`;
                      return (
                        <option key={e.id} value={e.id}>
                          {label.length > 80 ? label.slice(0, 80) + "…" : label}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            )}

            {/* Canales */}
            <div className="mb-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
                Canales destino {selectedChannels.length === 0 && channels.length > 0 && "(vacío = todos)"}
              </label>
              {channels.length === 0 ? (
                <div className="text-xs text-muted p-2 bg-cream rounded">
                  No se pudieron cargar canales. Verificá BUFFER_API_KEY. Si publicás sin seleccionar, se manda a todos los conectados.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {channels.map((c) => {
                    const checked = selectedChannels.includes(c.id);
                    const exhausted = c.remaining === 0;
                    return (
                      <label
                        key={c.id}
                        className={`flex items-center gap-2 px-3 py-2 text-xs border rounded cursor-pointer ${
                          exhausted ? "opacity-50 border-zinc-300 bg-zinc-50" : checked ? "border-ink bg-ink/5" : "border-border bg-white hover:bg-cream"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={exhausted}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedChannels([...selectedChannels, c.id]);
                            else setSelectedChannels(selectedChannels.filter((id) => id !== c.id));
                          }}
                        />
                        <span className="font-bold uppercase">{c.service}</span>
                        <span className="text-muted">{c.name}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            exhausted
                              ? "bg-red-100 text-red-700"
                              : c.remaining <= 1
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                          }`}
                          title={`Límite diario: ${c.limit}`}
                        >
                          {c.usedToday}/{c.limit}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Scheduling */}
            <div className="mb-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Programar (opcional — vacío = publicar ahora)
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="px-3 py-2 text-sm border border-border rounded bg-white"
              />
              {scheduledAt && (
                <div className="text-[11px] text-muted mt-1">
                  Se programará para: {new Date(scheduledAt).toLocaleString("es-AR")}
                </div>
              )}
            </div>

            <button
              onClick={handlePublishArticle}
              disabled={pending || (contentType === "nota" ? !selectedArticleId : !selectedEventId)}
              className="px-4 py-2 bg-brand text-white text-sm font-bold rounded hover:bg-brand/80 disabled:opacity-50"
            >
              {scheduledAt
                ? `Programar ${contentType === "evento" ? "evento" : "nota"}`
                : `Publicar ${contentType === "evento" ? "evento" : "nota"} ahora`}
            </button>
          </>
        )}
      </section>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          Todos ({posts.length})
        </FilterChip>
        {(["published", "pending", "failed", "skipped"] as const).map((s) => (
          <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)}>
            {STATUS_LABELS[s]} ({counts[s] ?? 0})
          </FilterChip>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div className="mb-4 p-3 bg-ink text-white text-sm rounded">{toast}</div>
      )}

      {/* Historial */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center text-muted border border-border rounded bg-paper">
          No hay publicaciones {filter !== "all" ? `con estado ${filter}` : "todavía"}.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onRetry={() => handleRetry(post.id)}
              onDelete={() => handleDelete(post.id)}
              pending={pending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ConfigCard({
  label,
  ok,
  okLabel,
  notOkLabel,
}: {
  label: string;
  ok: boolean;
  okLabel: string;
  notOkLabel: string;
}) {
  return (
    <div
      className={`p-3 rounded border ${ok ? "border-emerald-300 bg-emerald-50" : "border-red-300 bg-red-50"}`}
    >
      <div className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</div>
      <div className={`text-sm font-bold mt-1 ${ok ? "text-emerald-800" : "text-red-800"}`}>
        {ok ? okLabel : notOkLabel}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-bold rounded border transition-colors ${
        active
          ? "bg-ink text-white border-ink"
          : "bg-paper text-ink border-border hover:bg-ink/5"
      }`}
    >
      {children}
    </button>
  );
}

function PostCard({
  post,
  onRetry,
  onDelete,
  pending,
}: {
  post: PostRow;
  onRetry: () => void;
  onDelete: () => void;
  pending: boolean;
}) {
  return (
    <div className="border border-border rounded bg-paper p-4">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded ${STATUS_STYLES[post.status]}`}
            >
              {STATUS_LABELS[post.status]}
            </span>
            <span className="text-xs text-muted">{formatDate(post.scheduled_at)}</span>
            {post.published_at && (
              <span className="text-xs text-emerald-700">
                · publicado {formatDate(post.published_at)}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {post.kind === "evento" && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase text-white rounded bg-ink">
                Evento
              </span>
            )}
            {post.sections.map((s, i) => {
              const cfg = sectionConfig[s as keyof typeof sectionConfig];
              const agendaLabel = AGENDA_LABELS[s];
              const agendaColor = AGENDA_COLORS[s];
              const cfgLabel = cfg?.label ?? agendaLabel ?? s;
              const cfgColor = cfg?.color ?? agendaColor ?? "#6b5d4f";
              return (
                <span
                  key={i}
                  className="px-2 py-0.5 text-[10px] font-bold uppercase text-white rounded"
                  style={{ backgroundColor: cfgColor }}
                >
                  {cfgLabel}
                </span>
              );
            })}
          </div>
        </div>
        <div className="flex gap-2">
          {post.status === "failed" && (
            <button
              onClick={onRetry}
              disabled={pending}
              className="px-3 py-1 text-xs font-bold bg-brand text-white rounded hover:bg-brand/80 disabled:opacity-50"
            >
              Reintento
            </button>
          )}
          <button
            onClick={onDelete}
            disabled={pending}
            className="px-3 py-1 text-xs font-bold border border-border text-ink rounded hover:bg-ink/5 disabled:opacity-50"
          >
            Eliminar
          </button>
        </div>
      </div>

      {/* Thumbnails */}
      {post.slide_image_urls.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
          {post.slide_image_urls.map((url, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="flex-shrink-0 w-16 h-20 border border-border overflow-hidden rounded bg-cream"
            >
              <img src={url} alt={`Slide ${i + 1}`} className="w-full h-full object-cover" />
            </a>
          ))}
        </div>
      )}

      {/* Caption */}
      <details className="text-xs">
        <summary className="cursor-pointer text-muted hover:text-ink">Ver caption</summary>
        <pre className="mt-2 p-2 bg-cream rounded text-[11px] whitespace-pre-wrap font-sans">
          {post.caption}
        </pre>
      </details>

      {post.error_message && (
        <div
          className={`mt-2 text-xs ${post.status === "failed" ? "text-red-700" : "text-muted"}`}
        >
          {post.status === "failed" ? "Error: " : ""}
          {post.error_message}
        </div>
      )}
    </div>
  );
}