import { z } from "zod";
import {
  LOADING_TYPES,
  PRODUCE_TYPES,
  LOAD_ACCOMMODATION_OPTIONS,
} from "@/lib/options";
import type { Locale } from "@/lib/i18n";

const tr = (locale: Locale, en: string, es: string) =>
  locale === "en" ? en : es;

const requiredText = (locale: Locale, en: string, es: string) => {
  const message = tr(locale, en, es);
  return z.string({ error: message }).trim().min(1, { error: message });
};

// Construye los esquemas Zod en el idioma dado -- se llama de nuevo cada vez
// que cambia el idioma seleccionado, para que los mensajes de error salgan
// traducidos.
export function buildFieldSchemas(locale: Locale) {
  // Exactamente 10 dígitos (ignora espacios/guiones al contar) -- ni menos ni
  // más.
  const phoneNumberSchema = requiredText(
    locale,
    "Phone is required.",
    "Teléfono es requerido."
  ).refine((value) => /^\d{10}$/.test(value.replace(/\D/g, "")), {
    error: tr(
      locale,
      "Phone number must be exactly 10 digits.",
      "El teléfono debe tener exactamente 10 dígitos."
    ),
  });

  // Uno o más números de 6 dígitos, sin letras, que se pueden separar con
  // espacio, /, - o _ (ej. "123456", "123456/234567").
  const orderNumberSchema = requiredText(
    locale,
    "SP # / Order # is required.",
    "SP # / Order # es requerido."
  ).regex(/^\d{6}(?:[\s/_-]+\d{6})*$/, {
    error: tr(
      locale,
      "Must be 6-digit numbers (no letters); separate multiple with space, / - or _.",
      "Deben ser números de 6 dígitos (sin letras); separa varios con espacio, / - o _."
    ),
  });

  // Un validador por campo -- el wizard valida un campo (o par, para el
  // nombre) a la vez, antes de dejar avanzar a la siguiente pantalla.
  return {
    firstName: requiredText(
      locale,
      "First name is required.",
      "Nombre es requerido."
    ),
    lastName: requiredText(
      locale,
      "Last name is required.",
      "Apellido es requerido."
    ),
    phoneNumber: phoneNumberSchema,
    truckOrCompanyName: requiredText(
      locale,
      "Truck / Company name is required.",
      "Camión / Empresa es requerido."
    ),
    loadingType: z.enum(LOADING_TYPES, {
      error: tr(
        locale,
        "Select whether you're loading or unloading.",
        "Selecciona si viene a cargar o descargar."
      ),
    }),
    trailerPlates: requiredText(
      locale,
      "Trailer plates are required.",
      "Placas del remolque es requerido."
    ),
    driversLicense: requiredText(
      locale,
      "Driver's license is required.",
      "Licencia de conducir es requerido."
    ),
    spNumberOrder2: orderNumberSchema,
    loadAccommodation: z.array(z.enum(LOAD_ACCOMMODATION_OPTIONS)).min(1, {
      error: tr(
        locale,
        "Select at least one option.",
        "Selecciona al menos una opción."
      ),
    }),
    unitNumber: requiredText(
      locale,
      "Unit # / Box # is required.",
      "# Económico o # de Caja es requerido."
    ),
    produceTypes: z.array(z.enum(PRODUCE_TYPES)).min(1, {
      error: tr(
        locale,
        "Select at least one option.",
        "Selecciona al menos una opción."
      ),
    }),
    produceTypeOther: requiredText(
      locale,
      "Product is required.",
      "Producto es requerido."
    ),
  };
}

export type FieldSchemas = ReturnType<typeof buildFieldSchemas>;
