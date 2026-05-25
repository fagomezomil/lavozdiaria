"use client";

import { useRouter } from "next/navigation";
import { deleteArticle } from "@/app/admin/articles/deleteAction";

export default function ArticleDeleteButton({ id }: { id: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que querés eliminar esta nota?")) return;

    const result = await deleteArticle(id);
    if (result.error) {
      alert("Error al eliminar: " + result.error);
      return;
    }

    router.refresh();
  };

  return (
    <button
      onClick={handleDelete}
      className="text-xs text-[#e63946] hover:underline"
    >
      Eliminar
    </button>
  );
}