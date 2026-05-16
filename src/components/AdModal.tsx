"use client";

import { useEffect, useState } from "react";
import type { Ad } from "@/lib/types";

const MODAL_CAP_KEY = "lv_modal_shown";
const MAX_MODAL_PER_DAY = 3;

function canShowModal(): boolean {
  try {
    // Session cap: max once per session
    if (sessionStorage.getItem(MODAL_CAP_KEY + "_session")) return false;

    // Daily cap: max N per day
    const stored = localStorage.getItem(MODAL_CAP_KEY);
    if (!stored) return true;
    const entries: { timestamp: number }[] = JSON.parse(stored);
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recent = entries.filter((e) => e.timestamp > dayAgo);
    return recent.length < MAX_MODAL_PER_DAY;
  } catch {
    return true;
  }
}

function recordModalShown(): void {
  try {
    // Record in localStorage for daily cap
    const stored = localStorage.getItem(MODAL_CAP_KEY);
    const entries: { timestamp: number }[] = stored ? JSON.parse(stored) : [];
    entries.push({ timestamp: Date.now() });
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recent = entries.filter((e) => e.timestamp > dayAgo);
    localStorage.setItem(MODAL_CAP_KEY, JSON.stringify(recent));

    // Record in sessionStorage for session cap
    sessionStorage.setItem(MODAL_CAP_KEY + "_session", "1");
  } catch {
    // Ignore storage errors
  }
}

interface AdModalProps {
  ad?: Ad | null;
}

export default function AdModal({ ad }: AdModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (!canShowModal()) return;

    const timer = setTimeout(() => {
      setIsOpen(true);
      recordModalShown();
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  if (!isOpen) return null;

  const hasImage = ad?.image_url;
  const imgSrc = hasImage
    ? (isMobile && ad!.mobile_image_url ? ad!.mobile_image_url : ad!.image_url)
    : null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 animate-ad-overlay-in"
      onClick={() => setIsOpen(false)}
    >
      <div
        className={`relative w-[95vw] md:w-[90vw] max-w-[900px] h-[80vh] md:h-[70vh] max-h-[600px] rounded-lg overflow-hidden ${
          hasImage ? "" : "bg-[#f0efed] border-2 border-dashed border-[#d4cfc7] flex items-center justify-center"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-2 right-2 md:top-3 md:right-3 z-10 w-9 h-9 md:w-8 md:h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-[#555] hover:text-[#333] transition-colors shadow-sm"
          aria-label="Cerrar aviso"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {imgSrc ? (
          ad!.link_url ? (
            <a href={ad!.link_url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
              <img
                src={imgSrc}
                alt={ad!.title || "Aviso publicitario"}
                className="w-full h-full object-cover"
              />
            </a>
          ) : (
            <img
              src={imgSrc}
              alt={ad!.title || "Aviso publicitario"}
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <div className="text-center px-8">
            <svg
              className="mx-auto mb-3 w-10 h-10 text-[#bbb]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6l4 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-lg tracking-[0.2em] uppercase text-[#9a9a9a] font-medium">
              Espacio publicitario
            </span>
            <p className="mt-2 text-sm text-[#bbb]">
              Aviso de gran formato
            </p>
          </div>
        )}
      </div>
    </div>
  );
}