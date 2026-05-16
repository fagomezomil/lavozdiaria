"use client";

import Link from "next/link";
import { useState } from "react";
import { sectionConfig } from "@/lib/types";
import { useAuthStore } from "@/lib/store/auth";

export default function Navbar() {
  const sections = Object.entries(sectionConfig);
  const [menuOpen, setMenuOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
  };

  return (
    <nav className="bg-ink sticky top-0 z-50 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4">
        {/* Desktop navbar */}
        <ul className="hidden md:flex items-center justify-center gap-0 divide-x divide-white/10">
          <li>
            <Link
              href="/"
              className="block px-4 py-2.5 text-xs tracking-widest uppercase text-white hover:bg-white/10 transition-colors"
            >
              Portada
            </Link>
          </li>
          {sections.map(([key, cfg]) => (
            <li key={key}>
              <Link
                href={cfg.path}
                className="block px-4 py-2.5 text-xs tracking-widest uppercase text-white font-bold transition-all hover:text-white"
                style={{ "--section-color": cfg.color } as React.CSSProperties}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = cfg.color;
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = "";
                }}
              >
                {cfg.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Mobile: hamburger button */}
        <div className="md:hidden flex items-center justify-between py-2.5">
          <Link href="/" className="text-xs tracking-widest uppercase text-white font-bold">
            Portada
          </Link>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-10 h-10 flex items-center justify-center text-white"
            aria-label="Menú"
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <ul className="md:hidden border-t border-white/10">
          {sections.map(([key, cfg]) => (
            <li key={key}>
              <Link
                href={cfg.path}
                className="block px-6 py-3 text-sm tracking-widest uppercase text-white font-bold transition-colors"
                style={{ backgroundColor: cfg.color }}
                onClick={() => setMenuOpen(false)}
              >
                {cfg.label}
              </Link>
            </li>
          ))}
          {/* Auth section */}
          <li className="border-t border-white/10 px-6 py-3">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover border border-white/30" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white border border-white/30">
                      {(profile?.full_name || user.email || "").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm text-white font-semibold">{profile?.full_name || user.email}</span>
                </div>
                <Link
                  href="/perfil"
                  onClick={() => setMenuOpen(false)}
                  className="block text-sm text-white/70 hover:text-white transition-colors"
                >
                  Mi Perfil
                </Link>
                <Link
                  href="/perfil?tab=favoritos"
                  onClick={() => setMenuOpen(false)}
                  className="block text-sm text-white/70 hover:text-white transition-colors"
                >
                  Mis Favoritos
                </Link>
                <Link
                  href="/perfil?tab=comentarios"
                  onClick={() => setMenuOpen(false)}
                  className="block text-sm text-white/70 hover:text-white transition-colors"
                >
                  Mis Comentarios
                </Link>
                <button
                  onClick={handleLogout}
                  className="block text-sm text-[#e63946] hover:text-[#e63946]/80 transition-colors"
                >
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <div className="flex gap-4">
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  Ingresar
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </li>
        </ul>
      )}
    </nav>
  );
}