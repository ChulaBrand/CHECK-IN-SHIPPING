import { z } from "zod";
import {
  LOADING_TYPES,
  PRODUCE_TYPES,
  LOAD_ACCOMMODATION_OPTIONS,
} from "@/lib/options";

const requiredText = (label: string) =>
  z
    .string({ error: `${label} es requerido.` })
    .trim()
    .min(1, { error: `${label} es requerido.` });

const optionalText = () =>
  z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined));

const optionalInt = (label: string) =>
  z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? Number(value) : undefined))
    .pipe(
      z
        .number()
        .int()
        .nonnegative({ error: `${label} debe ser 0 o mayor.` })
        .optional()
    );

const optionalDateTimeLocal = () =>
  z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? new Date(value) : undefined))
    .pipe(z.date().optional());

// Campos que llena el chofer al hacer check-in (formulario público).
export const checkInCreateSchema = z
  .object({
    driverName: requiredText("Nombre y apellido"),
    truckOrCompanyName: requiredText("Camión / Empresa"),
    trailerPlates: requiredText("Placas del remolque"),
    driversLicense: requiredText("Licencia de conducir"),
    phoneNumber: requiredText("Teléfono"),
    loadingType: z.enum(LOADING_TYPES, {
      error: "Selecciona si viene a cargar o descargar.",
    }),
    unitNumber: requiredText("# Económico o # de Caja"),
    produceType: z.enum(PRODUCE_TYPES, {
      error: "Selecciona qué viene a descargar.",
    }),
    produceTypeOther: optionalText(),
    loadAccommodation: z.array(z.enum(LOAD_ACCOMMODATION_OPTIONS)).default([]),
    spNumberOrder: optionalText(),
    spNumberOrder2: optionalText(),
  })
  .refine((data) => data.produceType !== "Otro" || !!data.produceTypeOther, {
    error: "Especifica qué producto es.",
    path: ["produceTypeOther"],
  });

export type CheckInCreateInput = z.infer<typeof checkInCreateSchema>;

// Edición completa de un registro (pantalla de personal, botón "Guardar").
export const checkInUpdateSchema = z
  .object({
    driverName: requiredText("Nombre y apellido"),
    truckOrCompanyName: requiredText("Camión / Empresa"),
    trailerPlates: requiredText("Placas del remolque"),
    driversLicense: requiredText("Licencia de conducir"),
    phoneNumber: requiredText("Teléfono"),
    loadingType: z.enum(LOADING_TYPES),
    unitNumber: requiredText("# Económico o # de Caja"),
    produceType: z.enum(PRODUCE_TYPES),
    produceTypeOther: optionalText(),
    loadAccommodation: z.array(z.enum(LOAD_ACCOMMODATION_OPTIONS)).default([]),
    spNumberOrder: optionalText(),
    spNumberOrder2: optionalText(),
    entryTime: optionalDateTimeLocal(),
    forkliftAssigned: optionalText(),
    dockAssigned: optionalText(),
    palletCount: optionalInt("# de tarimas"),
  })
  .refine((data) => data.produceType !== "Otro" || !!data.produceTypeOther, {
    error: "Especifica qué producto es.",
    path: ["produceTypeOther"],
  });

export type CheckInUpdateInput = z.infer<typeof checkInUpdateSchema>;
