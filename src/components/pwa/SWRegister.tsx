"use client";

import { useEffect } from "react";

/** Registra el service worker de la PWA (silencioso, sin UI). */
export default function SWRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // best-effort: sin SW el sitio funciona normal (sin offline)
    });
  }, []);

  return null;
}