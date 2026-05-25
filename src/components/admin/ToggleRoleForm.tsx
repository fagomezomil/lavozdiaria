"use client";

import { useRouter } from "next/navigation";
import { toggleRole } from "@/app/admin/users/actions";

export function ToggleRoleForm({ userId, currentRole }: { userId: string; currentRole: string }) {
  const router = useRouter();

  const changeRole = async (newRole: string) => {
    const result = await toggleRole(userId, newRole);
    if (result.error) {
      alert("Error al cambiar rol: " + result.error);
    } else {
      router.refresh();
    }
  };

  if (currentRole === "admin") {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => changeRole("editor")}
          className="text-xs font-semibold px-3 py-1 rounded text-[#d97706] hover:bg-[#f59e0b]/10 transition-colors"
        >
          Cambiar a Editor
        </button>
        <button
          onClick={() => changeRole("user")}
          className="text-xs font-semibold px-3 py-1 rounded text-[#e63946] hover:bg-[#e63946]/10 transition-colors"
        >
          Quitar admin
        </button>
      </div>
    );
  }

  if (currentRole === "editor") {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => changeRole("admin")}
          className="text-xs font-semibold px-3 py-1 rounded text-[#3b82f6] hover:bg-[#3b82f6]/10 transition-colors"
        >
          Hacer admin
        </button>
        <button
          onClick={() => changeRole("user")}
          className="text-xs font-semibold px-3 py-1 rounded text-[#e63946] hover:bg-[#e63946]/10 transition-colors"
        >
          Quitar editor
        </button>
      </div>
    );
  }

  if (currentRole === "suspended") {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => changeRole("user")}
          className="text-xs font-semibold px-3 py-1 rounded text-[#10b981] hover:bg-[#10b981]/10 transition-colors"
        >
          Reactivar
        </button>
      </div>
    );
  }

  // user role
  return (
    <div className="flex gap-2">
      <button
        onClick={() => changeRole("admin")}
        className="text-xs font-semibold px-3 py-1 rounded text-[#3b82f6] hover:bg-[#3b82f6]/10 transition-colors"
      >
        Hacer admin
      </button>
      <button
        onClick={() => changeRole("editor")}
        className="text-xs font-semibold px-3 py-1 rounded text-[#d97706] hover:bg-[#f59e0b]/10 transition-colors"
      >
        Hacer editor
      </button>
      <button
        onClick={() => changeRole("suspended")}
        className="text-xs font-semibold px-3 py-1 rounded text-[#e63946] hover:bg-[#e63946]/10 transition-colors"
      >
        Suspender
      </button>
    </div>
  );
}