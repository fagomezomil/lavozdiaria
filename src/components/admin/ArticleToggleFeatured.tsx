"use client";

import { useRouter } from "next/navigation";
import { toggleArticleFeatured } from "@/app/admin/articles/deleteAction";

const WINDOW_MS = 24 * 60 * 60 * 1000;

export default function ArticleToggleFeatured({
  id,
  featured,
  featuredAt,
}: {
  id: string;
  featured: boolean;
  featuredAt: string | null;
}) {
  const router = useRouter();

  const isStale =
    featured && featuredAt && Date.now() - new Date(featuredAt).getTime() >= WINDOW_MS;

  const label = !featured ? "Destacar" : isStale ? "Renovar" : "Destacada";
  const style = !featured
    ? "bg-muted/30 text-muted"
    : isStale
      ? "border border-[#f97316] text-[#f97316]"
      : "bg-[#f97316]/15 text-[#f97316]";

  const handleToggle = async () => {
    const result = await toggleArticleFeatured(id, featured, featuredAt);
    if (result.error) {
      alert("Error al actualizar: " + result.error);
      return;
    }

    router.refresh();
  };

  return (
    <button onClick={handleToggle} className={`px-2 py-0.5 rounded text-xs font-bold ${style}`}>
      {label}
    </button>
  );
}