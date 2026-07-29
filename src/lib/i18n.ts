// Textos de la interfaz en los dos idiomas -- edita aquí para cambiar
// cualquier texto fijo (botones, pantalla de bienvenida, pantalla de éxito,
// avisos). Los títulos de cada pregunta viven en wizardSteps.ts.

export type Locale = "en" | "es";

export type LocalizedText = Record<Locale, string>;

export const LANGUAGES: { code: Locale; flag: string; label: string }[] = [
  { code: "en", flag: "🇺🇸", label: "English" },
  { code: "es", flag: "🇲🇽", label: "Español" },
];

export const ui = {
  start: { en: "Start", es: "Comenzar" },
  previous: { en: "Previous", es: "Anterior" },
  next: { en: "Next", es: "Siguiente" },
  submit: { en: "Submit", es: "Enviar" },
  sending: { en: "Sending…", es: "Enviando…" },
  selectPlaceholder: { en: "Select…", es: "Selecciona…" },
  firstNamePlaceholder: { en: "First Name", es: "Nombre" },
  lastNamePlaceholder: { en: "Last Name", es: "Apellido" },
  welcomeTitle: { en: "Welcome to Chula Brand", es: "Bienvenido a Chula Brand" },
  welcomeSubtitle: {
    en: "Please fill out and submit this form.",
    es: "Por favor llena y envía este formulario.",
  },
  successTitle: { en: "Check-In Recorded", es: "Check-In Registrado" },
  successSubtitle: {
    en: "Wait for instructions from warehouse staff.",
    es: "Espera indicaciones del personal de la bodega.",
  },
  successAutoReturn: {
    en: "Returning to the start…",
    es: "Regresando al inicio…",
  },
  registerAnother: {
    en: "Register Another Check-In",
    es: "Registrar Otro Check-In",
  },
  notConnected: {
    en: "The form isn't connected yet (missing Apps Script URL).",
    es: "El formulario todavía no está conectado (falta configurar la URL del Apps Script).",
  },
  failedToSend: {
    en: "Couldn't send. Check your connection and try again.",
    es: "No se pudo enviar. Revisa tu conexión e intenta de nuevo.",
  },
} satisfies Record<string, LocalizedText>;
