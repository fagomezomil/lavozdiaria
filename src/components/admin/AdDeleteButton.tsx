"use client";

import { useRouter } from "next/navigation";
import { deleteAd } from "@/app/admin/ads/deleteAction";

export default function AdDeleteButton({ id }: { id: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que querés eliminar este aviso?")) return;

    const result = await deleteAd(id);
    if (result.error) {
      alert("Error al eliminar: " + result.error);
      return;
    }

    router.refresh();
  };

  return (
    <button
      onClick={handleDelete}
      className="text-xs text-[#e63946] hover:underline ml-3"
    >
      Eliminar
    </button>
  );
}