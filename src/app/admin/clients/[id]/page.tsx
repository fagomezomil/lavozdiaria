import { requireAdmin } from "@/lib/supabase/server";
import { getClientById, getClientAds } from "@/lib/clients";
import { getClientSponsored } from "@/lib/sponsored";
import AdminSiteLayout from "@/components/admin/AdminSiteLayout";
import ToggleSponsoredActiveButton from "@/components/admin/ToggleSponsoredActiveButton";
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
    <AdminSiteLayout role="admin" email={user.email!}>
      <div className="mb-6">
        <Link href="/admin/clients" className="text-sm text-muted hover:text-foreground transition-colors">
          &larr; Volver a Clientes
        </Link>
      </div>

      {/* Client info card */}
      <div className="bg-white rounded-lg border border-border p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-bold">{client.name}</h2>
          <Link
            href={`/admin/clients/${client.id}/edit`}
            className="px-3 py-1.5 text-sm font-semibold text-[#3b82f6] hover:bg-[#3b82f6]/10 rounded transition-colors"
          >
            Editar
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
          {/* Contacto */}
          <div>
            <h3 className="text-[11px] font-bold tracking-widest uppercase text-muted mb-2">Contacto</h3>
            <dl className="space-y-1.5">
              {client.email && (
                <div className="flex gap-2">
                  <dt className="text-muted min-w-[72px]">Email</dt>
                  <dd className="text-ink break-all">{client.email}</dd>
                </div>
              )}
              {client.phone && (
                <div className="flex gap-2">
                  <dt className="text-muted min-w-[72px]">Teléfono</dt>
                  <dd className="text-ink">{client.phone}</dd>
                </div>
              )}
              {client.phone_landline && (
                <div className="flex gap-2">
                  <dt className="text-muted min-w-[72px]">Tel. fijo</dt>
                  <dd className="text-ink">{client.phone_landline}</dd>
                </div>
              )}
              {!client.email && !client.phone && !client.phone_landline && (
                <p className="text-muted italic">Sin datos de contacto</p>
              )}
            </dl>
          </div>

          {/* Facturación */}
          <div>
            <h3 className="text-[11px] font-bold tracking-widest uppercase text-muted mb-2">Facturación</h3>
            <dl className="space-y-1.5">
              {client.billing_name && (
                <div className="flex gap-2">
                  <dt className="text-muted min-w-[72px]">Razón</dt>
                  <dd className="text-ink">{client.billing_name}</dd>
                </div>
              )}
              {client.cuit && (
                <div className="flex gap-2">
                  <dt className="text-muted min-w-[72px]">CUIT</dt>
                  <dd className="text-ink">{client.cuit}</dd>
                </div>
              )}
              {client.billing_address && (
                <div className="flex gap-2">
                  <dt className="text-muted min-w-[72px]">Dirección</dt>
                  <dd className="text-ink">{client.billing_address}</dd>
                </div>
              )}
              {client.postal_code && (
                <div className="flex gap-2">
                  <dt className="text-muted min-w-[72px]">C.P.</dt>
                  <dd className="text-ink">{client.postal_code}</dd>
                </div>
              )}
              {!client.billing_name && !client.cuit && !client.billing_address && !client.postal_code && (
                <p className="text-muted italic">Sin datos de facturación</p>
              )}
            </dl>
          </div>
        </div>

        {client.notes && (
          <div className="mt-4 pt-4 border-t border-border">
            <h3 className="text-[11px] font-bold tracking-widest uppercase text-muted mb-2">Notas</h3>
            <p className="text-sm text-foreground/80 whitespace-pre-line">{client.notes}</p>
          </div>
        )}
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
                    <ToggleSponsoredActiveButton sponsoredId={item.id} currentActive={item.active} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminSiteLayout>
  );
}

function ToggleAdActiveButton({ adId, currentActive }: { adId: string; currentActive: boolean }) {
  return (
    <form action={async () => { "use server"; const { toggleAdActive } = await import("@/app/admin/ads/actions"); await toggleAdActive(adId, currentActive); }}>
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