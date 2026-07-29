/**
 * Check-In Shipping — recibe los envíos del formulario público y los guarda
 * como una fila nueva en la hoja "Check-Ins". El personal de la bodega
 * completa el resto de las columnas (dock, forklift, tarimas, hora de
 * salida) directo en el Sheet.
 *
 * Instalación (ver también el README del repo):
 * 1. Abre tu Google Sheet → menú Extensiones → Apps Script.
 * 2. Borra lo que haya en Code.gs y pega este archivo completo.
 * 3. En el editor, selecciona la función "setupHeaders" en el menú
 *    desplegable de arriba y presiona ▶ Ejecutar una vez -- esto crea la
 *    fila de encabezados con los nombres correctos.
 * 4. Implementar → Nueva implementación → tipo "Aplicación web":
 *      - Ejecutar como: Yo
 *      - Quién tiene acceso: Cualquier usuario
 * 5. Copia la URL que termina en /exec y ponla como
 *    NEXT_PUBLIC_APPS_SCRIPT_URL en la configuración del sitio (Netlify).
 */

const SHEET_NAME = "Check-Ins";

// Solo los campos comunes a las dos ramas (Cargar / Descargar) -- los demás
// campos son exclusivos de una rama u otra, así que exigirlos aquí rechazaría
// siempre la mitad de los envíos.
const REQUIRED_FIELDS = [
  "driverName",
  "truckOrCompanyName",
  "phoneNumber",
  "loadingType",
];

const HEADERS = [
  "Fecha y Hora",
  "Nombre y Apellido",
  "Camión / Empresa",
  "Placas del Remolque",
  "Licencia de Conducir",
  "Teléfono",
  "Cargar o Descargar",
  "# Económico o # de Caja",
  "Qué viene a Descargar",
  "Producto (si es Otro)",
  "Acomodo de la Carga",
  "SP # / Order #",
  "Hora de Entrada",
  "Forklift Asignado",
  "Dock Asignado",
  "# de Tarimas",
  "Hora de Salida",
  "Estado",
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    const missing = REQUIRED_FIELDS.filter(function (field) {
      return !data[field];
    });
    if (missing.length > 0) {
      return jsonResponse({ ok: false, error: "Faltan campos: " + missing.join(", ") });
    }

    getSheet().appendRow([
      new Date(), // Fecha y Hora
      data.driverName,
      data.truckOrCompanyName,
      data.trailerPlates,
      data.driversLicense,
      data.phoneNumber,
      data.loadingType,
      data.unitNumber,
      data.produceTypes || "",
      data.produceTypeOther || "",
      data.loadAccommodation || "",
      data.spNumberOrder2 || "",
      "", // Hora de Entrada -- la llena el personal
      "", // Forklift Asignado -- la llena el personal
      "", // Dock Asignado -- la llena el personal
      "", // # de Tarimas -- la llena el personal
      "", // Hora de Salida -- la llena el personal
      "Abierto",
    ]);

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

// Solo para confirmar que la implementación está viva si abres la URL en el
// navegador -- el formulario real siempre manda POST, nunca GET.
function doGet(e) {
  return ContentService
    .createTextOutput("Check-In Shipping: el Apps Script está funcionando. Este endpoint solo acepta POST del formulario.")
    .setMimeType(ContentService.MimeType.TEXT);
}

// Ejecuta esta función UNA vez a mano (▶ en el editor) para crear la fila de
// encabezados con los nombres correctos.
function setupHeaders() {
  const sheet = getSheet();
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.setFrozenRows(1);
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    throw new Error(
      'No se encontró una pestaña llamada "' + SHEET_NAME + '". Revisa el nombre de la pestaña en tu Sheet.'
    );
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
