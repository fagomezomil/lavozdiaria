"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "push-prompt-dismissed";
const SHOW_AFTER_MS = 15_000;

/** Convierte la VAPID public key base64url a Uint8Array para pushManager. */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

/** Detecta iOS Safari sin PWA instalada: ahí Web Push no existe (requiere app instalada). */
function isIosNoStandalone(): boolean {
  const ua = navigator.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && "ontouchend" in document);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return ios && !standalone;
}

/** Mini-banner "¿avisamos cuando hay última hora?" intercalado en el artículo.
 *  Aparece a los 15s si el usuario no definió permisos todavía. */
export default function ArticlePushPrompt() {
  const [state, setState] = useState<"hidden" | "visible" | "ios" | "subscribed">("hidden");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Sin soporte, sin key VAPID, con permiso ya definido o con dismiss → nunca
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !vapidKey) return;
    if (typeof Notification === "undefined" || Notification.permission !== "default") return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const timer = setTimeout(() => {
      if (isIosNoStandalone()) {
        setState("ios");
      } else {
        setState("visible");
      }
    }, SHOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);

  const activate = async () => {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        localStorage.setItem(DISMISS_KEY, "1");
        setState("hidden");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
      }
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error("subscribe falló");
      setState("subscribed");
    } catch {
      localStorage.setItem(DISMISS_KEY, "1");
      setState("hidden");
    } finally {
      setBusy(false);
    }
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setState("hidden");
  };

  if (state === "hidden") return null;

  return (
    <aside
      aria-label="Activar notificaciones"
      className="my-6 bg-paper border-2 border-ink shadow-hard-sm p-4 flex items-center gap-3"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-6 h-6 shrink-0 text-[var(--color-brand)]"
        aria-hidden="true"
      >
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>

      {state === "subscribed" ? (
        <p className="text-sm font-semibold text-ink font-[family-name:var(--font-heading)]">
          Listo, te avisamos cuando hay última hora.
        </p>
      ) : state === "ios" ? (
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink font-[family-name:var(--font-heading)]">
            Para recibir avisos de última hora, instalá la app
          </p>
          <p className="text-xs text-muted mt-0.5">
            En iPhone: botón Compartir → &ldquo;Agregar a inicio&rdquo;.
          </p>
        </div>
      ) : (
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink font-[family-name:var(--font-heading)]">
            ¿Avisamos cuando hay última hora?
          </p>
          <p className="text-xs text-muted mt-0.5">
            Solo notificaciones de urgencia. Nada de spam.
          </p>
        </div>
      )}

      {state !== "subscribed" && (
        <div className="flex items-center gap-2 shrink-0">
          {state !== "ios" && (
            <button
              onClick={activate}
              disabled={busy}
              className="px-3 py-1.5 bg-brand text-ink text-xs font-bold uppercase tracking-wide shadow-hard-sm disabled:opacity-50"
            >
              {busy ? "Activando…" : "Activar"}
            </button>
          )}
          <button
            onClick={dismiss}
            className="text-muted hover:text-ink text-xs px-1"
            aria-label="No activar notificaciones"
          >
            Ahora no
          </button>
        </div>
      )}
    </aside>
  );
}