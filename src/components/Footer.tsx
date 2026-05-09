import Link from "next/link";
import { sectionConfig } from "@/lib/data";

export default function Footer() {
  return (
    <footer className="mt-16 bg-ink text-white/70">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h2 className="text-2xl font-bold text-white font-[family-name:var(--font-heading)]">
              La<span className="text-[#c8102e]">Voz</span>Diaria
            </h2>
            <p className="mt-1 text-xs tracking-[0.3em] uppercase text-white/50">
              Noticias · Análisis · Verdad
            </p>
            <p className="mt-4 text-sm leading-relaxed">
              Comprometidos con la información veraz, el análisis profundo y
              la verdad como principio irrenunciable.
            </p>
          </div>

          {/* Sections */}
          <div>
            <h3 className="text-xs tracking-widest uppercase text-white/50 mb-4">
              Secciones
            </h3>
            <ul className="space-y-2">
              {Object.entries(sectionConfig).map(([key, cfg]) => (
                <li key={key}>
                  <Link
                    href={cfg.path}
                    className="text-sm hover:text-white transition-colors"
                    style={{ color: cfg.color }}
                  >
                    {cfg.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs tracking-widest uppercase text-white/50 mb-4">
              Contacto
            </h3>
            <ul className="space-y-2 text-sm">
              <li>redaccion@lavozdiaria.com</li>
              <li>+54 11 5555-0000</li>
              <li>Av. Corrientes 1234, CABA</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs text-white/40">
          © {new Date().getFullYear()} La<span className="text-[#c8102e]">Voz</span>Diaria. Todos los derechos
          reservados.
          <Link href="/admin/login" className="ml-4 hover:text-white/60 transition-colors">Administradores</Link>
        </div>
      </div>
    </footer>
  );
}