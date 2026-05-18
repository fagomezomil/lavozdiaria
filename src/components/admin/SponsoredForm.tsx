"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveSponsored, uploadSponsoredImage } from "@/app/admin/sponsored/actions";
import type { SponsoredContent, Section } from "@/lib/types";
import { sectionConfig } from "@/lib/types";

interface ClientOption {
  id: string;
  name: string;
}

const sectionOptions: { value: Section; label: string }[] = Object.entries(sectionConfig).map(
  ([key, cfg]) => ({ value: key as Section, label: cfg.label })
);

interface SponsoredFormProps {
  content?: SponsoredContent;
  initialClientId?: string;
  clients: ClientOption[];
}

export default function SponsoredForm({ content, initialClientId, clients }: SponsoredFormProps) {
  const router = useRouter();
  const isEditing = !!content;
  const [title, setTitle] = useState(content?.title ?? "");
  const [subtitle, setSubtitle] = useState(content?.subtitle ?? "");
  const [section, setSection] = useState<Section>(content?.section ?? "internacionales");
  const [author, setAuthor] = useState(content?.author ?? "");
  const [publisher, setPublisher] = useState(content?.publisher ?? "");
  const [date, setDate] = useState(content?.date ?? "");
  const [excerpt, setExcerpt] = useState(content?.excerpt ?? "");
  const [body, setBody] = useState(content?.body ?? "");
  const [originalUrl, setOriginalUrl] = useState(content?.originalUrl ?? "");
  const [clientId, setClientId] = useState(content?.clientId ?? initialClientId ?? "");
  const [active, setActive] = useState(content?.active ?? true);
  const [showOnHomepage, setShowOnHomepage] = useState(content?.showOnHomepage ?? true);
  const [showInSidebar, setShowInSidebar] = useState(content?.showInSidebar ?? true);
  const [startsAtDate, setStartsAtDate] = useState(content?.startsAt ? content.startsAt.slice(0, 10) : "");
  const [startsAtTime, setStartsAtTime] = useState(content?.startsAt ? content.startsAt.slice(11, 16) : "00:00");
  const [expiresAtDate, setExpiresAtDate] = useState(content?.expiresAt ? content.expiresAt.slice(0, 10) : "");
  const [expiresAtTime, setExpiresAtTime] = useState(content?.expiresAt ? content.expiresAt.slice(11, 16) : "23:59");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(content?.imageUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("El título es obligatorio.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      let imageUrl = content?.imageUrl ?? null;

      if (imageFile) {
        const fd = new FormData();
        fd.append("file", imageFile);
        const uploadResult = await uploadSponsoredImage(fd);
        if (uploadResult.error) {
          setError("Error al subir la imagen: " + uploadResult.error);
          setSaving(false);
          return;
        }
        imageUrl = uploadResult.url;
      }

      const payload = {
        ...(isEditing ? { id: content!.id } : {}),
        title,
        subtitle: subtitle || null,
        section,
        author: author || null,
        publisher: publisher || null,
        date: date || new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
        image_url: imageUrl,
        image_alt: title,
        excerpt: excerpt || null,
        body: body || null,
        original_url: originalUrl || null,
        active,
        show_on_homepage: showOnHomepage,
        show_in_sidebar: showInSidebar,
        client_id: clientId || null,
        starts_at: startsAtDate ? new Date(`${startsAtDate}T${startsAtTime}`).toISOString() : null,
        expires_at: expiresAtDate ? new Date(`${expiresAtDate}T${expiresAtTime}`).toISOString() : null,
      };

      const result = await saveSponsored(payload);

      if (result.error) {
        setError(result.error);
        setSaving(false);
        return;
      }

      router.push("/admin/sponsored");
      router.refresh();
    } catch (err) {
      setError("Error inesperado: " + (err instanceof Error ? err.message : String(err)));
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl space-y-5">
      {error && (
        <div className="p-3 bg-[#e63946]/10 text-[#e63946] rounded text-sm">{error}</div>
      )}

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">Título *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
          placeholder="Título del contenido patrocinado"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">Subtítulo</label>
        <input
          type="text"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
          placeholder="Subtítulo opcional"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">Sección</label>
          <select
            value={section}
            onChange={(e) => setSection(e.target.value as Section)}
            className="w-full px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
          >
            {sectionOptions.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">Cliente</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
          >
            <option value="">Sin cliente</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">Autor</label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
            placeholder="Nombre del autor"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">Fuente</label>
          <input
            type="text"
            value={publisher}
            onChange={(e) => setPublisher(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
            placeholder="Nombre de la fuente"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">Imagen</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) { setImageFile(file); setPreviewUrl(URL.createObjectURL(file)); }
          }}
          className="w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-ink file:text-white file:text-xs file:font-bold hover:file:bg-ink/80"
        />
        {previewUrl && (
          <div className="mt-2">
            <img src={previewUrl} alt="Preview" className="max-h-32 rounded border border-border" />
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">Bajada</label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6] resize-none"
          placeholder="Resumen corto del contenido..."
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">Cuerpo</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          className="w-full px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6] resize-none"
          placeholder="Contenido completo del artículo..."
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">URL original</label>
        <input
          type="text"
          value={originalUrl}
          onChange={(e) => setOriginalUrl(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
          placeholder="https://..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">Fecha de inicio</label>
          <div className="flex gap-2">
            <input type="date" value={startsAtDate} onChange={(e) => setStartsAtDate(e.target.value)} className="flex-1 px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]" />
            <input type="time" value={startsAtTime} onChange={(e) => setStartsAtTime(e.target.value)} className="w-28 px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">Fecha de vencimiento</label>
          <div className="flex gap-2">
            <input type="date" value={expiresAtDate} onChange={(e) => setExpiresAtDate(e.target.value)} className="flex-1 px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]" />
            <input type="time" value={expiresAtTime} onChange={(e) => setExpiresAtTime(e.target.value)} className="w-28 px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]" />
          </div>
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="w-4 h-4 accent-[#10b981]" />
          <span className="text-sm font-semibold">Activo</span>
        </label>
      </div>

      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={showOnHomepage} onChange={(e) => setShowOnHomepage(e.target.checked)} className="w-4 h-4 accent-[#3b82f6]" />
          <span className="text-sm font-semibold">Mostrar en portada</span>
        </label>
      </div>

      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={showInSidebar} onChange={(e) => setShowInSidebar(e.target.checked)} className="w-4 h-4 accent-[#8b5cf6]" />
          <span className="text-sm font-semibold">Mostrar en sidebar de notas</span>
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          disabled={saving}
          onClick={handleSubmit}
          className="px-6 py-2.5 bg-ink text-white font-bold rounded hover:bg-ink/80 transition-colors disabled:opacity-50"
        >
          {saving ? "Guardando..." : isEditing ? "Guardar Cambios" : "Crear Contenido Patrocinado"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/sponsored")}
          className="px-6 py-2.5 bg-white text-ink font-bold rounded border border-border hover:bg-[#f0efed] transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}