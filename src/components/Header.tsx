import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";

export default async function Header() {
  const today = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let fullName = "";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    fullName = profile?.full_name || user.email || "";
  }

  return (
    <header className="bg-ink text-white">
      {/* Top bar */}
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between text-xs tracking-wider uppercase text-muted">
        <span>{today}</span>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3 normal-case tracking-normal">
              <span className="text-white/80">Hola, {fullName.split(" ")[0] || user.email}</span>
              <LogoutButton />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-white/70 hover:text-white transition-colors">
                Ingresar
              </Link>
              <Link
                href="/register"
                className="px-3 py-1 bg-white/10 rounded text-white hover:bg-white/20 transition-colors"
              >
                Registrarse
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Masthead */}
      <div className="max-w-7xl mx-auto px-4 py-4 text-center border-t border-white/10">
        <Link href="/" className="group">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-[family-name:var(--font-heading)]">
            La<span className="text-[#c8102e]">Voz</span>Diaria
          </h1>
          <p className="mt-1 text-xs tracking-[0.35em] uppercase text-white/70">
            Noticias · Análisis · Verdad
          </p>
        </Link>
      </div>
    </header>
  );
}