"use client";

import Link from "next/link";
import { useState } from "react";
import { sectionConfig } from "@/lib/types";

export default function Navbar() {
  const sections = Object.entries(sectionConfig);
  const [menuOpen, setMenuOpen] = useState(false);

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
        </ul>
      )}
    </nav>
  );
}