import Header from "@/components/Header";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminShell from "./AdminShell";

interface AdminSiteLayoutProps {
  role: string;
  email: string;
  children: React.ReactNode;
}

export default function AdminSiteLayout({ role, email, children }: AdminSiteLayoutProps) {
  return (
    <>
      <Header />
      <Navbar />
      <AdminShell role={role} email={email}>
        <main className="max-w-7xl mx-auto px-4 py-6 min-h-[60vh]">
          {children}
        </main>
      </AdminShell>
      <Footer />
    </>
  );
}