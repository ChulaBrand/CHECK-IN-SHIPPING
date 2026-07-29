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

// Un validador por campo -- el wizard valida un campo (o par, para el
// nombre) a la vez, antes de dejar avanzar a la siguiente pantalla.
export const fieldSchemas = {
  firstName: requiredText("Nombre"),
  lastName: requiredText("Apellido"),
  phoneNumber: requiredText("Teléfono"),
  truckOrCompanyName: requiredText("Camión / Empresa"),
  loadingType: z.enum(LOADING_TYPES, {
    error: "Selecciona si viene a cargar o descargar.",
  }),
  trailerPlates: requiredText("Placas del remolque"),
  driversLicense: requiredText("Licencia de conducir"),
  spNumberOrder2: requiredText("SP # / Order #"),
  loadAccommodation: z
    .array(z.enum(LOAD_ACCOMMODATION_OPTIONS))
    .min(1, { error: "Selecciona al menos una opción." }),
  unitNumber: requiredText("# Económico o # de Caja"),
  produceType: z.enum(PRODUCE_TYPES, {
    error: "Selecciona qué viene a descargar.",
  }),
  produceTypeOther: requiredText("Producto"),
};
