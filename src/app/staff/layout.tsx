import Link from "next/link";
import { getSession } from "@/lib/auth";
import { logout } from "@/app/staff/actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// No hace requireStaff() aquí a propósito: los layouts no se vuelven a
// ejecutar en cada navegación interna, así que la verificación real vive en
// cada página (dashboard, records/[id]) -- ver la nota en src/lib/auth.ts.
// Aquí solo se decide si se muestra la barra de navegación del personal.
export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      {session.isStaff && (
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <Link
              href="/staff/dashboard"
              className="text-lg font-semibold text-neutral-900"
            >
              Check-In Shipping · Personal
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="text-sm text-neutral-500 hover:text-neutral-800"
              >
                Ir al formulario
              </Link>
              <form action={logout}>
                <button
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Cerrar sesión
                </button>
              </form>
            </div>
          </div>
        </header>
      )}
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
