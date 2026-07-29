"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { checkInCreateSchema } from "@/lib/validation";
import { serializeMultiSelect, formText } from "@/lib/utils";

export type CreateCheckInState =
  | {
      errors: Record<string, string[] | undefined>;
    }
  | undefined;

export async function createCheckIn(
  _prevState: CreateCheckInState,
  formData: FormData
): Promise<CreateCheckInState> {
  const parsed = checkInCreateSchema.safeParse({
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
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

  await prisma.checkIn.create({
    data: {
      driverName: data.driverName,
      truckOrCompanyName: data.truckOrCompanyName,
      trailerPlates: data.trailerPlates,
      driversLicense: data.driversLicense,
      phoneNumber: data.phoneNumber,
      loadingType: data.loadingType,
      unitNumber: data.unitNumber,
      produceType: data.produceType,
      produceTypeOther: data.produceTypeOther,
      loadAccommodation: serializeMultiSelect(data.loadAccommodation),
      spNumberOrder: data.spNumberOrder,
      spNumberOrder2: data.spNumberOrder2,
    },
  });

  revalidatePath("/staff/dashboard");
  redirect("/?submitted=true");
}
