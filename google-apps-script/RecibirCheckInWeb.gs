/**
 * Check-In Shipping — recibe los envíos del formulario web público y los
 * guarda como fila nueva en la hoja "Check-Ins" de tu Sheet nuevo (este es
 * exclusivo del formulario web -- NO es el sheet que usa Jotform, ese no se
 * toca). El acomodo de columnas está hecho a propósito para que se sienta
 * parecido al sheet real que ya usan los shipping clerks (Forklift, Door,
 * Pallets, Clerk, etc.), para que no batallen con algo distinto.
 *
 * Instalación:
 * 1. Crea una hoja de cálculo nueva en Google Sheets (o usa la que ya
 *    tenías separada para este formulario). Nombra la primera pestaña
 *    **exactamente** `Check-Ins`.
 * 2. Menú **Extensiones → Apps Script**.
 * 3. Borra lo que haya en `Code.gs` y pega este archivo completo.
 * 4. En el menú de funciones (arriba), elige **configurarEncabezados** y
 *    presiona ▶ **Ejecutar** una vez -- crea la fila de encabezados y dobla
 *    la primera fila. La primera vez te va a pedir autorizar permisos (es
 *    tu propio script sobre tu propia hoja, es seguro aceptar).
 *    > Si ya habías corrido una versión anterior de este archivo, vuelve a
 *    > correr `configurarEncabezados` -- los encabezados cambiaron para
 *    > parecerse más al sheet real. No borra ninguna fila de datos.
 * 5. **Implementar → Nueva implementación** → tipo "Aplicación web":
 *      - Ejecutar como: **Yo**
 *      - Quién tiene acceso: **Cualquier usuario**
 * 6. Copia la URL que termina en `/exec` y ponla como
 *    `NEXT_PUBLIC_APPS_SCRIPT_URL` en la configuración del sitio (GitHub).
 *
 * Columnas (A:L las llena el chofer al enviar el formulario; de M en
 * adelante las llena el personal directo en el Sheet, igual que ya hacen
 * en el sheet real):
 *   A Date              B Time              C Name
 *   D Lastname          E Transport Name    F Placas
 *   G Driver License    H Phone Number      I Loading / Unloading
 *   J ECO               K Product           L SP
 *   M Forklift          N Door              O Depa (checkbox)
 *   P Hora de Salida (automática al marcar Depa)
 *   Q Pallets           R Shipout           S Clerk
 *   T PM (checkbox)     U Comentarios       V Load Acomodation
 *
 * Al marcar el checkbox de la columna O (Depa), la columna P (Hora de
 * Salida) se llena sola con la hora actual -- igual que en el sheet real,
 * para que el clerk no tenga que escribirla a mano.
 */

const CHECKIN_SHEET_NAME = "Check-Ins";
const CHECKIN_COL_DEPA = 15; // O
const CHECKIN_COL_HORA_SALIDA = 16; // P
const CHECKIN_COL_PM = 20; // T
const CHECKIN_COL_LOAD_ACOMODATION = 22; // V

const CHECKIN_HEADERS = [
  "Date",
  "Time",
  "Name",
  "Lastname",
  "Transport Name",
  "Placas",
  "Driver License",
  "Phone Number",
  "Loading / Unloading",
  "ECO",
  "Product",
  "SP",
  "Forklift",
  "Door",
  "Depa",
  "Hora de Salida",
  "Pallets",
  "Shipout",
  "Clerk",
  "PM",
  "Comentarios",
  "Load Acomodation",
];

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
    const ahora = new Date();
    const zona = Session.getScriptTimeZone();

    // A:L en un solo golpe -- lo que llena el chofer.
    hoja.getRange(fila, 1, 1, 12).setValues([
      [
        ahora, // A Date
        Utilities.formatDate(ahora, zona, "hh:mm a"), // B Time
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

    // V: columna no contigua con A:L, se escribe aparte.
    if (data.loadAccommodation) {
      hoja.getRange(fila, CHECKIN_COL_LOAD_ACOMODATION).setValue(data.loadAccommodation);
    }

    // Checkboxes reales en Depa/PM para esta fila, igual que en el sheet
    // real -- así el clerk solo tiene que darles clic, no escribir nada.
    const checkboxRule = SpreadsheetApp.newDataValidation().requireCheckbox().build();
    hoja.getRange(fila, CHECKIN_COL_DEPA).setDataValidation(checkboxRule);
    hoja.getRange(fila, CHECKIN_COL_PM).setDataValidation(checkboxRule);

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

// Al marcar el checkbox de "Depa" (columna O), llena sola la hora en
// "Hora de Salida" (columna P) -- igual que en el sheet real. Es un
// trigger simple (se llama exactamente "onEdit"): funciona solo, sin
// configurar nada aparte, en cuanto este archivo está pegado.
function onEdit(e) {
  if (!e || !e.range) return;

  const hoja = e.range.getSheet();
  if (hoja.getName() !== CHECKIN_SHEET_NAME) return;
  if (e.range.getColumn() !== CHECKIN_COL_DEPA) return;
  if (e.range.getNumRows() !== 1 || e.range.getNumColumns() !== 1) return;
  if (e.range.getRow() < 2) return; // no tocar la fila de encabezados

  if (e.range.getValue() !== true) return; // solo al marcar, no al desmarcar

  const zona = Session.getScriptTimeZone();
  const horaTexto = Utilities.formatDate(new Date(), zona, "hh:mm a");
  hoja.getRange(e.range.getRow(), CHECKIN_COL_HORA_SALIDA).setValue(horaTexto);
}

// Solo para confirmar que la implementación está viva si abres la URL en el
// navegador -- el formulario real siempre manda POST, nunca GET.
function doGet(e) {
  return ContentService
    .createTextOutput("Check-In Shipping: el Apps Script está funcionando. Este endpoint solo acepta POST del formulario.")
    .setMimeType(ContentService.MimeType.TEXT);
}

// Ejecuta esta función UNA vez a mano (▶ en el editor) para crear la fila
// de encabezados. Puedes volver a correrla cuando quieras -- nunca toca
// las filas de datos que ya existan.
function configurarEncabezados() {
  const hoja = checkinGetSheet_();
  hoja.getRange(1, 1, 1, CHECKIN_HEADERS.length).setValues([CHECKIN_HEADERS]);
  hoja.setFrozenRows(1);
}

function checkinGetSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(CHECKIN_SHEET_NAME);
  if (!sheet) {
    throw new Error(
      'No se encontró una pestaña llamada "' + CHECKIN_SHEET_NAME + '". Revisa el nombre de la pestaña en tu Sheet.'
    );
  }
  return sheet;
}

function checkinJsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
