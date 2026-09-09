"use client";

import { useRouter } from "next/navigation";
import { toggleArticlePinned } from "@/app/admin/articles/deleteAction";

export default function ArticleTogglePinned({ id, pinned }: { id: string; pinned: boolean }) {
  const router = useRouter();

  const handleToggle = async () => {
    const result = await toggleArticlePinned(id, pinned);
    if (result.error) {
      alert("Error al actualizar: " + result.error);
      return;
    }

    router.refresh();
  };

  return (
    <button
      onClick={handleToggle}
      className={`px-2 py-0.5 rounded text-xs font-bold ${
        pinned ? "bg-ink text-cream" : "bg-muted/30 text-muted"
      }`}
    >
      {pinned ? "Fijada" : "Fijar"}
    </button>
  );
}