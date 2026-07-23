import { requireEditor } from "@/lib/supabase/server";
import AdminSiteLayout from "@/components/admin/AdminSiteLayout";
import AgendaEventForm from "@/components/admin/AgendaEventForm";
import { getEventByIdAdmin } from "@/lib/agenda";
import { notFound } from "next/navigation";

export default async function EditAgendaEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user, profile } = await requireEditor();
  const { id } = await params;

  const event = await getEventByIdAdmin(id);
  if (!event) notFound();

  // Solo eventos manuales se pueden editar desde este form
  if (event.sourceName !== "manual") {
    return (
      <AdminSiteLayout role={profile.role} email={user.email!}>
        <div className="bg-paper rounded-lg p-12 text-center border border-border">
          <p className="text-muted">
            Este evento proviene de <strong>{event.sourceName}</strong> y no es
            editable desde el admin. Los eventos scrapeados se gestionan
            automáticamente. Para modificarlo, ocultalo o eliminálo desde el
            dashboard.
          </p>
        </div>
      </AdminSiteLayout>
    );
  }

  return (
    <AdminSiteLayout role={profile.role} email={user.email!}>
      <div className="mb-6">
        <h1 className="text-2xl font-[family-name:var(--font-heading)] text-ink">
          Editar evento
        </h1>
        <p className="text-sm text-muted mt-1 line-clamp-1">{event.title}</p>
      </div>
      <AgendaEventForm event={event} />
    </AdminSiteLayout>
  );
}