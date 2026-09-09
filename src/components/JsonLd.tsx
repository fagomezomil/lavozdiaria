/** Helper para inyectar JSON-LD structured data en server components.
 *  Next.js renderiza <script type="application/ld+json"> en el HTML crudo,
 *  accesible para crawlers de Google/Bing sin necesidad de ejecutar JS.
 *  Se escapan los `<` como \u003c para evitar que un `</script>` dentro de
 *  datos del scraper (title/excerpt) cierre el tag y ejecute JS (XSS). */
export default function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}