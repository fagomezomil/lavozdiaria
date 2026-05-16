"use client";

import { useUIStore } from "@/lib/store/ui";

export default function FontSizeControl() {
  const fontSize = useUIStore((s) => s.fontSize);
  const setFontSize = useUIStore((s) => s.setFontSize);

  return (
    <div className="flex items-center gap-0.5 rounded-full border border-border bg-white/80 px-1 py-0.5">
      <button
        onClick={() => setFontSize(Math.max(fontSize - 1, -1))}
        disabled={fontSize <= -1}
        className="w-6 h-6 flex items-center justify-center rounded-full text-muted hover:text-foreground hover:bg-[#f0efed] transition-colors disabled:opacity-30 disabled:cursor-default"
        aria-label="Reducir texto"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
        </svg>
      </button>
      <span className="text-[10px] text-muted/60 select-none px-0.5">Aa</span>
      <button
        onClick={() => setFontSize(Math.min(fontSize + 1, 2))}
        disabled={fontSize >= 2}
        className="w-6 h-6 flex items-center justify-center rounded-full text-muted hover:text-foreground hover:bg-[#f0efed] transition-colors disabled:opacity-30 disabled:cursor-default"
        aria-label="Aumentar texto"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}