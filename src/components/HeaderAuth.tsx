"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/auth";
import UserDropdown, { SocialIcons } from "@/components/UserDropdown";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function GuestDropdown() {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  const closeDropdown = () => {
    setClosing(true);
    setTimeout(() => { setOpen(false); setClosing(false); }, 150);
  };

  return (
    <div ref={ref} className="relative" style={{ overflow: "visible" }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 hover:opacity-80 transition-opacity"
        aria-label="Menú de usuario"
      >
        <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.215-.584-7.499-1.632z" />
        </svg>
        <svg className={`w-3 h-3 text-white/70 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className={`absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-border py-1 ${closing ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"} transition-all duration-150`}
          style={{ zIndex: 9999 }}
        >
          {/* Suscribite */}
          <div className="px-3 py-2">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Suscribite a LaVozDiaria</p>
            <p className="text-[11px] text-muted mt-0.5">Recibí las noticias más importantes</p>
            <SocialIcons className="mt-2" />
          </div>

          {/* Google login */}
          <div className="border-t border-border my-1" />
          <button
            onClick={() => { closeDropdown(); alert("Próximamente: inicio de sesión con Google"); }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-[#f0efed] transition-colors"
          >
            <GoogleIcon />
            <span>Iniciar sesión con Google</span>
          </button>

          {/* Login / Register links */}
          <div className="border-t border-border my-1" />
          <div className="flex items-center justify-center gap-4 px-3 py-2">
            <Link
              href="/login"
              onClick={closeDropdown}
              className="text-sm text-[#c8102e] font-semibold hover:underline"
            >
              Ingresar
            </Link>
            <Link
              href="/register"
              onClick={closeDropdown}
              className="text-sm text-muted font-semibold hover:text-foreground transition-colors"
            >
              Registrarse
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HeaderAuth() {
  const user = useAuthStore((s) => s.user);

  if (user) {
    return <UserDropdown />;
  }

  return <GuestDropdown />;
}