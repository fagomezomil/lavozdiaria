"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/auth";

export default function UserDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const logout = useAuthStore((s) => s.logout);
  const isAdmin = profile?.role === "admin" || profile?.role === "editor";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
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
    setOpen(false);
    await logout();
  };

  return (
    <div ref={ref} className="relative" style={{ overflow: "visible" }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        aria-label="Menú de usuario"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover border border-white/30" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white border border-white/30">
            {initial}
          </div>
        )}
        <span className="text-white/80 text-xs hidden sm:inline">{displayName.split(" ")[0]}</span>
        <svg className={`w-3 h-3 text-white/60 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-lg shadow-xl border border-border py-1" style={{ zIndex: 9999 }}>
          <div className="px-3 py-2 border-b border-border">
            <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
            <p className="text-xs text-muted truncate">{user.email}</p>
          </div>
          <Link
            href="/perfil"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm text-foreground hover:bg-[#f0efed] transition-colors"
          >
            Mi Perfil
          </Link>
          <Link
            href="/perfil?tab=favoritos"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm text-foreground hover:bg-[#f0efed] transition-colors"
          >
            Mis Favoritos
          </Link>
          <Link
            href="/perfil?tab=comentarios"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm text-foreground hover:bg-[#f0efed] transition-colors"
          >
            Mis Comentarios
          </Link>
          <div className="border-t border-border my-1" />
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm text-foreground hover:bg-[#f0efed] transition-colors"
            >
              Administración
            </Link>
          )}
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