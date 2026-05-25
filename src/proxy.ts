import { updateSession } from "@/lib/supabase/middleware";
import { rateLimit, rateLimitComment } from "@/lib/rate-limit";
import { type NextRequest, NextResponse } from "next/server";

const AUTH_ROUTES = ["/login", "/register", "/recuperar-password", "/actualizar-password"];

// Known bot user-agent patterns (scraping tools, not legitimate crawlers)
const BOT_PATTERNS = [
  /scrapy/i,
  /python-requests/i,
  /python-urllib/i,
  /httpclient/i,
  /go-http-client/i,
  /node-fetch/i,
  /got\/\d/i,
  /wget/i,
  /headlesschrome/i,
  /phantomjs/i,
  /selenium/i,
  /puppeteer/i,
  /playwright/i,
];

export async function proxy(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") || "";
  const pathname = request.nextUrl.pathname;

  // Block known scraping bots from content pages
  if (BOT_PATTERNS.some((p) => p.test(userAgent))) {
    const isContent = pathname === "/" ||
      /^\/(politica|deportes|economia|internacionales|tucuman)(\/|$)/.test(pathname);
    if (isContent) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  // Rate limit auth endpoints (10 req/min per IP)
  if (AUTH_ROUTES.some((route) => pathname === route)) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? request.headers.get("x-real-ip")
      ?? "unknown";

    if (!rateLimit(ip)) {
      return new NextResponse("Demasiados intentos. Intentá de nuevo en un minuto.", {
        status: 429,
        headers: { "Retry-After": "60" },
      });
    }
  }

  // Rate limit comment submissions (30 req/min per IP)
  if (pathname === "/api/comments") {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? request.headers.get("x-real-ip")
      ?? "unknown";

    if (!rateLimitComment(ip)) {
      return new NextResponse("Demasiados comentarios. Esperá un momento.", {
        status: 429,
        headers: { "Retry-After": "60" },
      });
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/login",
    "/register",
    "/recuperar-password",
    "/actualizar-password",
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};