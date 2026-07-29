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

// Campos que llena el chofer al hacer check-in (formulario público). Es el
// único formulario de la app -- el personal de la bodega completa el resto
// directo en la hoja de Google Sheets.
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
