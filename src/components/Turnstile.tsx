"use client";

import { useEffect, useRef, useId, useCallback } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (selector: string | HTMLElement, options: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id: string) => void;
    };
  }
}

interface TurnstileProps {
  onToken: (token: string) => void;
  className?: string;
}

/** Widget de Cloudflare Turnstile (validación anti-bot invisible).
 *  Requiere NEXT_PUBLIC_TURNSTILE_SITE_KEY en env. Si no está, no renderiza nada
 *  (en dev sin keys, el form sigue funcionando pero sin verificación). */
export default function Turnstile({ onToken, className }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const reactId = useId().replace(/[:]/g, "");
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  const renderWidget = useCallback(() => {
    if (!window.turnstile || !containerRef.current) return;
    if (widgetIdRef.current) return;
    const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!sitekey) {
      // Sin sitekey (dev sin configurar), simular token OK para no bloquear
      onTokenRef.current("dev-mode");
      return;
    }
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey,
      callback: (token: string) => onTokenRef.current(token),
      "error-callback": () => onTokenRef.current(""),
      "expired-callback": () => onTokenRef.current(""),
      theme: "light",
    });
  }, []);

  useEffect(() => {
    if (window.turnstile) {
      renderWidget();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    script.onload = renderWidget;
    document.head.appendChild(script);

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [renderWidget]);

  return <div ref={containerRef} id={reactId} className={className} />;
}