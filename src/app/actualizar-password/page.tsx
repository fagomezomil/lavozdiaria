"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ActualizarPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  // Exchange the code from the URL for a session (PKCE flow)
  useEffect(() => {
    const exchangeCode = async () => {
      const supabase = createClient();

      // PKCE flow: the code is in the URL search params
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setValidSession(false);
          setChecking(false);
          return;
        }
      }

      // Check if we have a valid session now
      const { data: { session } } = await supabase.auth.getSession();
      setValidSession(!!session);
      setChecking(false);
    };

    exchangeCode();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 3000);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#f8f5f0] flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-sm text-muted">Verificando...</p>
        </div>
      </div>
    );
  }

  if (!validSession) {
    return (
      <div className="min-h-screen bg-[#f8f5f0] flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-lg shadow-lg p-8 text-center">
          <Link href="/" className="block mb-2 group">
            <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)] group-hover:opacity-80 transition-opacity tracking-wider">
              <span className="text-ink">¡</span><span className="text-brand">QUE</span><span className="text-ink">NOTICIA!</span>
            </h1>
          </Link>
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#e63946]/15 flex items-center justify-center">
            <svg className="w-6 h-6 text-[#e63946]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-sm text-foreground mb-4">
            El link de recuperación expiró o no es válido.
          </p>
          <Link
            href="/recuperar-password"
            className="text-sm text-[#3b82f6] font-semibold hover:underline"
          >
            Solicitar un nuevo link
          </Link>
        </div>
      </div>
    );
  }

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

        <h2 className="text-lg font-bold text-center mb-6">Nueva contraseña</h2>

        {success ? (
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#10b981]/15 flex items-center justify-center">
              <svg className="w-6 h-6 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-foreground mb-2">
              Tu contraseña fue actualizada correctamente.
            </p>
            <p className="text-xs text-muted">
              Redirigiendo al inicio...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                Nueva contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2.5 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                Confirmar contraseña
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2.5 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                placeholder="Repetí la contraseña"
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
              {loading ? "Actualizando..." : "Actualizar contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}