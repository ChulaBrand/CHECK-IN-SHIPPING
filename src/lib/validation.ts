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

// Exactamente 10 dígitos (ignora espacios/guiones al contar) -- ni menos ni
// más.
const phoneNumberSchema = requiredText("Teléfono").refine(
  (value) => /^\d{10}$/.test(value.replace(/\D/g, "")),
  { error: "El teléfono debe tener exactamente 10 dígitos." }
);

// Uno o más números de 6 dígitos, sin letras, que se pueden separar con
// espacio, /, - o _ (ej. "123456", "123456/234567").
const orderNumberSchema = requiredText("SP # / Order #").regex(
  /^\d{6}(?:[\s/_-]+\d{6})*$/,
  {
    error:
      "Deben ser números de 6 dígitos (sin letras); separa varios con espacio, / - o _.",
  }
);

// Un validador por campo -- el wizard valida un campo (o par, para el
// nombre) a la vez, antes de dejar avanzar a la siguiente pantalla.
export const fieldSchemas = {
  firstName: requiredText("Nombre"),
  lastName: requiredText("Apellido"),
  phoneNumber: phoneNumberSchema,
  truckOrCompanyName: requiredText("Camión / Empresa"),
  loadingType: z.enum(LOADING_TYPES, {
    error: "Selecciona si viene a cargar o descargar.",
  }),
  trailerPlates: requiredText("Placas del remolque"),
  driversLicense: requiredText("Licencia de conducir"),
  spNumberOrder2: orderNumberSchema,
  loadAccommodation: z
    .array(z.enum(LOAD_ACCOMMODATION_OPTIONS))
    .min(1, { error: "Selecciona al menos una opción." }),
  unitNumber: requiredText("# Económico o # de Caja"),
  produceTypes: z
    .array(z.enum(PRODUCE_TYPES))
    .min(1, { error: "Selecciona al menos una opción." }),
  produceTypeOther: requiredText("Producto"),
};
