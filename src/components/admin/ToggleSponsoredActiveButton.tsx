"use client";

import { useTransition } from "react";

interface ToggleSponsoredActiveButtonProps {
  sponsoredId: string;
  currentActive: boolean;
}

export default function ToggleSponsoredActiveButton({
  sponsoredId,
  currentActive,
}: ToggleSponsoredActiveButtonProps) {
  const [pending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      const { toggleSponsoredActive } = await import("@/app/admin/sponsored/actions");
      await toggleSponsoredActive(sponsoredId, currentActive);
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={pending}
      className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap disabled:opacity-50 ${
        currentActive
          ? "text-[#e63946] hover:bg-[#e63946]/10"
          : "text-[#10b981] hover:bg-[#10b981]/10"
      }`}
      title={currentActive ? "Suspender contenido" : "Activar contenido"}
    >
      {pending ? "…" : currentActive ? "Suspender" : "Activar"}
    </button>
  );
}