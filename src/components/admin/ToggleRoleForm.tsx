"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function ToggleRoleForm({ userId, currentRole }: { userId: string; currentRole: string }) {
  const router = useRouter();

  const toggleRole = async () => {
    const supabase = createClient();
    const newRole = currentRole === "admin" ? "user" : "admin";

    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (!error) {
      router.refresh();
    } else {
      alert("Error al cambiar rol: " + error.message);
    }
  };

  return (
    <form action={toggleRole}>
      <button
        type="submit"
        className={`text-xs font-semibold px-3 py-1 rounded transition-colors ${
          currentRole === "admin"
            ? "text-[#e63946] hover:bg-[#e63946]/10"
            : "text-[#10b981] hover:bg-[#10b981]/10"
        }`}
      >
        {currentRole === "admin" ? "Quitar admin" : "Hacer admin"}
      </button>
    </form>
  );
}