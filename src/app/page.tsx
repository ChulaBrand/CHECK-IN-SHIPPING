import { CheckInForm } from "@/components/CheckInForm";

export default function CheckInPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
          Check-In de Embarque
        </h1>
        <p className="mt-1 text-neutral-600">
          Registra tu llegada para cargar o descargar.
        </p>
      </header>

      <CheckInForm />
    </main>
  );
}
