"use client";

import { useEffect } from "react";

/** Registra el service worker de la PWA (silencioso, sin UI).
 *  URL con versión: cache-bust del edge cache de Cloudflare, que sirve .js
 *  con headers viejos (el SW hereda el CSP de los headers de su script). */
export default function SWRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js?v=2").catch(() => {
      // best-effort: sin SW el sitio funciona normal (sin offline)
    });
  }, []);

  return null;
}