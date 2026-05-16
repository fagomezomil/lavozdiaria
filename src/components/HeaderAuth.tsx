"use client";

import Link from "next/link";
import { useAuthStore } from "@/lib/store/auth";
import UserDropdown from "@/components/UserDropdown";

export default function HeaderAuth() {
  const user = useAuthStore((s) => s.user);

  if (user) {
    return <UserDropdown />;
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/login" className="text-white/70 hover:text-white transition-colors">
        Ingresar
      </Link>
      <Link
        href="/register"
        className="px-3 py-1 bg-white/10 rounded text-white hover:bg-white/20 transition-colors"
      >
        Registrarse
      </Link>
    </div>
  );
}