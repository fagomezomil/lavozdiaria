"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Columnist } from "@/lib/types";
import { slugify } from "@/lib/slugify";
import { createColumnist, updateColumnist, uploadColumnistPhoto } from "@/app/admin/columnists/actions";

interface ColumnistFormProps {
  columnist?: Columnist;
}

export default function ColumnistForm({ columnist }: ColumnistFormProps) {
  const router = useRouter();
  const isEditing = !!columnist;

  const [name, setName] = useState(columnist?.name ?? "");
  const [slug, setSlug] = useState(columnist?.slug ?? "");
  const [bio, setBio] = useState(columnist?.bio ?? "");
  const [active, setActive] = useState(columnist?.active ?? true);
  const [photoUrl, setPhotoUrl] = useState<string | null>(columnist?.photoUrl ?? null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleNameChange = (value: string) => {
    setName(value);
    // Auto-fill slug only when creating (not editing) and slug is empty or matches previous slugify
    if (!isEditing) {
      const computed = slugify(value);
      if (!slug || slug === slugify(name)) {
        setSlug(computed);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    let finalPhotoUrl = photoUrl;
    if (photoFile) {
      const formData = new FormData();
      formData.append("file", photoFile);
      const uploadResult = await uploadColumnistPhoto(formData);
      if (uploadResult.error || !uploadResult.url) {
        setError("Error al subir la foto: " + uploadResult.error);
        setSaving(false);
        return;
      }
      finalPhotoUrl = uploadResult.url;
    }

    const payload = {
      name,
      slug: slug.trim() || slugify(name),
      photo_url: finalPhotoUrl,
      bio: bio.trim() || null,
      active,
    };

    if (isEditing && columnist) {
      const result = await updateColumnist({ id: columnist.id, ...payload });
      if (result.error) {
        setError("Error al actualizar: " + result.error);
        setSaving(false);
        return;
      }
    } else {
      const result = await createColumnist(payload);
      if (result.error) {
        setError("Error al crear: " + result.error);
        setSaving(false);
        return;
      }
    }

    router.push("/admin/columnists");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
      {error && (
        <div className="p-3 bg-[#e63946]/10 text-[#e63946] rounded text-sm">{error}</div>
      )}

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
          Nombre *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          required
          className="w-full px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
          placeholder="Ej: Juan Pérez"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
          Slug (URL)
        </label>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
          placeholder="auto-generado del nombre"
        />
        <p className="text-[10px] text-muted mt-1">Se usa en URLs como /opinion?columnista=juan-perez. Se auto-genera del nombre si queda vacío.</p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
          Foto circular
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-ink file:text-white file:text-xs file:font-bold hover:file:bg-ink/80"
        />
        {photoUrl && (
          <div className="mt-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl}
              alt="Preview"
              className="w-24 h-24 rounded-full object-cover border border-border"
            />
            <p className="text-[10px] text-muted mt-1">Se recorta circular en el frontend. Recomendado: imagen cuadrada.</p>
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
          Bio
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#0d9488] resize-y"
          placeholder="Breve biografía del columnista (opcional)"
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="w-4 h-4 accent-[#10b981]"
        />
        <span className="text-sm font-semibold">Activo (visible en cards de opinión)</span>
      </label>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-ink text-white font-bold rounded hover:bg-ink/80 transition-colors disabled:opacity-50"
        >
          {saving ? "Guardando..." : isEditing ? "Guardar Cambios" : "Crear Columnista"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/columnists")}
          className="px-6 py-2.5 bg-white text-ink font-bold rounded border border-border hover:bg-[#f0efed] transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}