import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { StaffTable } from "@/components/StaffTable";
import { StaffTableFilters } from "@/components/StaffTableFilters";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

export default async function StaffDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireStaff();

  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const status = typeof params.status === "string" ? params.status : "";
  const page = Math.max(1, Number(params.page) || 1);
  const completed = params.completed === "true";

  const conditions: Prisma.CheckInWhereInput[] = [];
  if (status) conditions.push({ status });
  if (q) {
    conditions.push({
      OR: [
        { driverName: { contains: q } },
        { truckOrCompanyName: { contains: q } },
        { trailerPlates: { contains: q } },
      ],
    });
  }
  const where: Prisma.CheckInWhereInput =
    conditions.length > 0 ? { AND: conditions } : {};

  const [checkIns, total] = await Promise.all([
    prisma.checkIn.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.checkIn.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildPageHref = (targetPage: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (status) sp.set("status", status);
    sp.set("page", String(targetPage));
    return `/staff/dashboard?${sp.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-neutral-900">Check-ins</h1>
        <p className="text-sm text-neutral-500">
          {total} registro{total === 1 ? "" : "s"}
        </p>
      </div>

      {completed && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
          Check-in cerrado correctamente.
        </div>
      )}

      <StaffTableFilters q={q} status={status} />
      <StaffTable checkIns={checkIns} />

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          {page > 1 ? (
            <Link
              href={buildPageHref(page - 1)}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              ← Anterior
            </Link>
          ) : (
            <span
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "pointer-events-none opacity-50"
              )}
            >
              ← Anterior
            </span>
          )}
          <p className="text-sm text-neutral-500">
            Página {page} de {totalPages}
          </p>
          {page < totalPages ? (
            <Link
              href={buildPageHref(page + 1)}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Siguiente →
            </Link>
          ) : (
            <span
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "pointer-events-none opacity-50"
              )}
            >
              Siguiente →
            </span>
          )}
        </div>
      )}
    </div>
  );
}
