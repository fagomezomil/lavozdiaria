import { requireEditor } from "@/lib/supabase/server";
import AdminSiteLayout from "@/components/admin/AdminSiteLayout";
import AgendaDashboard from "@/components/admin/AgendaDashboard";
import { getAllEventsAdmin } from "@/lib/agenda";

export default async function AdminAgendaPage() {
  const { user, profile } = await requireEditor();
  const events = await getAllEventsAdmin();

  return (
    <AdminSiteLayout role={profile.role} email={user.email!}>
      <AgendaDashboard events={events} />
    </AdminSiteLayout>
  );
}