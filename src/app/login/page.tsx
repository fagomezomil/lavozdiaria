"use client";

import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function LoginCard() {
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect") || "/";
  // Solo paths internos: debe empezar con "/" y no "//" (protocol-relative)
  const redirectTo = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Email o contraseña incorrectos");
      setLoading(false);
      return;
    }

    // Check if user is suspended
    const { data: { user: loggedInUser } } = await supabase.auth.getUser();
    if (loggedInUser) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", loggedInUser.id)
        .single();

      if (profile?.role === "suspended") {
        await supabase.auth.signOut();
        setError("Tu cuenta está suspendida. Contactá al administrador.");
        setLoading(false);
        return;
      }
    }

    router.push(redirectTo);
    router.refresh();
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

        <h2 className="text-lg font-bold text-center mb-6">Ingresá a tu cuenta</h2>

        <form onSubmit={handleLogin} className="space-y-4">
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
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
              placeholder="••••••••"
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
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <div className="flex items-center gap-3 mt-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted uppercase tracking-wider">o</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <button
          onClick={() => alert("Próximamente: inicio de sesión con Google")}
          className="w-full flex items-center justify-center gap-2 mt-3 py-2.5 border border-border rounded hover:bg-[#f8f5f0] transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span className="text-sm font-medium text-ink">Iniciar sesión con Google</span>
        </button>

        <p className="mt-4 text-center text-sm text-muted">
          ¿No tenés cuenta?{" "}
          <Link href="/register" className="text-[#3b82f6] font-semibold hover:underline">
            Registrate
          </Link>
        </p>

        <Link
          href="/recuperar-password"
          className="block mt-2 text-center text-xs text-muted hover:text-[#3b82f6] transition-colors"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginCard />
    </Suspense>
  );
}