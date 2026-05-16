"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/actualizar-password`,
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f8f5f0] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-lg p-8">
        <Link href="/" className="block text-center mb-2 group">
          <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)] group-hover:text-ink/70 transition-colors">
            La<span className="text-[#c8102e] group-hover:text-[#c8102e]/80 transition-colors">Voz</span>Diaria
          </h1>
        </Link>
        <Link
          href="/"
          className="flex items-center justify-center gap-1.5 text-sm text-muted hover:text-ink transition-colors mb-6"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver al inicio
        </Link>

        <h2 className="text-lg font-bold text-center mb-6">Recuperar contraseña</h2>

        {sent ? (
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#10b981]/15 flex items-center justify-center">
              <svg className="w-6 h-6 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-foreground mb-2">
              Te enviamos un email a <strong>{email}</strong> con las instrucciones para crear una nueva contraseña.
            </p>
            <p className="text-xs text-muted">
              Si no lo encontrás, revisá la carpeta de spam.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-block text-sm text-[#3b82f6] font-semibold hover:underline"
            >
              Volver a iniciar sesión
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted text-center mb-4">
              Ingresá tu email y te enviaremos un link para crear una nueva contraseña.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                  placeholder="tu@email.com"
                />
              </div>

              {error && (
                <p className="text-sm text-[#e63946] text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-ink text-white font-bold rounded hover:bg-ink/80 transition-colors disabled:opacity-50"
              >
                {loading ? "Enviando..." : "Enviar instrucciones"}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-muted">
              ¿Ya recordás tu contraseña?{" "}
              <Link href="/login" className="text-[#3b82f6] font-semibold hover:underline">
                Ingresá
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}