"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/auth";
import { SOCIAL_LINKS } from "@/lib/social";

function SocialIcons({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-muted hover:text-foreground transition-colors">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </a>
      <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-muted hover:text-foreground transition-colors">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      </a>
      {SOCIAL_LINKS.x && <a href={SOCIAL_LINKS.x} target="_blank" rel="noopener noreferrer" aria-label="X" className="text-muted hover:text-foreground transition-colors">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>}
      {SOCIAL_LINKS.whatsapp && <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="text-muted hover:text-foreground transition-colors">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>}
    </div>
  );
}

export default function UserDropdown() {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const logout = useAuthStore((s) => s.logout);
  const isAdmin = profile?.role === "admin";
  const isEditor = profile?.role === "editor";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setClosing(true);
        setTimeout(() => { setOpen(false); setClosing(false); }, 150);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setClosing(true);
        setTimeout(() => { setOpen(false); setClosing(false); }, 150);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  if (!user) return null;

  const displayName = profile?.full_name || user.email || "";
  const initial = displayName.charAt(0).toUpperCase();
  const avatarUrl = profile?.avatar_url;

  const handleLogout = async () => {
    setClosing(true);
    setTimeout(async () => { setOpen(false); setClosing(false); await logout(); }, 150);
  };

  const closeDropdown = () => {
    setClosing(true);
    setTimeout(() => { setOpen(false); setClosing(false); }, 150);
  };

  return (
    <div ref={ref} className="relative" style={{ overflow: "visible" }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
        aria-label="Menú de usuario"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover border border-white/30" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-xs font-bold text-brand border border-brand/20">
            {initial}
          </div>
        )}
        <svg className={`w-3 h-3 text-brand transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className={`absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-border py-1 tracking-normal normal-case ${closing ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"} transition-all duration-150`}
          style={{ zIndex: 9999 }}
        >
          {/* User info */}
          <div className="px-3 py-2 border-b border-border">
            <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
            <p className="text-xs text-muted truncate">{user.email}</p>
          </div>

          {/* Navigation links */}
          <Link
            href="/perfil"
            onClick={closeDropdown}
            className="block px-3 py-2 text-sm text-foreground hover:bg-[#f0efed] transition-colors"
          >
            Mi Perfil
          </Link>
          <Link
            href="/perfil?tab=favoritos"
            onClick={closeDropdown}
            className="block px-3 py-2 text-sm text-foreground hover:bg-[#f0efed] transition-colors"
          >
            Mis Favoritos
          </Link>
          <Link
            href="/perfil?tab=comentarios"
            onClick={closeDropdown}
            className="block px-3 py-2 text-sm text-foreground hover:bg-[#f0efed] transition-colors"
          >
            Mis Comentarios
          </Link>
          {(isAdmin || isEditor) && (
            <>
              <div className="border-t border-border my-1" />
              <Link
                href={isEditor ? "/admin/articles" : "/admin"}
                onClick={closeDropdown}
                className="block px-3 py-2 text-sm text-foreground hover:bg-[#f0efed] transition-colors"
              >
                {isEditor ? "Panel de edición" : "Administración"}
              </Link>
            </>
          )}

          {/* Suscribite + Social */}
          <div className="border-t border-border my-1" />
          <div className="px-3 py-2">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Suscribite a ¡QUE NOTICIA!</p>
            <p className="text-[11px] text-muted mt-0.5">Recibí las noticias más importantes</p>
            <SocialIcons className="mt-2" />
          </div>

          {/* Logout */}
          <div className="border-t border-border my-1" />
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-sm text-[#e63946] hover:bg-[#e63946]/5 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

export { SocialIcons };