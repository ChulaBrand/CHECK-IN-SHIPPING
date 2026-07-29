import Link from "next/link";
import { CheckInForm } from "@/components/CheckInForm";

export default async function CheckInPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { submitted } = await searchParams;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
            Check-In de Embarque
          </h1>
          <p className="mt-1 text-neutral-600">
            Registra tu llegada para cargar o descargar.
          </p>
        </div>
        <Link
          href="/staff/dashboard"
          className="shrink-0 text-sm font-medium text-neutral-500 underline-offset-4 hover:text-neutral-800 hover:underline"
        >
          Personal
        </Link>
      </header>

      {submitted === "true" && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
          Check-in registrado correctamente. Espera indicaciones del
          personal de la bodega.
        </div>
      )}

      <CheckInForm />
    </main>
  );
}
