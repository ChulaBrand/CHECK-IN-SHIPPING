import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { STAFF_COOKIE_NAME } from "@/lib/session-constants";

// Chequeo optimista: solo mira si la cookie de sesión existe, para mandar
// de regreso al login lo antes posible. La verificación real (que la cookie
// sea válida y no esté vencida/alterada) pasa en requireStaff() dentro de
// cada página/acción del personal -- ver la nota en src/lib/auth.ts.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/staff") && pathname !== "/staff/login") {
    if (!request.cookies.has(STAFF_COOKIE_NAME)) {
      return NextResponse.redirect(new URL("/staff/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/staff/:path*"],
};
