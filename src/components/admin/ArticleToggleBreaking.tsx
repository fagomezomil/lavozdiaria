"use client";

import { useRouter } from "next/navigation";
import { toggleArticleBreaking } from "@/app/admin/articles/deleteAction";

export default function ArticleToggleBreaking({ id, breaking }: { id: string; breaking: boolean }) {
  const router = useRouter();

  const handleToggle = async () => {
    const result = await toggleArticleBreaking(id, breaking);
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
        breaking ? "bg-urgente text-white" : "bg-muted/30 text-muted"
      }`}
    >
      Última Hora
    </button>
  );
}