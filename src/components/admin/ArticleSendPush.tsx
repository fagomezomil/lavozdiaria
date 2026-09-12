"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendArticlePush } from "@/app/admin/articles/deleteAction";

/** Botón "Push" en la fila del dashboard: envía Última Hora manualmente. */
export default function ArticleSendPush({ id }: { id: string }) {
  const router = useRouter();
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!confirm("¿Enviar push de Última Hora a todos los suscriptos?")) return;
    setSending(true);
    const result = await sendArticlePush(id);
    setSending(false);
    if (result.error) {
      alert("Error al enviar push: " + result.error);
      return;
    }
    router.refresh();
  };

  return (
    <button
      onClick={handleSend}
      disabled={sending}
      className="px-2 py-0.5 rounded text-xs font-bold bg-brand text-ink disabled:opacity-50"
    >
      {sending ? "Enviando…" : "Push"}
    </button>
  );
}