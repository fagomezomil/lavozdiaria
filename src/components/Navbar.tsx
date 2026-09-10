"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { sectionConfig } from "@/lib/types";
import { useAuthStore } from "@/lib/store/auth";
import { SOCIAL_LINKS } from "@/lib/social";
import UserDropdown from "./UserDropdown";
import GuestDropdown from "./HeaderAuth";
import GoogleLoginButton from "./GoogleLoginButton";

interface NavbarProps {
  /** Si es false, oculta la pestaña Opinión del menú (no hay notas publicadas). */
  hasOpinionNotes?: boolean;
}

export default function Navbar({ hasOpinionNotes = true }: NavbarProps = {}) {
  const sections = Object.entries(sectionConfig).filter(
    ([key]) => key !== "opinion" || hasOpinionNotes,
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
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
    router.push("/");
    router.refresh();
  };

  return (
    <nav className="bg-ink sticky top-0 z-40 border-t-[3px] border-brand shadow-[0_4px_0_0_var(--color-ink)]">
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
                aria-label="Clima"
                title="Clima"
                className="block px-4 py-2.5 text-white transition-all hover:text-white"
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = "#0ea5e9";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = "";
                }}
              >
                <svg viewBox="0 -960 960 960" fill="currentColor" className="w-5 h-5" aria-hidden="true">
                  <path d="m734-169-56-57q-11-12-11-28.5t11-27.5q11-11 27.5-11t28.5 11l57 56q12 12 12 28.5T791-169q-12 12-28.5 12T734-169Zm-494 9q-66 0-113-47T80-320q0-66 47-113t113-47q48 0 88.5 26t58.5 71l10 23h24q42 0 70.5 29t28.5 71q0 42-29 71t-71 29H240Zm359-112q-4-63-45.5-109T449-438q-31-54-83.5-85.5T250-560q26-73 89-116.5T480-720q100 0 170 70t70 170q0 65-32 120.5T599-272Zm201-168q-17 0-28.5-11.5T760-480q0-17 11.5-28.5T800-520h80q17 0 28.5 11.5T920-480q0 17-11.5 28.5T880-440h-80ZM226-678l-57-57q-11-11-11-28t11-28q12-12 28.5-12t28.5 12l56 57q11 12 11 28.5T282-678q-11 11-28 11t-28-11Zm452 0q-11-11-11-27.5t11-28.5l56-57q12-12 28.5-12t28.5 12q11 11 11 28t-11 28l-57 57q-11 11-28 11t-28-11Zm-198-82q-17 0-28.5-11.5T440-800v-80q0-17 11.5-28.5T480-920q17 0 28.5 11.5T520-880v80q0 17-11.5 28.5T480-760Z" />
                </svg>
              </Link>
            </li>
            <li>
              <Link
                href="/agenda"
                aria-label="Agenda"
                title="Agenda"
                className="block px-4 py-2.5 text-white transition-all hover:text-white"
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = "#db2777";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = "";
                }}
              >
                <svg viewBox="0 -960 960 960" fill="currentColor" className="w-5 h-5" aria-hidden="true">
                  <path d="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-40q0-17 11.5-28.5T280-880q17 0 28.5 11.5T320-840v40h320v-40q0-17 11.5-28.5T680-880q17 0 28.5 11.5T720-840v40h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm280-240q-17 0-28.5-11.5T440-440q0-17 11.5-28.5T480-480q17 0 28.5 11.5T520-440q0 17-11.5 28.5T480-400Zm-160 0q-17 0-28.5-11.5T280-440q0-17 11.5-28.5T320-480q17 0 28.5 11.5T360-440q0 17-11.5 28.5T320-400Zm320 0q-17 0-28.5-11.5T600-440q0-17 11.5-28.5T640-480q17 0 28.5 11.5T680-440q0 17-11.5 28.5T640-400ZM480-240q-17 0-28.5-11.5T440-280q0-17 11.5-28.5T480-320q17 0 28.5 11.5T520-280q0 17-11.5 28.5T480-240Zm-160 0q-17 0-28.5-11.5T280-280q0-17 11.5-28.5T320-320q17 0 28.5 11.5T360-280q0 17-11.5 28.5T320-240Zm320 0q-17 0-28.5-11.5T600-280q0-17 11.5-28.5T640-320q17 0 28.5 11.5T680-280q0 17-11.5 28.5T640-240Z" />
                </svg>
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
                <GoogleLoginButton variant="block" />
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