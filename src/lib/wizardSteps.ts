import {
  LOADING_TYPES,
  PRODUCE_TYPES,
  LOAD_ACCOMMODATION_OPTIONS,
} from "@/lib/options";
import { buildFieldSchemas } from "@/lib/validation";
import type { Locale, LocalizedText } from "@/lib/i18n";

type ArrayAnswerKey = "loadAccommodation" | "produceTypes";

export type Answers = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  truckOrCompanyName: string;
  loadingType: string;
  trailerPlates: string;
  driversLicense: string;
  spNumberOrder2: string;
  loadAccommodation: string[];
  unitNumber: string;
  produceTypes: string[];
  produceTypeOther: string;
};

export const emptyAnswers: Answers = {
  firstName: "",
  lastName: "",
  phoneNumber: "",
  truckOrCompanyName: "",
  loadingType: "",
  trailerPlates: "",
  driversLicense: "",
  spNumberOrder2: "",
  loadAccommodation: [],
  unitNumber: "",
  produceTypes: [],
  produceTypeOther: "",
};

export type FieldKind = "name-split" | "text" | "tel" | "radio" | "select" | "checkbox-group";

export type StepConfig = {
  id: string;
  title: LocalizedText;
  subtitle?: LocalizedText;
  kind: FieldKind;
  options?: readonly string[];
  // Para "text" | "tel" | "radio" | "select": qué campo de Answers edita
  // esta pantalla. "name-split" se maneja aparte.
  answerKey?: Exclude<keyof Answers, ArrayAnswerKey>;
  // Para "checkbox-group": a cuál de los campos de arreglo apunta.
  checkboxKey?: ArrayAnswerKey;
  // Devuelve un mensaje de error (en el idioma dado), o undefined si la
  // respuesta es válida.
  validate: (answers: Answers, locale: Locale) => string | undefined;
};

const firstOrLastNameError = (answers: Answers, locale: Locale) => {
  const schemas = buildFieldSchemas(locale);
  const first = schemas.firstName.safeParse(answers.firstName);
  if (!first.success) return first.error.issues[0]?.message;
  const last = schemas.lastName.safeParse(answers.lastName);
  if (!last.success) return last.error.issues[0]?.message;
  return undefined;
};

const fieldError =
  <K extends keyof Answers>(key: K) =>
  (answers: Answers, locale: Locale) => {
    const schemas = buildFieldSchemas(locale);
    const result = schemas[key].safeParse(answers[key]);
    return result.success ? undefined : result.error.issues[0]?.message;
  };

// Pantallas comunes a todos: se muestran siempre, en este orden, antes de
// que el flujo se divida según la respuesta de "loadingType".
export const COMMON_STEPS: StepConfig[] = [
  {
    id: "name",
    title: { en: "First and Last Name", es: "Nombre y Apellido" },
    kind: "name-split",
    validate: firstOrLastNameError,
  },
  {
    id: "phone",
    title: { en: "Phone Number", es: "Número de Teléfono" },
    kind: "tel",
    answerKey: "phoneNumber",
    validate: fieldError("phoneNumber"),
  },
  {
    id: "truck",
    title: {
      en: "Truck Name / Company Name",
      es: "Nombre del Camión / Empresa",
    },
    kind: "text",
    answerKey: "truckOrCompanyName",
    validate: fieldError("truckOrCompanyName"),
  },
  {
    id: "loadingType",
    title: { en: "Loading or Unloading?", es: "¿Cargar o Descargar?" },
    kind: "radio",
    options: LOADING_TYPES,
    answerKey: "loadingType",
    validate: fieldError("loadingType"),
  },
];

// Rama cuando responden "Loading / Cargar".
export const LOADING_BRANCH_STEPS: StepConfig[] = [
  {
    id: "trailerPlates",
    title: { en: "Trailer Plates", es: "Placas del Remolque" },
    kind: "text",
    answerKey: "trailerPlates",
    validate: fieldError("trailerPlates"),
  },
  {
    id: "driversLicense",
    title: { en: "Driver's License", es: "Licencia de Conducir" },
    kind: "text",
    answerKey: "driversLicense",
    validate: fieldError("driversLicense"),
  },
  {
    id: "spNumberOrder2",
    title: { en: "SP # / Order #", es: "SP # / Order #" },
    kind: "text",
    answerKey: "spNumberOrder2",
    validate: fieldError("spNumberOrder2"),
  },
  {
    id: "loadAccommodation",
    title: {
      en: "Load Accomodation / Acomodo de la Carga",
      es: "Load Accomodation / Acomodo de la Carga",
    },
    kind: "checkbox-group",
    options: LOAD_ACCOMMODATION_OPTIONS,
    checkboxKey: "loadAccommodation",
    validate: fieldError("loadAccommodation"),
  },
];

// Rama cuando responden "Unloading / Descargar".
export const UNLOADING_BRANCH_STEPS: StepConfig[] = [
  {
    id: "unitNumber",
    title: { en: "Unit # / Box #", es: "# de Económico o # de Caja" },
    kind: "text",
    answerKey: "unitNumber",
    validate: fieldError("unitNumber"),
  },
  {
    id: "produceTypes",
    title: { en: "What Are You Unloading?", es: "Qué Viene a Descargar" },
    kind: "checkbox-group",
    options: PRODUCE_TYPES,
    checkboxKey: "produceTypes",
    validate: fieldError("produceTypes"),
  },
];

// Pantalla extra que solo aparece si eligieron "Otro" en produceTypes.
export const PRODUCE_OTHER_STEP: StepConfig = {
  id: "produceTypeOther",
  title: { en: "Specify the Product", es: "Especifica el Producto" },
  kind: "text",
  answerKey: "produceTypeOther",
  validate: fieldError("produceTypeOther"),
};

// Calcula la secuencia de pantallas activa según lo que se ha respondido
// hasta ahora. Antes de responder "loadingType" se asume la rama de carga
// por default (no importa, todavía no se ha llegado ahí).
export function getActiveSteps(answers: Answers): StepConfig[] {
  const steps = [...COMMON_STEPS];
  if (answers.loadingType === "Unloading / Descargar") {
    steps.push(...UNLOADING_BRANCH_STEPS);
    if (answers.produceTypes.includes("Otro")) {
      steps.push(PRODUCE_OTHER_STEP);
    }
  } else {
    steps.push(...LOADING_BRANCH_STEPS);
  }
  return steps;
}
