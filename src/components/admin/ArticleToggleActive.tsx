"use client";

import { useRouter } from "next/navigation";
import { toggleArticleActive } from "@/app/admin/articles/deleteAction";

export default function ArticleToggleActive({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();

  const handleToggle = async () => {
    const result = await toggleArticleActive(id, active);
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
        active
          ? "bg-[#10b981]/15 text-[#10b981]"
          : "bg-[#e63946]/15 text-[#e63946]"
      }`}
    >
      {active ? "Activa" : "Inactiva"}
    </button>
  );
}