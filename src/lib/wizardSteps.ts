import type { z } from "zod";
import {
  LOADING_TYPES,
  PRODUCE_TYPES,
  LOAD_ACCOMMODATION_OPTIONS,
} from "@/lib/options";
import { fieldSchemas } from "@/lib/validation";

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
  produceType: string;
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
  produceType: "",
  produceTypeOther: "",
};

export type FieldKind = "name-split" | "text" | "tel" | "radio" | "select" | "checkbox-group";

export type StepConfig = {
  id: string;
  title: string;
  subtitle?: string;
  kind: FieldKind;
  options?: readonly string[];
  // Para "text" | "tel" | "radio" | "select": qué campo de Answers edita
  // esta pantalla. "name-split" y "checkbox-group" se manejan aparte.
  answerKey?: Exclude<keyof Answers, "loadAccommodation">;
  // Devuelve un mensaje de error, o undefined si la respuesta es válida.
  validate: (answers: Answers) => string | undefined;
};

const firstOrLastNameError = (answers: Answers) => {
  const first = fieldSchemas.firstName.safeParse(answers.firstName);
  if (!first.success) return first.error.issues[0]?.message;
  const last = fieldSchemas.lastName.safeParse(answers.lastName);
  if (!last.success) return last.error.issues[0]?.message;
  return undefined;
};

const fieldError =
  <K extends keyof Answers>(key: K, schema: z.ZodType<Answers[K]>) =>
  (answers: Answers) => {
    const result = schema.safeParse(answers[key]);
    return result.success ? undefined : result.error.issues[0]?.message;
  };

// Pantallas comunes a todos: se muestran siempre, en este orden, antes de
// que el flujo se divida según la respuesta de "loadingType".
export const COMMON_STEPS: StepConfig[] = [
  {
    id: "name",
    title: "First and Last Name",
    kind: "name-split",
    validate: firstOrLastNameError,
  },
  {
    id: "phone",
    title: "Phone Number",
    subtitle: "Número de teléfono",
    kind: "tel",
    answerKey: "phoneNumber",
    validate: fieldError("phoneNumber", fieldSchemas.phoneNumber),
  },
  {
    id: "truck",
    title: "Truck Name / Company Name",
    subtitle: "Nombre de la compañía",
    kind: "text",
    answerKey: "truckOrCompanyName",
    validate: fieldError("truckOrCompanyName", fieldSchemas.truckOrCompanyName),
  },
  {
    id: "loadingType",
    title: "Loading or Unloading?",
    subtitle: "¿Viene a cargar o a descargar?",
    kind: "radio",
    options: LOADING_TYPES,
    answerKey: "loadingType",
    validate: fieldError("loadingType", fieldSchemas.loadingType),
  },
];

// Rama cuando responden "Loading / Cargar".
export const LOADING_BRANCH_STEPS: StepConfig[] = [
  {
    id: "trailerPlates",
    title: "Trailer Plates",
    subtitle: "Placas del remolque",
    kind: "text",
    answerKey: "trailerPlates",
    validate: fieldError("trailerPlates", fieldSchemas.trailerPlates),
  },
  {
    id: "driversLicense",
    title: "Driver's License",
    subtitle: "Licencia de conducir",
    kind: "text",
    answerKey: "driversLicense",
    validate: fieldError("driversLicense", fieldSchemas.driversLicense),
  },
  {
    id: "spNumberOrder2",
    title: "SP # / Order #",
    kind: "text",
    answerKey: "spNumberOrder2",
    validate: fieldError("spNumberOrder2", fieldSchemas.spNumberOrder2),
  },
  {
    id: "loadAccommodation",
    title: "Load Accomodation / Acomodo de la Carga",
    kind: "checkbox-group",
    options: LOAD_ACCOMMODATION_OPTIONS,
    validate: fieldError("loadAccommodation", fieldSchemas.loadAccommodation),
  },
];

// Rama cuando responden "Unloading / Descargar".
export const UNLOADING_BRANCH_STEPS: StepConfig[] = [
  {
    id: "unitNumber",
    title: "# de Económico o # de Caja",
    kind: "text",
    answerKey: "unitNumber",
    validate: fieldError("unitNumber", fieldSchemas.unitNumber),
  },
  {
    id: "produceType",
    title: "Que viene a descargar",
    kind: "select",
    options: PRODUCE_TYPES,
    answerKey: "produceType",
    validate: fieldError("produceType", fieldSchemas.produceType),
  },
];

// Pantalla extra que solo aparece si eligieron "Otro" en produceType.
export const PRODUCE_OTHER_STEP: StepConfig = {
  id: "produceTypeOther",
  title: "Especifica el producto",
  kind: "text",
  answerKey: "produceTypeOther",
  validate: fieldError("produceTypeOther", fieldSchemas.produceTypeOther),
};

// Calcula la secuencia de pantallas activa según lo que se ha respondido
// hasta ahora. Antes de responder "loadingType" se asume la rama de carga
// por default (no importa, todavía no se ha llegado ahí).
export function getActiveSteps(answers: Answers): StepConfig[] {
  const steps = [...COMMON_STEPS];
  if (answers.loadingType === "Unloading / Descargar") {
    steps.push(...UNLOADING_BRANCH_STEPS);
    if (answers.produceType === "Otro") {
      steps.push(PRODUCE_OTHER_STEP);
    }
  } else {
    steps.push(...LOADING_BRANCH_STEPS);
  }
  return steps;
}
