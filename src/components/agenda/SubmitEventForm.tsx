"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { AgendaCategory } from "@/lib/types";
import { submitEventProposal } from "@/app/agenda/submit/actions";

const CATS: { value: AgendaCategory; label: string; hint: string }[] = [
  { value: "cultural", label: "Cultural", hint: "Teatro, música, cine, arte" },
  { value: "turistico", label: "Turístico", hint: "Feriados, tours, paseos" },
  { value: "deportivo", label: "Deportivo", hint: "Partidos, carreras, torneos" },
];

export default function SubmitEventForm({ userEmail }: { userEmail?: string | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    category: "cultural" as AgendaCategory,
    subcategory: "",
    date_iso: "",
    time: "",
    end_date: "",
    venue_name: "",
    venue_city: "San Miguel de Tucumán",
    venue_address: "",
    image_url: "",
    description: "",
    price_range: "",
    ticket_url: "",
    contact_email: userEmail || "",
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await submitEventProposal({
        title: form.title,
        category: form.category,
        subcategory: form.subcategory.trim() || undefined,
        date_iso: form.date_iso,
        time: form.time.trim() || undefined,
        end_date: form.end_date || undefined,
        venue_name: form.venue_name.trim() || undefined,
        venue_city: form.venue_city.trim() || undefined,
        venue_address: form.venue_address.trim() || undefined,
        image_url: form.image_url.trim() || undefined,
        description: form.description.trim() || undefined,
        price_range: form.price_range.trim() || undefined,
        ticket_url: form.ticket_url.trim() || undefined,
        contact_email: form.contact_email.trim() || undefined,
      });
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setSuccess("¡Propuesta enviada! Quedó en cola para revisión del equipo editorial. Vas a ver su estado en /mis-propuestas.");
      setForm((f) => ({ ...f, title: "", subcategory: "", date_iso: "", time: "", end_date: "", venue_name: "", venue_address: "", image_url: "", description: "", price_range: "", ticket_url: "" }));
    });
  };

  const inputCls =
    "w-full px-3 py-2 rounded border border-border bg-white text-ink text-sm focus:outline-none focus:border-agenda focus:ring-1 focus:ring-agenda";
  const labelCls = "block text-xs font-semibold text-muted uppercase tracking-wide mb-1";

  if (success) {
    return (
      <div className="py-12">
        <div className="bg-paper border border-agenda/30 rounded-lg p-8 text-center shadow-hard-sm">
          <div className="text-4xl mb-3">✓</div>
          <h2 className="font-[family-name:var(--font-heading)] text-2xl uppercase tracking-tight text-ink mb-2">
            Propuesta enviada
          </h2>
          <p className="text-muted text-sm mb-6">{success}</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              type="button"
              onClick={() => setSuccess(null)}
              className="px-5 py-2 rounded bg-agenda text-white font-[family-name:var(--font-heading)] uppercase tracking-wide text-sm shadow-hard-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard transition-all"
            >
              Enviar otra
            </button>
            <Link
              href="/mis-propuestas"
              className="px-5 py-2 rounded border border-border bg-paper text-ink text-sm font-semibold hover:bg-ink/5"
            >
              Ver mis propuestas
            </Link>
            <Link
              href="/agenda"
              className="px-5 py-2 rounded border border-border bg-paper text-ink text-sm font-semibold hover:bg-ink/5"
            >
              Volver a Agenda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className={labelCls}>Título del evento *</label>
          <input
            required
            minLength={3}
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            className={inputCls}
            placeholder="Ej: Festival Folclórico en Plaza Independencia"
          />
        </div>
        <div>
          <label className={labelCls}>Categoría *</label>
          <select
            value={form.category}
            onChange={(e) => set("category", e.target.value as AgendaCategory)}
            className={inputCls}
          >
            {CATS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label} — {c.hint}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className={labelCls}>Subcategoría</label>
          <input
            value={form.subcategory}
            onChange={(e) => set("subcategory", e.target.value)}
            className={inputCls}
            placeholder="Música, Teatro, Trekking…"
          />
        </div>
        <div>
          <label className={labelCls}>Fecha *</label>
          <input
            required
            type="date"
            value={form.date_iso}
            onChange={(e) => set("date_iso", e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Hora</label>
          <input
            value={form.time}
            onChange={(e) => set("time", e.target.value)}
            className={inputCls}
            placeholder="21:00 hs"
          />
        </div>
        <div>
          <label className={labelCls}>Fecha fin</label>
          <input
            type="date"
            value={form.end_date}
            onChange={(e) => set("end_date", e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>Lugar</label>
          <input
            value={form.venue_name}
            onChange={(e) => set("venue_name", e.target.value)}
            className={inputCls}
            placeholder="Teatro Mercedes Sosa"
          />
        </div>
        <div>
          <label className={labelCls}>Ciudad</label>
          <input
            value={form.venue_city}
            onChange={(e) => set("venue_city", e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Dirección</label>
          <input
            value={form.venue_address}
            onChange={(e) => set("venue_address", e.target.value)}
            className={inputCls}
            placeholder="Jujuy 92"
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>URL de imagen (externa)</label>
        <input
          value={form.image_url}
          onChange={(e) => set("image_url", e.target.value)}
          className={inputCls}
          placeholder="https://… (opcional)"
        />
        <p className="text-xs text-muted mt-1">Pegá un link directo a la imagen (.jpg / .png).</p>
      </div>

      <div>
        <label className={labelCls}>Descripción</label>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          className={inputCls}
          rows={5}
          placeholder="Detalles del evento: programa, artistas, duración, etc."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>Rango de precios</label>
          <input
            value={form.price_range}
            onChange={(e) => set("price_range", e.target.value)}
            className={inputCls}
            placeholder="$8.000 – $15.000 (o «Gratis»)"
          />
        </div>
        <div>
          <label className={labelCls}>URL entradas</label>
          <input
            value={form.ticket_url}
            onChange={(e) => set("ticket_url", e.target.value)}
            className={inputCls}
            placeholder="https://…"
          />
        </div>
        <div>
          <label className={labelCls}>Email de contacto</label>
          <input
            type="email"
            value={form.contact_email}
            onChange={(e) => set("contact_email", e.target.value)}
            className={inputCls}
            placeholder="por si necesitamos avisarte"
          />
        </div>
      </div>

      {error && (
        <div className="bg-urgente/10 border border-urgente/30 text-urgente text-sm rounded p-3">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2 rounded bg-agenda text-white font-[family-name:var(--font-heading)] uppercase tracking-wide text-sm shadow-hard-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard transition-all disabled:opacity-60"
        >
          {pending ? "Enviando…" : "Enviar propuesta"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/agenda")}
          className="px-5 py-2 rounded border border-border bg-paper text-ink text-sm font-semibold hover:bg-ink/5"
        >
          Cancelar
        </button>
      </div>

      <p className="text-xs text-muted pt-2">
        Al enviar, tu propuesta queda en cola para que el equipo editorial la revise. Te avisaremos
        por email si se publica o si necesitamos algún ajuste.
      </p>
    </form>
  );
}