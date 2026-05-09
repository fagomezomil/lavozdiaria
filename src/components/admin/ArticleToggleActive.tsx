"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ArticleToggleActive({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();

  const handleToggle = async () => {
    const supabase = createClient();
    const { error } = await supabase
      .from("articles")
      .update({ active: !active })
      .eq("id", id);

    if (error) {
      alert("Error al actualizar: " + error.message);
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