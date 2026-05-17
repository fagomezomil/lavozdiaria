"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { CustomArticle, Section, ArticleLayout } from "@/lib/types";
import { sectionConfig } from "@/lib/types";
import { updateArticle } from "@/app/admin/articles/actions";

const sectionOptions: { value: Section; label: string }[] = Object.entries(sectionConfig).map(
  ([key, cfg]) => ({ value: key as Section, label: cfg.label })
);

function todayFormatted(): string {
  return new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface ArticleFormProps {
  article?: CustomArticle;
}

export default function ArticleForm({ article }: ArticleFormProps) {
  const router = useRouter();
  const isEditing = !!article;

  const [title, setTitle] = useState(article?.title ?? "");
  const [subtitle, setSubtitle] = useState(article?.subtitle ?? "");
  const [section, setSection] = useState<Section>(article?.section ?? "politica");
  const [author, setAuthor] = useState(article?.author ?? "");
  const [publisher, setPublisher] = useState(article?.publisher ?? "LaVozDiaria");
  const [date, setDate] = useState(article?.date ?? todayFormatted());
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? "");
  const [body, setBody] = useState(article?.body ?? "");
  const [imageAlt, setImageAlt] = useState(article?.imageAlt ?? "");
  const [originalUrl, setOriginalUrl] = useState(article?.originalUrl ?? "");
  const [featured, setFeatured] = useState(article?.featured ?? false);
  const [breaking, setBreaking] = useState(article?.breaking ?? false);
  const [layout, setLayout] = useState<ArticleLayout>(article?.layout ?? "normal");
  const [active, setActive] = useState(article?.active ?? true);
  const [commentsEnabled, setCommentsEnabled] = useState(article?.comments_enabled ?? true);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(article?.imageUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const supabase = createClient();
    let imageUrl = article?.imageUrl ?? null;

    // Upload image if a new file was selected
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("articles")
        .upload(path, imageFile, {
          upsert: true,
          contentType: imageFile.type,
        });

      if (uploadError) {
        setError("Error al subir la imagen: " + uploadError.message);
        setSaving(false);
        return;
      }

      const { data: urlData } = supabase.storage.from("articles").getPublicUrl(path);
      imageUrl = urlData.publicUrl;
    }

    const payload = {
      title,
      subtitle: subtitle || null,
      section,
      author: author || null,
      publisher,
      date,
      image_url: imageUrl,
      image_alt: imageAlt || title,
      excerpt,
      body: body || null,
      original_url: originalUrl || null,
      featured,
      breaking,
      layout,
      active,
      comments_enabled: commentsEnabled,
    };

    if (isEditing) {
      const result = await updateArticle({ id: article.id, ...payload });

      if (result.error) {
        setError("Error al actualizar: " + result.error);
        setSaving(false);
        return;
      }
    } else {
      const { error: insertError, data } = await supabase
        .from("articles")
        .insert(payload)
        .select();

      if (insertError) {
        setError("Error al crear: " + insertError.message + " (código: " + insertError.code + ")");
        setSaving(false);
        return;
      }
    }

    router.push("/admin/articles");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      {error && (
        <div className="p-3 bg-[#e63946]/10 text-[#e63946] rounded text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
          Título *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
          placeholder="Título de la nota"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
          Subtítulo
        </label>
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
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
            Sección *
          </label>
          <select
            value={section}
            onChange={(e) => setSection(e.target.value as Section)}
            className="w-full px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
          >
            {sectionOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
            Fecha
          </label>
          <input
            type="text"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
            Autor
          </label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
            placeholder="Nombre del autor"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
            Editorial
          </label>
          <input
            type="text"
            value={publisher}
            onChange={(e) => setPublisher(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
          Imagen
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-ink file:text-white file:text-xs file:font-bold hover:file:bg-ink/80"
        />
        {previewUrl && (
          <div className="mt-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-40 rounded border border-border"
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
          Epígrafe de imagen
        </label>
        <input
          type="text"
          value={imageAlt}
          onChange={(e) => setImageAlt(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
          placeholder="Se completa con el título si queda vacío"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
          Extracto / Bajada *
        </label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          required
          rows={3}
          className="w-full px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6] resize-y"
          placeholder="Resumen breve de la nota"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
          Cuerpo de la nota
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          className="w-full px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6] resize-y"
          placeholder="Texto completo de la nota. Usá doble enter para separar párrafos."
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
          URL original
        </label>
        <input
          type="url"
          value={originalUrl}
          onChange={(e) => setOriginalUrl(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
          placeholder="https://..."
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
          Presentación en la sección
        </label>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setLayout("normal")}
            className={`p-3 rounded border-2 text-center transition-all ${
              layout === "normal"
                ? "border-ink bg-ink/5"
                : "border-border bg-white hover:border-ink/30"
            }`}
          >
            <span className="block text-xs font-bold uppercase tracking-wider mb-1">Normal</span>
            <span className="block text-[10px] text-muted">1 columna</span>
          </button>
          <button
            type="button"
            onClick={() => setLayout("destacada")}
            className={`p-3 rounded border-2 text-center transition-all ${
              layout === "destacada"
                ? "border-[#3b82f6] bg-[#3b82f6]/5"
                : "border-border bg-white hover:border-[#3b82f6]/30"
            }`}
          >
            <span className="block text-xs font-bold uppercase tracking-wider mb-1 text-[#3b82f6]">Destacada</span>
            <span className="block text-[10px] text-muted">2 columnas</span>
          </button>
          <button
            type="button"
            onClick={() => setLayout("urgente")}
            className={`p-3 rounded border-2 text-center transition-all ${
              layout === "urgente"
                ? "border-[#e63946] bg-[#e63946]/5"
                : "border-border bg-white hover:border-[#e63946]/30"
            }`}
          >
            <span className="block text-xs font-bold uppercase tracking-wider mb-1 text-[#e63946]">Urgente</span>
            <span className="block text-[10px] text-muted">3 columnas</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="w-4 h-4 accent-[#10b981]"
          />
          <span className="text-sm font-semibold">Activa</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={breaking}
            onChange={(e) => setBreaking(e.target.checked)}
            className="w-4 h-4 accent-[#e63946]"
          />
          <span className="text-sm font-semibold">Urgente (ticker)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={commentsEnabled}
            onChange={(e) => setCommentsEnabled(e.target.checked)}
            className="w-4 h-4 accent-[#8b5cf6]"
          />
          <span className="text-sm font-semibold">Comentarios</span>
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-ink text-white font-bold rounded hover:bg-ink/80 transition-colors disabled:opacity-50"
        >
          {saving ? "Guardando..." : isEditing ? "Guardar Cambios" : "Crear Nota"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/articles")}
          className="px-6 py-2.5 bg-white text-ink font-bold rounded border border-border hover:bg-[#f0efed] transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}