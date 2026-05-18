"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Client } from "@/lib/types";

interface ClientFormProps {
  client?: Client;
}

export default function ClientForm({ client }: ClientFormProps) {
  const router = useRouter();
  const isEditing = !!client;

  const [name, setName] = useState(client?.name ?? "");
  const [email, setEmail] = useState(client?.email ?? "");
  const [phone, setPhone] = useState(client?.phone ?? "");
  const [notes, setNotes] = useState(client?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const supabase = createClient();
    const payload = {
      name,
      email: email || null,
      phone: phone || null,
      notes: notes || null,
    };

    if (isEditing) {
      const { error: updateError } = await supabase
        .from("clients")
        .update(payload)
        .eq("id", client!.id);

      if (updateError) {
        setError("Error al actualizar: " + updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase
        .from("clients")
        .insert(payload);

      if (insertError) {
        console.error("Error creating client:", insertError);
        setError("Error al crear: " + insertError.message);
        setSaving(false);
        return;
      }
    }

    router.push("/admin/clients");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
      {error && (
        <div className="p-3 bg-[#e63946]/10 text-[#e63946] rounded text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
          Nombre *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
          placeholder="Nombre del cliente"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
          placeholder="cliente@ejemplo.com"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
          Teléfono
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
          placeholder="+54 381 555-1234"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
          Notas
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6] resize-none"
          placeholder="Observaciones sobre el cliente..."
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-ink text-white font-bold rounded hover:bg-ink/80 transition-colors disabled:opacity-50"
        >
          {saving ? "Guardando..." : isEditing ? "Guardar Cambios" : "Crear Cliente"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/clients")}
          className="px-6 py-2.5 bg-white text-ink font-bold rounded border border-border hover:bg-[#f0efed] transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}