"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AdminEvent } from "@/lib/agenda";
import type { AgendaCategory } from "@/lib/types";
import { createManualEvent, updateManualEvent } from "@/app/admin/agenda/actions";

interface AgendaEventFormProps {
  event?: AdminEvent; // presente si edit
}

const CATS: { value: AgendaCategory; label: string }[] = [
  { value: "cultural", label: "Cultural" },
  { value: "turistico", label: "Turístico" },
  { value: "deportivo", label: "Deportivo" },
];

export default function AgendaEventForm({ event }: AgendaEventFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isEdit = !!event;

  const [form, setForm] = useState({
    title: event?.title || "",
    category: (event?.category || "cultural") as AgendaCategory,
    subcategory: event?.subcategory || "",
    date_iso: event?.date || "",
    time: event?.time || "",
    end_date: event?.endDate || "",
    venue_name: event?.venueName || "",
    venue_city: event?.venueCity || "",
    venue_address: event?.venueAddress || "",
    image_url: event?.imageUrl || "",
    excerpt: event?.excerpt || "",
    description: event?.description || "",
    price_range: event?.price && !event.isFree ? event.price : "",
    is_free: event?.isFree ?? false,
    ticket_url: event?.ticketUrl || "",
    featured: event?.featured ?? false,
    active: event?.active ?? true,
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const payload = {
          title: form.title.trim(),
          category: form.category,
          subcategory: form.subcategory.trim() || undefined,
          date_iso: form.date_iso,
          time: form.time.trim() || undefined,
          end_date: form.end_date || undefined,
          venue_name: form.venue_name.trim() || undefined,
          venue_city: form.venue_city.trim() || undefined,
          venue_address: form.venue_address.trim() || undefined,
          image_url: form.image_url.trim() || undefined,
          excerpt: form.excerpt.trim() || undefined,
          description: form.description.trim() || undefined,
          price_range: form.is_free ? "Gratis" : form.price_range.trim() || undefined,
          is_free: form.is_free,
          ticket_url: form.ticket_url.trim() || undefined,
          featured: form.featured,
          active: form.active,
        };
        if (isEdit && event) {
          await updateManualEvent(event.id, payload);
        } else {
          await createManualEvent(payload);
        }
        router.push("/admin/agenda");
        router.refresh();
      } catch (err) {
        alert((err as Error).message);
      }
    });
  };

  const inputCls =
    "w-full px-3 py-2 rounded border border-border bg-white text-ink text-sm focus:outline-none focus:border-agenda focus:ring-1 focus:ring-agenda";
  const labelCls = "block text-xs font-semibold text-muted uppercase tracking-wide mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className={labelCls}>Título *</label>
          <input
            required
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
                {c.label}
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
            placeholder="Música, Teatro, Trekking..."
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
          <label className={labelCls}>Venue</label>
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
            placeholder="San Miguel de Tucumán"
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
        <label className={labelCls}>URL de imagen</label>
        <input
          value={form.image_url}
          onChange={(e) => set("image_url", e.target.value)}
          className={inputCls}
          placeholder="https://..."
        />
      </div>

      <div>
        <label className={labelCls}>Extracto</label>
        <textarea
          value={form.excerpt}
          onChange={(e) => set("excerpt", e.target.value)}
          className={inputCls}
          rows={2}
          placeholder="Una línea que aparece en la card (opcional)"
        />
      </div>

      <div>
        <label className={labelCls}>Descripción</label>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          className={inputCls}
          rows={5}
          placeholder="Texto largo que aparece en el modal"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>Rango de precios</label>
          <input
            value={form.price_range}
            onChange={(e) => set("price_range", e.target.value)}
            disabled={form.is_free}
            className={`${inputCls} ${form.is_free ? "opacity-50" : ""}`}
            placeholder="$8.000 – $15.000"
          />
        </div>
        <div>
          <label className={labelCls}>URL entradas</label>
          <input
            value={form.ticket_url}
            onChange={(e) => set("ticket_url", e.target.value)}
            className={inputCls}
            placeholder="https://..."
          />
        </div>
        <div className="flex flex-col gap-2 pt-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_free}
              onChange={(e) => set("is_free", e.target.checked)}
              className="accent-agenda"
            />
            <span>Entrada gratuita</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => set("featured", e.target.checked)}
              className="accent-agenda"
            />
            <span>★ Destacado (hero en /agenda)</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => set("active", e.target.checked)}
              className="accent-agenda"
            />
            <span>Visible en /agenda</span>
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2 rounded bg-agenda text-white font-[family-name:var(--font-heading)] uppercase tracking-wide text-sm shadow-hard-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard transition-all disabled:opacity-60"
        >
          {pending ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear evento"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/agenda")}
          className="px-5 py-2 rounded border border-border bg-paper text-ink text-sm font-semibold hover:bg-ink/5"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}