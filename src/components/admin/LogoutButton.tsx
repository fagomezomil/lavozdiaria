"use client";

import { useAuthStore } from "@/lib/store/auth";

export default function LogoutButton() {
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
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