"use client";

import Link from "next/link";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <header className="bg-ink text-white py-4 text-center border-b border-white/10">
        <Link href="/">
          <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)]">
            La<span className="text-[#c8102e]">Voz</span>Diaria
          </h1>
        </Link>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold font-[family-name:var(--font-heading)]">
          Error al cargar el artículo
        </h2>
        <p className="mt-4 text-muted">
          Hubo un problema al obtener la información. Intentá de nuevo.
        </p>
        <button
          onClick={() => reset()}
          className="mt-6 px-6 py-2 bg-ink text-white rounded-sm hover:bg-ink/80 transition-colors"
        >
          Reintentar
        </button>
      </main>
    </div>
  );
}