import Header from "@/components/Header";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Loading() {
  return (
    <>
      <Header />
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb skeleton */}
        <div className="animate-pulse h-3 w-40 rounded bg-muted/20 mb-4" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 animate-pulse space-y-4">
            <div className="h-3 w-16 rounded bg-muted/30" />
            <div className="h-10 w-full rounded bg-muted/20" />
            <div className="h-10 w-3/4 rounded bg-muted/20" />
            <div className="h-4 w-40 rounded bg-muted/15" />
            <div className="h-64 rounded bg-muted/10" />
            <div className="h-4 w-full rounded bg-muted/15" />
            <div className="h-4 w-5/6 rounded bg-muted/15" />
            <div className="h-4 w-4/5 rounded bg-muted/15" />
          </div>
          <div className="animate-pulse space-y-3">
            <div className="h-3 w-32 rounded bg-muted/30" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="py-3 border-b border-rule">
                <div className="h-3 w-full rounded bg-muted/20" />
                <div className="h-2 w-20 mt-1 rounded bg-muted/15" />
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}