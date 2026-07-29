import Link from "next/link";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDateTime } from "@/lib/utils";
import type { CheckIn } from "@/generated/prisma/client";

export function StaffTable({ checkIns }: { checkIns: CheckIn[] }) {
  if (checkIns.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 px-6 py-12 text-center text-neutral-500">
        No hay check-ins que coincidan con la búsqueda.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Chofer</TableHead>
            <TableHead>Camión / Empresa</TableHead>
            <TableHead>Placas</TableHead>
            <TableHead>Carga</TableHead>
            <TableHead>Producto</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {checkIns.map((checkIn) => (
            <TableRow key={checkIn.id}>
              <TableCell className="whitespace-nowrap text-neutral-500">
                {formatDateTime(checkIn.createdAt)}
              </TableCell>
              <TableCell className="font-medium text-neutral-900">
                {checkIn.driverName}
              </TableCell>
              <TableCell>{checkIn.truckOrCompanyName}</TableCell>
              <TableCell className="whitespace-nowrap">
                {checkIn.trailerPlates}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {checkIn.loadingType.startsWith("Loading")
                  ? "Cargar"
                  : "Descargar"}
              </TableCell>
              <TableCell>
                {checkIn.produceType === "Otro"
                  ? checkIn.produceTypeOther
                  : checkIn.produceType}
              </TableCell>
              <TableCell>
                <StatusBadge status={checkIn.status} />
              </TableCell>
              <TableCell className="text-right">
                <Link
                  href={`/staff/records/${checkIn.id}`}
                  className="font-medium text-neutral-900 underline-offset-4 hover:underline"
                >
                  Ver
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
