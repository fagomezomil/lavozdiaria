"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";

interface AdminShellProps {
  role: string;
  email: string;
  children: React.ReactNode;
}

const adminTabs = [
  { label: "Avisos", href: "/admin", key: "avisos" },
  { label: "Clientes", href: "/admin/clients", key: "clientes" },
  { label: "Patrocinados", href: "/admin/sponsored", key: "patrocinados" },
  { label: "Notas", href: "/admin/articles", key: "notas" },
  { label: "Notas de Opinión", href: "/admin/opinion", key: "opinion" },
  { label: "Columnistas", href: "/admin/columnists", key: "columnistas" },
  { label: "Comentarios", href: "/admin/comments", key: "comentarios" },
  { label: "Usuarios", href: "/admin/users", key: "usuarios" },
  { label: "Estadísticas", href: "/admin/stats", key: "estadisticas" },
];

const editorTabs = [
  { label: "Notas", href: "/admin/articles", key: "notas" },
  { label: "Notas de Opinión", href: "/admin/opinion", key: "opinion" },
  { label: "Comentarios", href: "/admin/comments", key: "comentarios" },
];

export default function AdminShell({ role, email, children }: AdminShellProps) {
  const pathname = usePathname();
  const isAdmin = role === "admin";
  const tabs = isAdmin ? adminTabs : editorTabs;

  const getActiveKey = () => {
    if (pathname === "/admin") return "avisos";
    for (const tab of tabs) {
      if (tab.href !== "/admin" && pathname.startsWith(tab.href)) return tab.key;
    }
    return "";
  };
  const activeKey = getActiveKey();

  return (
    <div className="bg-[var(--color-admin-bg)]">
      {/* Sub-navigation bar */}
      <div className="bg-ink border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <span className="text-[10px] tracking-[0.3em] uppercase text-white/50 font-[family-name:var(--font-heading)]">
              Mesa de Redacción
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/40 hidden sm:inline">{email}</span>
              <LogoutButton />
            </div>
          </div>
          <div className="flex gap-1 -mb-px overflow-x-auto">
            {tabs.map((tab) => (
              tab.key === activeKey ? (
                <span
                  key={tab.key}
                  className="px-3 py-2 text-sm font-bold text-white border-b-2 border-[var(--color-brand)]"
                >
                  {tab.label}
                </span>
              ) : (
                <Link
                  key={tab.key}
                  href={tab.href}
                  className="px-3 py-2 text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors rounded-t"
                >
                  {tab.label}
                </Link>
              )
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {children}
    </div>
  );
}