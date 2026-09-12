"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "install-banner-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** Detecta iOS Safari sin PWA instalada: ahí no existe beforeinstallprompt. */
function isIosNoStandalone(): boolean {
  const ua = navigator.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && "ontouchend" in document);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return ios && !standalone;
}

/** Card de instalación en portada (bajo el header). Se scrollea, no es sticky.
 *  Android/desktop: botón Instalar via beforeinstallprompt. iOS: instrucciones. */
export default function InstallBanner() {
  const [state, setState] = useState<"hidden" | "ready" | "ios">("hidden");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY) === "1") return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setState("ready");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // iOS: no hay beforeinstallprompt; mostramos instrucciones tras un momento
    const timer = setTimeout(() => {
      if (isIosNoStandalone()) setState("ios");
    }, 3_000);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      clearTimeout(timer);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem(DISMISS_KEY, "1");
      setState("hidden");
    }
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setState("hidden");
  };

  if (state === "hidden") return null;

  return (
    <aside
      aria-label="Instalar la app"
      className="my-4 bg-ink border-2 border-brand shadow-hard p-4 flex items-center gap-3"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-6 h-6 shrink-0 text-brand"
        aria-hidden="true"
      >
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M5 21h14" />
      </svg>

      {state === "ios" ? (
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-cream font-[family-name:var(--font-heading)] uppercase tracking-wide">
            Llevá ¡QUE NOTICIA! a tu celu
          </p>
          <p className="text-xs text-cream/70 mt-0.5">
            En iPhone: botón Compartir → &ldquo;Agregar a inicio&rdquo;.
          </p>
        </div>
      ) : (
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-cream font-[family-name:var(--font-heading)] uppercase tracking-wide">
            Instalá la app de ¡QUE NOTICIA!
          </p>
          <p className="text-xs text-cream/70 mt-0.5">
            Última hora al instante, funciona sin conexión.
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 shrink-0">
        {state === "ready" && (
          <button
            onClick={install}
            className="px-3 py-1.5 bg-brand text-ink text-xs font-bold uppercase tracking-wide shadow-hard-sm"
          >
            Instalar
          </button>
        )}
        <button
          onClick={dismiss}
          className="text-cream/60 hover:text-cream text-xs px-1"
          aria-label="No instalar la app"
        >
          ✕
        </button>
      </div>
    </aside>
  );
}