"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { sectionConfig } from "@/lib/types";
import { useAuthStore } from "@/lib/store/auth";
import { SOCIAL_LINKS } from "@/lib/social";
import UserDropdown from "./UserDropdown";
import GuestDropdown from "./HeaderAuth";

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
    <nav className="bg-ink sticky top-0 z-50 border-t-[3px] border-brand shadow-[0_4px_0_0_var(--color-ink)]">
      <div className="max-w-7xl mx-auto px-4">
        {/* Desktop navbar */}
        <div className="hidden md:flex items-center">
          <div
            className="shrink-0 mr-4 overflow-hidden transition-all duration-300"
            style={{ width: scrolled ? 180 : 0, opacity: scrolled ? 1 : 0 }}
          >
            <Link
              href="/"
              className="whitespace-nowrap font-[family-name:var(--font-heading)] font-bold text-lg leading-none tracking-wider"
              aria-label="¡QUE NOTICIA!"
            >
              <span className="text-white">¡</span><span className="text-brand">QUE</span><span className="text-white">NOTICIA!</span>
            </Link>
          </div>
          <ul className="flex items-center justify-center gap-0 divide-x divide-white/15 flex-1">
            <li>
              <Link
                href="/"
                className="block px-4 py-2.5 text-[13px] tracking-widest uppercase text-white hover:bg-brand font-[family-name:var(--font-heading)] font-semibold transition-colors"
              >
                Portada
              </Link>
            </li>
            {sections.map(([key, cfg]) => (
              <li key={key}>
                <Link
                  href={cfg.path}
                  className="block px-4 py-2.5 text-[13px] tracking-widest uppercase text-white font-[family-name:var(--font-heading)] font-semibold transition-all hover:text-white"
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
                className="block px-4 py-2.5 text-[13px] tracking-widest uppercase text-white font-[family-name:var(--font-heading)] font-semibold transition-all hover:text-white"
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
            <li>
              <Link
                href="/agenda"
                className="block px-4 py-2.5 text-[13px] tracking-widest uppercase text-white font-[family-name:var(--font-heading)] font-semibold transition-all hover:text-white"
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = "#db2777";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = "";
                }}
              >
                Agenda
              </Link>
            </li>
          </ul>
          <div
            className="shrink-0 ml-4 transition-all duration-300"
            style={{ width: scrolled ? 48 : 0, opacity: scrolled ? 1 : 0, transform: scrolled ? "translateX(0)" : "translateX(16px)", overflow: "visible" }}
          >
            {user ? <UserDropdown /> : <GuestDropdown />}
          </div>
        </div>

        {/* Mobile: hamburger button */}
        <div className="md:hidden flex items-center justify-between py-2.5">
          <Link
            href="/"
            className="whitespace-nowrap font-[family-name:var(--font-heading)] font-bold text-lg leading-none tracking-wider"
            aria-label="¡QUE NOTICIA!"
          >
            <span className="text-white">¡</span><span className="text-brand">QUE</span><span className="text-white">NOTICIA!</span>
          </Link>
          <div className="flex items-center gap-3">
            {user && <UserDropdown />}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-10 h-10 flex items-center justify-center text-white"
              aria-label="Menú"
            >
              {menuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <ul className="md:hidden border-t-2 border-brand">
          <li>
            <Link
              href="/"
              className="block px-6 py-3 text-sm tracking-widest uppercase text-white hover:bg-brand font-[family-name:var(--font-heading)] font-semibold transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Portada
            </Link>
          </li>
          {sections.map(([key, cfg]) => (
            <li key={key}>
              <Link
                href={cfg.path}
                className="block px-6 py-3 text-sm tracking-widest uppercase text-white font-[family-name:var(--font-heading)] font-bold transition-colors"
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
              className="block px-6 py-3 text-sm tracking-widest uppercase text-white font-[family-name:var(--font-heading)] font-bold transition-colors"
              style={{ backgroundColor: "#0ea5e9" }}
              onClick={() => setMenuOpen(false)}
            >
              Clima
            </Link>
          </li>
          <li>
            <Link
              href="/agenda"
              className="block px-6 py-3 text-sm tracking-widest uppercase text-white font-[family-name:var(--font-heading)] font-bold transition-colors"
              style={{ backgroundColor: "#db2777" }}
              onClick={() => setMenuOpen(false)}
            >
              Agenda
            </Link>
          </li>
          <li className="border-t-2 border-brand px-6 py-3">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover border border-white/30" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-xs font-bold text-brand border border-brand/20">
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
                  <Link href={profile?.role === "editor" ? "/admin/articles" : "/admin"} onClick={() => setMenuOpen(false)} className="block text-sm text-white/70 hover:text-white transition-colors">
                    {profile?.role === "editor" ? "Panel de edición" : "Administración"}
                  </Link>
                )}
                {/* Suscribite + Social */}
                <div className="pt-2 border-t border-white/10">
                  <p className="text-[11px] font-semibold text-white/80 uppercase tracking-wider">Suscribite a ¡QUE NOTICIA!</p>
                  <p className="text-[10px] text-white/50 mt-0.5">Recibí las noticias más importantes</p>
                  <div className="flex items-center gap-2.5 mt-1.5">
                    <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-white/50 hover:text-white transition-colors">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                    </a>
                    <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-white/50 hover:text-white transition-colors">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                    </a>
                    {SOCIAL_LINKS.x && <a href={SOCIAL_LINKS.x} target="_blank" rel="noopener noreferrer" aria-label="X" className="text-white/50 hover:text-white transition-colors">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                    </a>}
                    {SOCIAL_LINKS.whatsapp && <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="text-white/50 hover:text-white transition-colors">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                    </a>}
                  </div>
                </div>
                <button onClick={handleLogout} className="block text-sm text-brand hover:text-brand/80 font-semibold transition-colors">
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] font-semibold text-white/80 uppercase tracking-wider">Suscribite a ¡QUE NOTICIA!</p>
                  <p className="text-[10px] text-white/50 mt-0.5">Recibí las noticias más importantes</p>
                  <div className="flex items-center gap-2.5 mt-1.5">
                    <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-white/50 hover:text-white transition-colors">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                    </a>
                    <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-white/50 hover:text-white transition-colors">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                    </a>
                    {SOCIAL_LINKS.x && <a href={SOCIAL_LINKS.x} target="_blank" rel="noopener noreferrer" aria-label="X" className="text-white/50 hover:text-white transition-colors">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                    </a>}
                    {SOCIAL_LINKS.whatsapp && <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="text-white/50 hover:text-white transition-colors">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                    </a>}
                  </div>
                </div>
                <button
                  onClick={() => alert("Próximamente: inicio de sesión con Google")}
                  className="w-full flex items-center justify-center gap-2 py-2 border border-white/20 rounded text-white text-sm hover:bg-white/10 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Iniciar sesión con Google
                </button>
                <div className="flex gap-4">
                  <Link href="/login" onClick={() => setMenuOpen(false)} className="text-sm text-white/70 hover:text-white transition-colors">Ingresar</Link>
                  <Link href="/register" onClick={() => setMenuOpen(false)} className="text-sm text-white/70 hover:text-white transition-colors">Registrarse</Link>
                </div>
              </div>
            )}
          </li>
        </ul>
      )}
    </nav>
  );
}