"use client";

import { useAuthStore } from "@/lib/store/auth";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="text-xs text-white/70 hover:text-white transition-colors"
    >
      Cerrar sesión
    </button>
  );
}