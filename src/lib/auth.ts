import "server-only";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { redirect } from "next/navigation";
import { STAFF_COOKIE_NAME } from "@/lib/session-constants";

export type SessionData = {
  isStaff?: boolean;
};

const sessionOptions = {
  cookieName: STAFF_COOKIE_NAME,
  password: process.env.SESSION_SECRET ?? "",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

// Verificación real de autorización. Proxy (src/proxy.ts) solo hace una
// verificación optimista para redirigir más rápido -- las Server Functions
// son alcanzables por POST directo sin pasar por Proxy, así que cada página
// y cada acción del personal debe llamar requireStaff() por su cuenta.
export async function requireStaff() {
  const session = await getSession();
  if (!session.isStaff) {
    redirect("/staff/login");
  }
  return session;
}
