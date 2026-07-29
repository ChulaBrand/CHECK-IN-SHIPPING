"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkInUpdateSchema, type CheckInUpdateInput } from "@/lib/validation";
import { serializeMultiSelect, formText } from "@/lib/utils";
import { CHECKIN_STATUS } from "@/lib/options";

export type UpdateRecordState =
  | { errors: Record<string, string[] | undefined> }
  | { success: true }
  | undefined;

function parseUpdatePayload(formData: FormData) {
  return checkInUpdateSchema.safeParse({
    driverName: formText(formData, "driverName"),
    truckOrCompanyName: formText(formData, "truckOrCompanyName"),
    trailerPlates: formText(formData, "trailerPlates"),
    driversLicense: formText(formData, "driversLicense"),
    phoneNumber: formText(formData, "phoneNumber"),
    loadingType: formText(formData, "loadingType"),
    unitNumber: formText(formData, "unitNumber"),
    produceType: formText(formData, "produceType"),
    produceTypeOther: formText(formData, "produceTypeOther"),
    loadAccommodation: formData.getAll("loadAccommodation").map(String),
    spNumberOrder: formText(formData, "spNumberOrder"),
    spNumberOrder2: formText(formData, "spNumberOrder2"),
    entryTime: formText(formData, "entryTime"),
    forkliftAssigned: formText(formData, "forkliftAssigned"),
    dockAssigned: formText(formData, "dockAssigned"),
    palletCount: formText(formData, "palletCount"),
  });
}

function toUpdateData(data: CheckInUpdateInput) {
  return {
    driverName: data.driverName,
    truckOrCompanyName: data.truckOrCompanyName,
    trailerPlates: data.trailerPlates,
    driversLicense: data.driversLicense,
    phoneNumber: data.phoneNumber,
    loadingType: data.loadingType,
    unitNumber: data.unitNumber,
    produceType: data.produceType,
    produceTypeOther: data.produceTypeOther ?? null,
    loadAccommodation: serializeMultiSelect(data.loadAccommodation),
    spNumberOrder: data.spNumberOrder ?? null,
    spNumberOrder2: data.spNumberOrder2 ?? null,
    entryTime: data.entryTime ?? null,
    forkliftAssigned: data.forkliftAssigned ?? null,
    dockAssigned: data.dockAssigned ?? null,
    palletCount: data.palletCount ?? null,
  };
}

export async function updateRecord(
  id: number,
  _prevState: UpdateRecordState,
  formData: FormData
): Promise<UpdateRecordState> {
  await requireStaff();

  const parsed = parseUpdatePayload(formData);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await prisma.checkIn.update({
    where: { id },
    data: toUpdateData(parsed.data),
  });

  revalidatePath(`/staff/records/${id}`);
  revalidatePath("/staff/dashboard");
  return { success: true };
}

// "Completar Check-In" guarda todos los cambios del formulario (igual que
// Guardar) y además cierra el registro -- exige que ya se haya capturado
// hora de entrada, forklift, dock y # de tarimas antes de dejar salir al
// camión.
export async function completeCheckIn(id: number, formData: FormData) {
  await requireStaff();

  const parsed = parseUpdatePayload(formData);
  if (!parsed.success) {
    redirect(`/staff/records/${id}?error=validation`);
  }

  const data = parsed.data;
  const isReadyToClose =
    !!data.entryTime &&
    !!data.forkliftAssigned &&
    !!data.dockAssigned &&
    data.palletCount !== undefined;

  if (!isReadyToClose) {
    redirect(`/staff/records/${id}?error=incomplete`);
  }

  await prisma.checkIn.update({
    where: { id },
    data: {
      ...toUpdateData(data),
      checkOutTime: new Date(),
      status: CHECKIN_STATUS.CHECKED_OUT,
    },
  });

  revalidatePath(`/staff/records/${id}`);
  revalidatePath("/staff/dashboard");
  redirect("/staff/dashboard?completed=true");
}
