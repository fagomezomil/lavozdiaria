import { requireAdmin } from "@/lib/supabase/server";
import { getClientById, getClientAds } from "@/lib/clients";
import { getClientSponsored } from "@/lib/sponsored";
import AdminLayout from "@/components/admin/AdminLayout";
import Link from "next/link";
import { redirect } from "next/navigation";
import { sectionConfig } from "@/lib/types";
import type { Ad, SponsoredContent } from "@/lib/types";

interface ClientDetailPageProps {
  params: Promise<{ id: string }>;
}

const typeLabels: Record<string, string> = {
  leaderboard: "Leaderboard",
  rectangle: "Rectangle",
  sidebar: "Sidebar",
  modal: "Modal",
  infeed: "In-Feed",
  sticky_footer: "Sticky Footer",
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-AR");
}

function daysRemaining(expiresAt: string | null) {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff < 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { user } = await requireAdmin();
  const { id } = await params;
  const client = await getClientById(id);

  if (!client) redirect("/admin/clients");

  const ads = await getClientAds(id);
  const sponsored = await getClientSponsored(id);

  return (
    <AdminLayout role="admin" email={user.email!} activeTab="clientes">
      <div className="mb-6">
        <Link href="/admin/clients" className="text-sm text-muted hover:text-foreground transition-colors">
          &larr; Volver a Clientes
        </Link>
      </div>

      {/* Client info card */}
      <div className="bg-white rounded-lg border border-border p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold">{client.name}</h2>
            <div className="mt-2 space-y-1 text-sm text-muted">
              {client.email && <p>Email: {client.email}</p>}
              {client.phone && <p>Teléfono: {client.phone}</p>}
              {client.notes && <p className="text-foreground/80 mt-2">{client.notes}</p>}
            </div>
          </div>
          <Link
            href={`/admin/clients/${client.id}/edit`}
            className="px-3 py-1.5 text-sm font-semibold text-[#3b82f6] hover:bg-[#3b82f6]/10 rounded transition-colors"
          >
            Editar
          </Link>
        </div>
      </div>

      {/* Client ads */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Avisos ({ads.length})</h3>
        <Link
          href={`/admin/ads/new?client_id=${client.id}`}
          className="px-4 py-2 bg-ink text-white text-sm font-bold rounded hover:bg-ink/80 transition-colors"
        >
          + Nuevo Aviso
        </Link>
      </div>

      {ads.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center border border-border">
          <p className="text-muted">Este cliente no tiene avisos.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ads.map((ad: Ad) => {
            const days = daysRemaining(ad.expires_at);
            const isExpired = ad.expires_at && new Date(ad.expires_at) < new Date();
            const isActive = ad.active && !isExpired;

            return (
              <div key={ad.id} className="bg-white rounded-lg border border-border p-4">
                <div className="flex items-start gap-4">
                  {ad.image_url ? (
                    <img src={ad.image_url} alt="" className="w-20 h-12 object-cover rounded border border-border shrink-0" />
                  ) : (
                    <div className="w-20 h-12 bg-[#f0efed] rounded border border-border flex items-center justify-center text-xs text-muted shrink-0">
                      Sin img
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold truncate">{ad.title || "Sin título"}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        isActive
                          ? "bg-[#10b981]/15 text-[#10b981]"
                          : "bg-[#e63946]/15 text-[#e63946]"
                      }`}>
                        {isActive ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <span>{typeLabels[ad.type] || ad.type}</span>
                      <span>·</span>
                      <span>{ad.section ? sectionConfig[ad.section as keyof typeof sectionConfig]?.label : "Todas"}</span>
                      <span>·</span>
                      <span>
                        {formatDate(ad.starts_at)} → {formatDate(ad.expires_at)}
                      </span>
                      {days !== null && (
                        <>
                          <span>·</span>
                          <span className={days <= 3 ? "text-[#e63946] font-bold" : ""}>
                            {days === 0 ? "Vencido" : `${days} días restantes`}
                          </span>
                        </>
                      )}
                    </div>
                    {ad.link_url && (
                      <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#3b82f6] hover:underline truncate block mt-1">
                        {ad.link_url}
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/admin/ads/${ad.id}/edit`}
                      className="px-3 py-1.5 text-xs font-semibold text-[#3b82f6] hover:bg-[#3b82f6]/10 rounded transition-colors"
                    >
                      Editar
                    </Link>
                    <ToggleAdActiveButton adId={ad.id} currentActive={ad.active} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Client sponsored content */}
      <div className="flex items-center justify-between mb-4 mt-8">
        <h3 className="text-lg font-bold">Contenido Patrocinado ({sponsored.length})</h3>
        <Link
          href={`/admin/sponsored/new?client_id=${client.id}`}
          className="px-4 py-2 bg-ink text-white text-sm font-bold rounded hover:bg-ink/80 transition-colors"
        >
          + Nuevo Contenido
        </Link>
      </div>

      {sponsored.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center border border-border">
          <p className="text-muted">Este cliente no tiene contenido patrocinado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sponsored.map((item: SponsoredContent) => {
            const days = daysRemaining(item.expiresAt);
            const isExpired = item.expiresAt && new Date(item.expiresAt) < new Date();
            const isActive = item.active && !isExpired;
            const cfg = sectionConfig[item.section as keyof typeof sectionConfig];

            return (
              <div key={item.id} className="bg-white rounded-lg border border-border p-4">
                <div className="flex items-start gap-4">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="w-20 h-12 object-cover rounded border border-border shrink-0" />
                  ) : (
                    <div className="w-20 h-12 bg-[#f0efed] rounded border border-border flex items-center justify-center text-xs text-muted shrink-0">
                      Sin img
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold truncate">{item.title}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        isActive ? "bg-[#10b981]/15 text-[#10b981]" : "bg-[#e63946]/15 text-[#e63946]"
                      }`}>
                        {isActive ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 bg-[#10b981]/15 text-[#10b981]">
                        Patrocinado
                      </span>
                      <span>·</span>
                      <span>{cfg?.label ?? item.section}</span>
                      <span>·</span>
                      <span>
                        {formatDate(item.startsAt)} → {formatDate(item.expiresAt)}
                      </span>
                      {days !== null && (
                        <>
                          <span>·</span>
                          <span className={days <= 3 ? "text-[#e63946] font-bold" : ""}>
                            {days === 0 ? "Vencido" : `${days} días restantes`}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/admin/sponsored/${item.id}/edit`}
                      className="px-3 py-1.5 text-xs font-semibold text-[#3b82f6] hover:bg-[#3b82f6]/10 rounded transition-colors"
                    >
                      Editar
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}

function ToggleAdActiveButton({ adId, currentActive }: { adId: string; currentActive: boolean }) {
  // This is rendered server-side, but we need client interactivity
  // Using a simple form that posts to a server action
  return (
    <form action={async () => { "use server"; const { createClient } = await import("@/lib/supabase/server"); const supabase = await createClient(); await supabase.from("ads").update({ active: !currentActive }).eq("id", adId); }}>
      <button
        type="submit"
        className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
          currentActive
            ? "text-[#e63946] hover:bg-[#e63946]/10"
            : "text-[#10b981] hover:bg-[#10b981]/10"
        }`}
      >
        {currentActive ? "Suspender" : "Activar"}
      </button>
    </form>
  );
}