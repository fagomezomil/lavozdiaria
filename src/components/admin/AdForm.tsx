"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Ad, AdType, Section } from "@/lib/types";
import { sectionConfig } from "@/lib/types";

interface ClientOption {
  id: string;
  name: string;
}

const adTypes: { value: AdType; label: string }[] = [
  { value: "leaderboard", label: "Leaderboard (728x90)" },
  { value: "rectangle", label: "Rectangle (300x250)" },
  { value: "sidebar", label: "Sidebar (ancho completo x 250)" },
  { value: "modal", label: "Modal (pantalla completa)" },
  { value: "infeed", label: "In-Feed (entre artículos)" },
  { value: "sticky_footer", label: "Sticky Footer (móvil, 320x50)" },
];

const sectionOptions: { value: Section | ""; label: string }[] = [
  { value: "", label: "Todas las secciones" },
  ...Object.entries(sectionConfig).map(([key, cfg]) => ({
    value: key as Section,
    label: cfg.label,
  })),
];

interface AdFormProps {
  ad?: Ad;
}

export default function AdForm({ ad }: AdFormProps) {
  const router = useRouter();
  const isEditing = !!ad;

  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientId, setClientId] = useState<string>(ad?.client_id ?? "");
  const [title, setTitle] = useState(ad?.title ?? "");
  const [type, setType] = useState<AdType>(ad?.type ?? "leaderboard");
  const [section, setSection] = useState<Section | "">(ad?.section ?? "");
  const [linkUrl, setLinkUrl] = useState(ad?.link_url ?? "");
  const [active, setActive] = useState(ad?.active ?? true);
  const [priority, setPriority] = useState(ad?.priority ?? 0);
  const [displayDuration, setDisplayDuration] = useState(ad?.display_duration ?? 15);
  const [startsAtDate, setStartsAtDate] = useState(
    ad?.starts_at ? ad.starts_at.slice(0, 10) : "",
  );
  const [startsAtTime, setStartsAtTime] = useState(
    ad?.starts_at ? ad.starts_at.slice(11, 16) : "00:00",
  );
  const [expiresAtDate, setExpiresAtDate] = useState(
    ad?.expires_at ? ad.expires_at.slice(0, 10) : "",
  );
  const [expiresAtTime, setExpiresAtTime] = useState(
    ad?.expires_at ? ad.expires_at.slice(11, 16) : "23:59",
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(ad?.image_url ?? "");
  const [mobileImageFile, setMobileImageFile] = useState<File | null>(null);
  const [mobilePreviewUrl, setMobilePreviewUrl] = useState(ad?.mobile_image_url ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchClients = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("clients").select("id, name").order("name");
      if (data) setClients(data as ClientOption[]);
    };
    fetchClients();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleMobileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMobileImageFile(file);
    setMobilePreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const supabase = createClient();
    let imageUrl = ad?.image_url ?? null;
    let mobileImageUrl = ad?.mobile_image_url ?? null;

    // Upload desktop image if a new file was selected
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("ads")
        .upload(path, imageFile, { upsert: true });

      if (uploadError) {
        setError("Error al subir la imagen: " + uploadError.message);
        setSaving(false);
        return;
      }

      const { data: urlData } = supabase.storage.from("ads").getPublicUrl(path);
      imageUrl = urlData.publicUrl;
    }

    // Upload mobile image if a new file was selected
    if (mobileImageFile) {
      const ext = mobileImageFile.name.split(".").pop();
      const path = `${Date.now()}-mobile-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("ads")
        .upload(path, mobileImageFile, { upsert: true });

      if (uploadError) {
        setError("Error al subir la imagen mobile: " + uploadError.message);
        setSaving(false);
        return;
      }

      const { data: urlData } = supabase.storage.from("ads").getPublicUrl(path);
      mobileImageUrl = urlData.publicUrl;
    }

    const payload = {
      title,
      type,
      section: section || null,
      client_id: clientId || null,
      link_url: linkUrl || null,
      image_url: imageUrl,
      mobile_image_url: mobileImageUrl,
      active,
      priority,
      display_duration: displayDuration,
      starts_at: startsAtDate ? new Date(`${startsAtDate}T${startsAtTime}`).toISOString() : null,
      expires_at: expiresAtDate ? new Date(`${expiresAtDate}T${expiresAtTime}`).toISOString() : null,
    };

    if (isEditing) {
      const { error: updateError } = await supabase
        .from("ads")
        .update(payload)
        .eq("id", ad.id);

      if (updateError) {
        setError("Error al actualizar: " + updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase
        .from("ads")
        .insert(payload);

      if (insertError) {
        setError("Error al crear: " + insertError.message);
        setSaving(false);
        return;
      }
    }

    router.push("/admin");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
      {error && (
        <div className="p-3 bg-[#e63946]/10 text-[#e63946] rounded text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
          Título
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
          placeholder="Aviso publicitario"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
          Cliente
        </label>
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
            Tipo de espacio
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as AdType)}
            className="w-full px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
          >
            {adTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
            Sección objetivo
          </label>
          <select
            value={section}
            onChange={(e) => setSection(e.target.value as Section | "")}
            className="w-full px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
          >
            {sectionOptions.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
          Imagen (escritorio)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-ink file:text-white file:text-xs file:font-bold hover:file:bg-ink/80"
        />
        {previewUrl && (
          <div className="mt-2">
            <img
              src={previewUrl}
              alt="Preview escritorio"
              className="max-h-32 rounded border border-border"
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
          Imagen mobile (opcional)
        </label>
        <p className="text-xs text-muted mb-1">
          Imagen optimizada para celulares. Recomendado: 320x100 para leaderboard.
        </p>
        <input
          type="file"
          accept="image/*"
          onChange={handleMobileFileChange}
          className="w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-ink file:text-white file:text-xs file:font-bold hover:file:bg-ink/80"
        />
        {mobilePreviewUrl && (
          <div className="mt-2">
            <img
              src={mobilePreviewUrl}
              alt="Preview mobile"
              className="max-h-24 rounded border border-border"
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
          URL de destino (link)
        </label>
        <input
          type="url"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
          placeholder="https://..."
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
          Fecha de inicio
        </label>
        <div className="flex gap-3">
          <input
            type="date"
            value={startsAtDate}
            onChange={(e) => setStartsAtDate(e.target.value)}
            className="flex-1 px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
          />
          <input
            type="time"
            value={startsAtTime}
            onChange={(e) => setStartsAtTime(e.target.value)}
            className="w-28 px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
          Fecha de vencimiento
        </label>
        <div className="flex gap-3">
          <input
            type="date"
            value={expiresAtDate}
            onChange={(e) => setExpiresAtDate(e.target.value)}
            className="flex-1 px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
          />
          <input
            type="time"
            value={expiresAtTime}
            onChange={(e) => setExpiresAtTime(e.target.value)}
            className="w-28 px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
            Prioridad
          </label>
          <input
            type="number"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            className="w-full px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
            Duración (seg)
          </label>
          <p className="text-xs text-muted mb-1">
            Tiempo de impresión en rotación. Default: 15s.
          </p>
          <input
            type="number"
            min={5}
            max={60}
            value={displayDuration}
            onChange={(e) => setDisplayDuration(Number(e.target.value))}
            className="w-full px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
            &nbsp;
          </label>
          <label className="flex items-center gap-2 cursor-pointer h-[42px]">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 accent-[#10b981]"
            />
            <span className="text-sm font-semibold">Activo</span>
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-ink text-white font-bold rounded hover:bg-ink/80 transition-colors disabled:opacity-50"
        >
          {saving ? "Guardando..." : isEditing ? "Guardar Cambios" : "Crear Aviso"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="px-6 py-2.5 bg-white text-ink font-bold rounded border border-border hover:bg-[#f0efed] transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}