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
  "Papaya",
  "Limas",
  "Piñas",
  "Tomates",
  "Pepinos",
  "Aguacates",
  "Aloe Vera",
  "Carton",
  "Material de reempaque",
  "Otro", // Debe ir al final: al marcarlo aparece un campo de texto libre.
] as const;

export const LOAD_ACCOMMODATION_OPTIONS = [
  "Single Double / Sencilla Doble",
  "Square / En Cuadro",
  "Sideways / Atravezadas",
  "Straight / Derechas",
  "California Load / Carga California",
  "Single Double Single Double/ Sencilla Doble Sencilla Doble",
  "NA",
] as const;
