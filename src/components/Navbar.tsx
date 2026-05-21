"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { sectionConfig } from "@/lib/types";
import { useAuthStore } from "@/lib/store/auth";
import UserDropdown from "./UserDropdown";

export default function Navbar() {
  const sections = Object.entries(sectionConfig);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
  };

  return (
    <nav className="bg-ink sticky top-0 z-50 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4">
        {/* Desktop navbar */}
        <div className="hidden md:flex items-center">
          <div
            className="shrink-0 mr-4 overflow-hidden transition-all duration-300"
            style={{ width: scrolled ? 72 : 0, opacity: scrolled ? 1 : 0 }}
          >
            <Link href="/" className="whitespace-nowrap">
              <span className="text-[16px] font-bold tracking-tight font-[family-name:var(--font-heading)] text-white">
                L<span className="text-[#c8102e]">V</span>D
              </span>
            </Link>
          </div>
          <ul className="flex items-center justify-center gap-0 divide-x divide-white/10 flex-1">
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
            <li>
              <Link
                href="/clima"
                className="block px-4 py-2.5 text-xs tracking-widest uppercase text-white font-bold transition-all hover:text-white"
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = "#0ea5e9";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = "";
                }}
              >
                Clima
              </Link>
            </li>
          </ul>
          <div
            className="shrink-0 ml-4 transition-all duration-300"
            style={{ width: scrolled ? 48 : 0, opacity: scrolled ? 1 : 0 }}
          >
            <UserDropdown />
          </div>
        </div>

        {/* Mobile: hamburger button */}
        <div className="md:hidden flex items-center justify-between py-2.5">
          <div
            className="overflow-hidden transition-all duration-300"
            style={{ width: scrolled ? 52 : 0, opacity: scrolled ? 1 : 0 }}
          >
            <Link href="/" className="whitespace-nowrap">
              <span className="text-[16px] font-bold tracking-tight font-[family-name:var(--font-heading)] text-white">
                L<span className="text-[#c8102e]">V</span>D
              </span>
            </Link>
          </div>
          <Link
            href="/"
            className="text-xs tracking-widest uppercase text-white font-bold transition-all duration-300"
            style={{ opacity: scrolled ? 0 : 1, width: scrolled ? 0 : "auto", position: scrolled ? "absolute" : "relative" }}
          >
            Portada
          </Link>
          <div className="flex items-center gap-3">
            <div
              className="overflow-hidden transition-all duration-300"
              style={{ width: scrolled ? 36 : 0, opacity: scrolled ? 1 : 0 }}
            >
              {user && <UserDropdown />}
            </div>
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
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <ul className="md:hidden border-t border-white/10">
          <li>
            <Link
              href="/"
              className="block px-6 py-3 text-sm tracking-widest uppercase text-white hover:bg-white/10 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Portada
            </Link>
          </li>
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
          <li>
            <Link
              href="/clima"
              className="block px-6 py-3 text-sm tracking-widest uppercase text-white font-bold transition-colors"
              style={{ backgroundColor: "#0ea5e9" }}
              onClick={() => setMenuOpen(false)}
            >
              Clima
            </Link>
          </li>
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
                <Link href="/perfil" onClick={() => setMenuOpen(false)} className="block text-sm text-white/70 hover:text-white transition-colors">
                  Mi Perfil
                </Link>
                <Link href="/perfil?tab=favoritos" onClick={() => setMenuOpen(false)} className="block text-sm text-white/70 hover:text-white transition-colors">
                  Mis Favoritos
                </Link>
                <Link href="/perfil?tab=comentarios" onClick={() => setMenuOpen(false)} className="block text-sm text-white/70 hover:text-white transition-colors">
                  Mis Comentarios
                </Link>
                {(profile?.role === "admin" || profile?.role === "editor") && (
                  <Link href="/admin" onClick={() => setMenuOpen(false)} className="block text-sm text-white/70 hover:text-white transition-colors">
                    Administración
                  </Link>
                )}
                <button onClick={handleLogout} className="block text-sm text-[#e63946] hover:text-[#e63946]/80 transition-colors">
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <div className="flex gap-4">
                <Link href="/login" onClick={() => setMenuOpen(false)} className="text-sm text-white/70 hover:text-white transition-colors">Ingresar</Link>
                <Link href="/register" onClick={() => setMenuOpen(false)} className="text-sm text-white/70 hover:text-white transition-colors">Registrarse</Link>
              </div>
            )}
          </li>
        </ul>
      )}
    </nav>
  );
}