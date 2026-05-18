import Link from "next/link";
import LogoutButton from "./LogoutButton";

interface AdminLayoutProps {
  children: React.ReactNode;
  role: string;
  email: string;
  activeTab: "avisos" | "clientes" | "patrocinados" | "notas" | "comentarios" | "usuarios";
}

export default function AdminLayout({ children, role, email, activeTab }: AdminLayoutProps) {
  const isAdmin = role === "admin";

  const tabs = [
    ...(isAdmin ? [{ label: "Avisos", href: "/admin", key: "avisos" as const }] : []),
    ...(isAdmin ? [{ label: "Clientes", href: "/admin/clients", key: "clientes" as const }] : []),
    ...(isAdmin ? [{ label: "Patrocinados", href: "/admin/sponsored", key: "patrocinados" as const }] : []),
    { label: "Notas", href: "/admin/articles", key: "notas" as const },
    { label: "Comentarios", href: "/admin/comments", key: "comentarios" as const },
    ...(isAdmin ? [{ label: "Usuarios", href: "/admin/users", key: "usuarios" as const }] : []),
  ];

  return (
    <div className="min-h-screen bg-[#f0efed]">
      <header className="bg-ink text-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="group">
            <h1 className="text-xl font-bold font-[family-name:var(--font-heading)]">
              La<span className="text-[#c8102e]">Voz</span>Diaria
            </h1>
            <p className="text-xs text-white/60">Panel de Administración</p>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/60">{email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex gap-4 mb-6 border-b border-border">
          {tabs.map((tab) => (
            tab.key === activeTab ? (
              <span key={tab.key} className="pb-2 border-b-2 border-ink font-bold text-sm">{tab.label}</span>
            ) : (
              <Link key={tab.key} href={tab.href} className="pb-2 text-sm text-muted hover:text-foreground transition-colors">{tab.label}</Link>
            )
          ))}
        </div>
        {children}
      </main>
    </div>
  );
}