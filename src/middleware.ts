import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_FILE =
  /\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json|css|map)$/i;

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/logout") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api") ||
    PUBLIC_FILE.test(pathname);

  if (isPublic) return NextResponse.next();

  const auth = req.cookies.get("mj_auth")?.value; // <-- mismo nombre
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
