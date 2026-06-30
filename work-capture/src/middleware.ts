import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isMobileUserAgent } from "@/lib/utils/capture-helpers";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (pathname === "/") {
    const isMobile = isMobileUserAgent(request.headers.get("user-agent"));
    return NextResponse.redirect(
      new URL(isMobile ? "/capture" : "/inbox", request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
