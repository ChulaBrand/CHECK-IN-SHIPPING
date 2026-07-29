import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { RecordEditForm } from "@/components/RecordEditForm";

const ERROR_MESSAGES: Record<string, string> = {
  validation: "Revisa los datos del formulario antes de cerrar el registro.",
  incomplete:
    "Captura hora de entrada, forklift, dock y # de tarimas antes de completar el check-in.",
};

export default async function RecordDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireStaff();

  const { id } = await params;
  const checkInId = Number(id);
  if (!Number.isInteger(checkInId)) {
    notFound();
  }

  const checkIn = await prisma.checkIn.findUnique({
    where: { id: checkInId },
  });
  if (!checkIn) {
    notFound();
  }

  const { error } = await searchParams;
  const errorMessage =
    typeof error === "string" ? ERROR_MESSAGES[error] : undefined;

  return (
    <div className="space-y-6">
      <Link
        href="/staff/dashboard"
        className="text-sm text-neutral-500 hover:text-neutral-800"
      >
        ← Volver al listado
      </Link>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          {errorMessage}
        </div>
      )}

      <RecordEditForm checkIn={checkIn} />
    </div>
  );
}
