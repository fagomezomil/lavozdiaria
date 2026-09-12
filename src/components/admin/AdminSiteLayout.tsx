import Header from "@/components/Header";
import NavbarWrapper from "@/components/NavbarWrapper";
import Footer from "@/components/Footer";
import AdminShell from "./AdminShell";
import { getPendingCounts } from "@/lib/admin-counts";

interface AdminSiteLayoutProps {
  role: string;
  email: string;
  children: React.ReactNode;
}

export default async function AdminSiteLayout({ role, email, children }: AdminSiteLayoutProps) {
  // Counts para badges de la nav (solo se muestran a admins en AdminShell)
  const counts = await getPendingCounts();

  return (
    <>
      <Header />
      <NavbarWrapper />
      <AdminShell role={role} email={email} counts={counts}>
        <main className="max-w-7xl mx-auto px-4 py-6 min-h-[60vh]">
          {children}
        </main>
      </AdminShell>
      <Footer />
    </>
  );
}