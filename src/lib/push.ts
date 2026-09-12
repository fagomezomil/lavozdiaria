/**
 * Web Push de "Última Hora" — envía notificaciones a las suscripciones de
 * push_subscriptions cuando una nota se marca breaking.
 *
 * Best-effort (patrón indexnow.ts): errores se loguean, nunca frenan la acción
 * del editor. Sin VAPID_PRIVATE_KEY configurada → no-op (dev sin config no rompe).
 *
 * Subs muertas (endpoint 404/410) se borran en el mismo envío (autolimpieza).
 */

import webpush from "web-push";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export interface PushBreakingPayload {
  /** Título de la notificación (ej: "ÚLTIMA HORA"). */
  title: string;
  /** Cuerpo (titular de la nota). */
  body: string;
  /** Path relativo de la nota (/section/id). */
  url: string;
}

/** Envía el payload a todas las suscripciones. Devuelve cuántas tuvieron éxito. */
export async function sendPushBreaking(payload: PushBreakingPayload): Promise<number> {
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:contacto@quenoticia.com.ar";
  if (!privateKey || !publicKey) {
    console.warn("push: VAPID no configurado — no-op");
    return 0;
  }

  const admin = await getSupabaseAdmin();
  const { data: subs, error } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth");
  if (error) {
    console.warn("push: error leyendo subscriptions:", error.message);
    return 0;
  }
  if (!subs || subs.length === 0) return 0;

  const vapidDetails = { subject, publicKey, privateKey };
  const message = JSON.stringify(payload);
  const dead: string[] = [];
  let sent = 0;

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          message,
          { vapidDetails },
        );
        sent++;
      } catch (err) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) dead.push(sub.endpoint);
        else console.warn(`push: ${sub.endpoint.slice(-12)}: ${statusCode ?? "sin código"}`);
      }
    }),
  );

  if (dead.length > 0) {
    const { error: delErr } = await admin
      .from("push_subscriptions")
      .delete()
      .in("endpoint", dead);
    if (delErr) console.warn("push: cleanup de subs muertas falló:", delErr.message);
  }

  return sent;
}