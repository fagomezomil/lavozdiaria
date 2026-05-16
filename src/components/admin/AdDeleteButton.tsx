"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdDeleteButton({ id }: { id: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que querés eliminar este aviso?")) return;

    const supabase = createClient();
    const { error } = await supabase.from("ads").delete().eq("id", id);

    if (error) {
      alert("Error al eliminar: " + error.message);
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