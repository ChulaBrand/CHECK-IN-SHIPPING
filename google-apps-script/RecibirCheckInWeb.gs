/**
 * Check-In Shipping — recibe los envíos del formulario web público y los
 * guarda como fila nueva en la hoja "Form responses" -- la misma hoja real
 * en la que ya escribía Jotform, con el mismo acomodo de columnas que ya
 * usan tus otros scripts (registrarHoraReal, archivarOrdenesCompletadas,
 * runFormatOnNewRows_FormResponses, etc.).
 *
 * ESTE ARCHIVO SE AGREGA, NO REEMPLAZA NADA: pégalo como un archivo nuevo
 * dentro de tu proyecto de Apps Script "CheckInShipping" que ya tienes,
 * junto a ocultarFilasConSalida.gs, borrarblnks.gs, CopiarInformacion.gs y
 * CopiarFormato.gs. No toques esos archivos.
 *
 * Instalación:
 * 1. Abre tu proyecto de Apps Script "CheckInShipping" (el mismo de
 *    siempre, Extensiones → Apps Script desde tu Sheet).
 * 2. Archivos (+) → Script → nómbralo "RecibirCheckInWeb" → pega este
 *    archivo completo.
 * 3. Implementar → Nueva implementación → tipo "Aplicación web":
 *      - Ejecutar como: Yo
 *      - Quién tiene acceso: Cualquier usuario
 * 4. Copia la URL que termina en /exec y ponla como
 *    NEXT_PUBLIC_APPS_SCRIPT_URL en la configuración del sitio (GitHub).
 *
 * Acomodo real de columnas en "Form responses" (headers en fila 2, datos
 * desde fila 3) -- lo que llena el chofer va en A:L, el resto (M en
 * adelante) lo sigue llenando el personal directo en el Sheet como hasta
 * ahora:
 *   A Date            (se manda solo, la fecha del envío)
 *   B Time             (se deja en blanco a propósito -- registrarHoraReal
 *                       ya la llena sola dentro del siguiente minuto, igual
 *                       que hacía con las filas de Jotform)
 *   C Name             D Lastname          E Transport Name
 *   F Placas           G Driver License    H Phone Number
 *   I Loading/Unloading J ECO              K Product
 *   L SP
 *   M..U               -- Forklift/Door/Depa/Hr Salida/Pallets/Shipout/
 *                          Clerk/PM/Comentarios: se quedan en blanco, los
 *                          llena el personal como siempre.
 *   X Load Acomodation -- columna no contigua con A:L, se escribe aparte.
 */

const CHECKIN_SHEET_NAME = "Form responses";
const CHECKIN_COL_LOAD_ACOMODATION = 24; // X

// Solo los campos comunes a las dos ramas (Cargar / Descargar) -- los demás
// campos son exclusivos de una rama u otra, así que exigirlos aquí rechazaría
// siempre la mitad de los envíos.
const CHECKIN_REQUIRED_FIELDS = [
  "firstName",
  "lastName",
  "truckOrCompanyName",
  "phoneNumber",
  "loadingType",
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  const tieneLock = lock.tryLock(10000);
  if (!tieneLock) {
    return checkinJsonResponse_({
      ok: false,
      error: "El sistema está ocupado, intenta de nuevo.",
    });
  }

  try {
    const data = JSON.parse(e.postData.contents);

    const missing = CHECKIN_REQUIRED_FIELDS.filter(function (field) {
      return !data[field];
    });
    if (missing.length > 0) {
      return checkinJsonResponse_({
        ok: false,
        error: "Faltan campos: " + missing.join(", "),
      });
    }

    const hoja = checkinGetSheet_();
    const fila = hoja.getLastRow() + 1;

    // A:L en un solo golpe -- lo que llena el chofer.
    hoja
      .getRange(fila, 1, 1, 12)
      .setValues([
        [
          new Date(), // A Date
          "", // B Time -- la llena sola registrarHoraReal
          data.firstName, // C Name
          data.lastName, // D Lastname
          data.truckOrCompanyName, // E Transport Name
          data.trailerPlates || "", // F Placas
          data.driversLicense || "", // G Driver License
          data.phoneNumber, // H Phone Number
          data.loadingType, // I Loading/Unloading
          data.unitNumber || "", // J ECO
          checkinFormatProduct_(data), // K Product
          data.spNumberOrder2 || "", // L SP
        ],
      ]);

    // X: columna no contigua con A:L, se escribe aparte.
    if (data.loadAccommodation) {
      hoja.getRange(fila, CHECKIN_COL_LOAD_ACOMODATION).setValue(data.loadAccommodation);
    }

    return checkinJsonResponse_({ ok: true });
  } catch (err) {
    return checkinJsonResponse_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Junta produceTypes + produceTypeOther en una sola celda de texto, ej.
// "Papaya, Otro: Mangos".
function checkinFormatProduct_(data) {
  const tipos = data.produceTypes || "";
  if (tipos.indexOf("Otro") !== -1 && data.produceTypeOther) {
    return tipos.replace("Otro", "Otro: " + data.produceTypeOther);
  }
  return tipos;
}

// Solo para confirmar que la implementación está viva si abres la URL en el
// navegador -- el formulario real siempre manda POST, nunca GET.
function doGet(e) {
  return ContentService
    .createTextOutput("Check-In Shipping: el Apps Script está funcionando. Este endpoint solo acepta POST del formulario.")
    .setMimeType(ContentService.MimeType.TEXT);
}

function checkinGetSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(CHECKIN_SHEET_NAME);
  if (!sheet) {
    throw new Error(
      'No se encontró una pestaña llamada "' + CHECKIN_SHEET_NAME + '".'
    );
  }
  return sheet;
}

function checkinJsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
