// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_FILE =
  /\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json|css|map)$/i;

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rutas públicas (no requieren cookie)
  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/logout") || // tu página de logout
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api") || // deja /api público (incluye /api/auth)
    PUBLIC_FILE.test(pathname);

  const auth = req.cookies.get("mj_auth")?.value;

  // Si ya estoy logueado y voy a /login → a /
  if (pathname.startsWith("/login") && auth) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Si la ruta es pública, continúa
  if (isPublic) return NextResponse.next();

  // Rutas privadas: si no hay cookie → /login con ?next=
  if (!auth) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
