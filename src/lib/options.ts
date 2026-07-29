// Edita los arreglos de abajo para agregar/quitar/renombrar opciones en
// cualquier parte de la app. Los cambios aquí se reflejan automáticamente en:
// el formulario público de check-in, la página de edición del personal, y las
// reglas de validación del servidor. Reinicia el servidor (o vuelve a
// desplegar) después de editar este archivo.

export const LOADING_TYPES = [
  "Loading / Cargar",
  "Unloading / Descargar",
] as const;

export const PRODUCE_TYPES = [
  "Aguacates",
  "Plátanos",
  "Papaya",
  "Pepinos",
  "Limas",
  "Otro", // Debe ir al final: al elegirlo aparece un campo de texto libre.
] as const;

export const LOAD_ACCOMMODATION_OPTIONS = [
  "Sideways / Atravezadas",
  "Straight / Derechas",
  "Single Double / Sencilla Doble",
  "Square / En Cuadro",
] as const;

// Dock y forklift todavía no tienen una lista fija conocida, así que hoy son
// campos de texto libre (ver CheckInForm/RecordEditForm). Para convertirlos
// en lista desplegable más adelante: descomenta un arreglo como los de
// arriba, impórtalo en RecordEditForm.tsx, y cambia el <input> por un
// <Select>.
// export const DOCKS = ["Dock 1", "Dock 2"] as const;
// export const FORKLIFTS = ["Forklift A", "Forklift B"] as const;

export const CHECKIN_STATUS = {
  OPEN: "OPEN",
  CHECKED_OUT: "CHECKED_OUT",
} as const;

export type CheckInStatus =
  (typeof CHECKIN_STATUS)[keyof typeof CHECKIN_STATUS];
