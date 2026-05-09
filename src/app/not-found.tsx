import Link from "next/link";
import Header from "@/components/Header";
import Navbar from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-6xl font-bold font-[family-name:var(--font-heading)] text-ink">
          404
        </h1>
        <p className="mt-4 text-xl text-muted font-[family-name:var(--font-heading)]">
          Página no encontrada
        </p>
        <p className="mt-2 text-sm text-muted">
          El artículo que buscás no existe o fue movido.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block px-6 py-2 bg-ink text-white rounded-sm hover:bg-ink/80 transition-colors"
        >
          Volver a la portada
        </Link>
      </main>
    </>
  );
}