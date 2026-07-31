/**
 * Check-In Shipping — recibe los envíos del formulario web público y los
 * guarda como fila nueva en la hoja "Check-Ins" de tu Sheet nuevo (este es
 * exclusivo del formulario web -- NO es el sheet que usa Jotform, ese no se
 * toca). El acomodo de columnas está hecho a propósito para que se sienta
 * parecido al sheet real que ya usan los shipping clerks (Forklift, Door,
 * Pallets, Clerk, etc.), para que no batallen con algo distinto.
 *
 * Instalación (en orden):
 * 1. Crea una hoja de cálculo nueva en Google Sheets (o usa la que ya
 *    tenías separada para este formulario). Nombra la primera pestaña
 *    **exactamente** `Check-Ins`.
 * 2. Menú **Extensiones → Apps Script**.
 * 3. Borra lo que haya en `Code.gs` y pega este archivo completo.
 * 4. Del menú de funciones (arriba), corre ▶ **Ejecutar** una vez cada una
 *    de estas 4 (en cualquier orden), autorizando permisos la primera vez:
 *      - **configurarEncabezados**       -- crea la fila de encabezados.
 *      - **configurarTriggerFiltro**     -- filtra la vista a "solo hoy".
 *      - **configurarTriggerHoraSalida** -- Depa marcado -> Hora de Salida
 *        automática.
 *      - **configurarTriggerArchivado**  -- archivado semanal de órdenes
 *        completadas y viejas (ver abajo).
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
 * Automatizaciones activas:
 * - Al marcar el checkbox de la columna O (Depa), la columna P (Hora de
 *   Salida) se llena sola con la hora actual (requiere haber corrido
 *   configurarTriggerHoraSalida una vez, ver arriba).
 * - filtrarOrdenesDeHoy (cada minuto, una vez armado el trigger) oculta de
 *   la vista las órdenes que ya no son de hoy, Y las que ya están
 *   atendidas (Pallets o Shipout ya tienen algo -- cualquiera de las dos
 *   sola basta) -- exactamente el mismo criterio de "activas/inactivas"
 *   que usaba el sheet real. Es un filtro de vista: nunca borra ni mueve
 *   nada.
 * - archivarOrdenesCompletadas (semanal, lunes ~4am, una vez armado el
 *   trigger) mueve a la pestaña "Base_de_Datos" las órdenes que ya están
 *   100% completas (Forklift, Door, Pallets, Shipout, Clerk y PM llenos) Y
 *   tienen más de 2 días -- copia primero, verifica, y solo entonces borra
 *   el original. Así "Check-Ins" no crece para siempre con órdenes ya
 *   cerradas.
 * - runFormatOnNewRows_CheckIns_ corre sola después de cada envío del
 *   formulario (no hay que configurar nada): si le falta el formato o los
 *   menús desplegables/checkboxes de Forklift/Door/Pallets/Shipout a una
 *   fila nueva, se los copia de la fila 2 (tu "plantilla" -- config˙úrala a
 *   mano una vez ahí si quieres esos controles fijos).
 *
 * Este archivo NO maneja colores de fila -- si quieres pintar filas según
 * su estado, configúralo tú a mano en el menú Formato → Formato condicional
 * de Google Sheets.
 *
 * Herramientas manuales (opcionales, corrida a mano cuando tú quieras --
 * no tienen trigger automático):
 * - respaldarTodoABaseDeDatos: copia TODO lo que hay ahora mismo en
 *   "Check-Ins" a "Base_de_Datos", sin importar si está completo o no. Útil
 *   como respaldo general antes de una limpieza grande.
 * - limpiarCheckInsDejando48Horas: borra de "Check-Ins" todo lo de más de
 *   48 horas. Por seguridad, solo funciona si acabas de correr
 *   respaldarTodoABaseDeDatos con éxito (si no, te avisa y no borra nada).
 */

const CHECKIN_SHEET_NAME = "Check-Ins";
const CHECKIN_ARCHIVE_SHEET_NAME = "Base_de_Datos";
const CHECKIN_COL_FORKLIFT = 13; // M
const CHECKIN_COL_DOOR = 14; // N
const CHECKIN_COL_DEPA = 15; // O
const CHECKIN_COL_HORA_SALIDA = 16; // P
const CHECKIN_COL_PALLETS = 17; // Q
const CHECKIN_COL_SHIPOUT = 18; // R
const CHECKIN_COL_CLERK = 19; // S
const CHECKIN_COL_PM = 20; // T
const CHECKIN_COL_LOAD_ACOMODATION = 22; // V

const CHECKIN_DIAS_MINIMOS_PARA_ARCHIVAR = 2; // archivado semanal: no toca lo de los últimos 2 días
const CHECKIN_MAX_FILAS_POR_CORRIDA = 4000; // tope de seguridad por ejecución
const CHECKIN_HORAS_A_CONSERVAR = 48; // limpiarCheckInsDejando48Horas: cuánto se deja
const CHECKIN_PROP_COPIA_COMPLETA = "checkinCopiaBaseDeDatosCompleta"; // marca de seguridad entre respaldar y limpiar

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
  // Log del cuerpo crudo recibido -- para diagnosticar, esto es lo más
  // importante: si un envío no aparece en el Sheet, este log dice
  // exactamente qué mandó el navegador y por qué se aceptó o se rechazó.
  // Se ve en Apps Script → ícono de reloj (Ejecuciones) → clic en la
  // ejecución → "Registros" / "Logs".
  Logger.log("doPost recibido: " + (e && e.postData ? e.postData.contents : "(sin postData)"));

  const lock = LockService.getScriptLock();
  const tieneLock = lock.tryLock(10000);
  if (!tieneLock) {
    Logger.log("doPost: no se pudo obtener el lock, se rechazó el envío.");
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
      Logger.log("doPost: RECHAZADO, faltan campos: " + missing.join(", "));
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

    Logger.log("doPost: OK, escrito en la fila " + fila);

    // Autoformato de filas nuevas (plantilla + estirar colores). Nunca debe
    // convertir un guardado exitoso en un error reportado al navegador, así
    // que va en su propio try/catch.
    try {
      runFormatOnNewRows_CheckIns_();
    } catch (formatErr) {
      Logger.log("doPost: aviso, runFormatOnNewRows_CheckIns_ falló (el dato ya se guardó bien) -- " + String(formatErr));
    }

    return checkinJsonResponse_({ ok: true });
  } catch (err) {
    Logger.log("doPost: ERROR -- " + String(err));
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
// "Hora de Salida" (columna P) -- igual que en el sheet real. Es un trigger
// INSTALABLE (no la función reservada onEdit) para poder usar LockService y
// no chocar si dos personas marcan checkboxes casi al mismo tiempo. Requiere
// correr configurarTriggerHoraSalida() una vez para instalarlo (ver arriba).
function checkinRegistrarHoraSalida(e) {
  if (!e || !e.range) return;

  const hoja = e.range.getSheet();
  if (hoja.getName() !== CHECKIN_SHEET_NAME) return;
  if (e.range.getColumn() !== CHECKIN_COL_DEPA) return;
  if (e.range.getNumRows() !== 1 || e.range.getNumColumns() !== 1) return;
  if (e.range.getRow() < 2) return; // no tocar la fila de encabezados
  if (e.range.getValue() !== true) return; // solo al marcar, no al desmarcar

  const lock = LockService.getScriptLock();
  const tieneLock = lock.tryLock(5000);
  if (!tieneLock) return;
  try {
    const zona = Session.getScriptTimeZone();
    const horaTexto = Utilities.formatDate(new Date(), zona, "hh:mm a");
    hoja.getRange(e.range.getRow(), CHECKIN_COL_HORA_SALIDA).setValue(horaTexto);
  } finally {
    lock.releaseLock();
  }
}

// Corre esta función UNA sola vez para instalar el trigger de edición que
// activa checkinRegistrarHoraSalida cuando alguien marca el checkbox de Depa.
function configurarTriggerHoraSalida() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function (t) {
    if (t.getHandlerFunction() === "checkinRegistrarHoraSalida") {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger("checkinRegistrarHoraSalida").forSpreadsheet(ss).onEdit().create();

  Logger.log("Trigger instalado: checkinRegistrarHoraSalida se activa al marcar el checkbox de Depa.");
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

// Filtra la vista de la hoja para mostrar solo las órdenes ACTIVAS de HOY:
// - Fecha = hoy (de la madrugada 12am-5am también se incluye lo de ayer,
//   por si algo de anoche sigue sin cerrarse).
// - Oculta la orden en cuanto Clerk + Pallets + Shipout ya están los tres
//   llenos -- mismo criterio de "activas/inactivas" que usaba el sheet
//   real: mientras falte cualquiera de los tres, la orden se sigue viendo.
// Es un filtro de VISTA: no borra ni mueve nada, todo el histórico sigue
// ahí, nada más se oculta (el archivado de verdad lo hace
// archivarOrdenesCompletadas, ver abajo).
//
// Corre sola cada minuto una vez que armes el trigger (ver
// configurarTriggerFiltro más abajo, se corre UNA vez) -- mismo intervalo
// que usaba el sheet real. También la puedes correr a mano cuando quieras
// desde el menú de funciones de arriba.
function filtrarOrdenesDeHoy() {
  const hoja = checkinGetSheet_();

  if (hoja.getFilter()) {
    hoja.getFilter().remove();
  }

  const ultimaFila = hoja.getLastRow();
  const ultimaColumna = hoja.getLastColumn();
  if (ultimaFila < 2) return; // solo encabezados, no hay nada que filtrar

  // El rango del filtro incluye la fila de encabezados (1) hasta la
  // última fila con datos.
  const rangoFiltro = hoja.getRange(1, 1, ultimaFila, ultimaColumna);
  rangoFiltro.createFilter();
  const filtro = hoja.getFilter();

  const ahora = new Date();
  const hora = ahora.getHours();
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

  let criterioFecha;
  if (hora >= 0 && hora < 5) {
    // Madrugada: incluye ayer + hoy, por si algo de anoche sigue abierto.
    const ayer = new Date(hoy);
    ayer.setDate(hoy.getDate() - 1);
    const mananaLimite = new Date(hoy);
    mananaLimite.setDate(hoy.getDate() + 1);

    const formula =
      "=AND($A2>=DATE(" + ayer.getFullYear() + "," + (ayer.getMonth() + 1) + "," + ayer.getDate() + ")," +
      "$A2<DATE(" + mananaLimite.getFullYear() + "," + (mananaLimite.getMonth() + 1) + "," + mananaLimite.getDate() + "))";

    criterioFecha = SpreadsheetApp.newFilterCriteria().whenFormulaSatisfied(formula).build();
  } else {
    criterioFecha = SpreadsheetApp.newFilterCriteria().whenDateEqualTo(hoy).build();
  }

  filtro.setColumnFilterCriteria(1, criterioFecha); // columna A = Date

  // Activas/inactivas: la fila se oculta en cuanto Pallets O Shipout ya
  // tienen algo (cualquiera de las dos sola basta, no hace falta que
  // Clerk también esté lleno).
  filtro.setColumnFilterCriteria(
    CHECKIN_COL_PALLETS,
    SpreadsheetApp.newFilterCriteria()
      .whenFormulaSatisfied('=ISBLANK($Q2)')
      .build()
  );
  filtro.setColumnFilterCriteria(
    CHECKIN_COL_SHIPOUT,
    SpreadsheetApp.newFilterCriteria()
      .whenFormulaSatisfied('=ISBLANK($R2)')
      .build()
  );
}

// Ejecuta esta función UNA vez a mano para que filtrarOrdenesDeHoy() se
// refresque sola cada minuto -- mismo intervalo que usaba el sheet real,
// para que la vista se sienta "en vivo" según las órdenes se van marcando
// como atendidas.
function configurarTriggerFiltro() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function (t) {
    if (t.getHandlerFunction() === "filtrarOrdenesDeHoy") {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger("filtrarOrdenesDeHoy").timeBased().everyMinutes(1).create();

  Logger.log("Trigger configurado: filtrarOrdenesDeHoy cada minuto.");
}

// Mantenimiento SEMANAL: mueve a "Base_de_Datos" las órdenes que ya están
// 100% completas (Forklift, Door, Pallets, Shipout, Clerk y PM llenos) Y
// tienen más de CHECKIN_DIAS_MINIMOS_PARA_ARCHIVAR días -- así "Check-Ins"
// no crece para siempre con órdenes ya cerradas, pero nunca toca nada de
// los últimos días. Copia primero, verifica que el número de filas
// copiadas cuadre, y solo entonces borra el original (si algo no cuadra,
// no borra nada).
function archivarOrdenesCompletadas() {
  const lock = LockService.getScriptLock();
  const tieneLock = lock.tryLock(30000);
  if (!tieneLock) return;

  try {
    const origen = checkinGetSheet_();
    const numCols = CHECKIN_HEADERS.length;

    const ultimaFila = origen.getLastRow();
    if (ultimaFila < 2) return;

    const numRows = ultimaFila - 2 + 1;
    const datos = origen.getRange(2, 1, numRows, numCols).getValues();

    const hoy = new Date();
    const limiteFecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - CHECKIN_DIAS_MINIMOS_PARA_ARCHIVAR);

    const noVacia = function (valor) {
      return valor !== "" && valor !== null && valor !== undefined;
    };

    const filasParaArchivar = [];
    datos.forEach(function (fila, i) {
      const filaReal = 2 + i;
      const fecha = fila[0]; // columna A

      const completada =
        noVacia(fila[CHECKIN_COL_FORKLIFT - 1]) &&
        noVacia(fila[CHECKIN_COL_DOOR - 1]) &&
        noVacia(fila[CHECKIN_COL_PALLETS - 1]) &&
        noVacia(fila[CHECKIN_COL_SHIPOUT - 1]) &&
        noVacia(fila[CHECKIN_COL_CLERK - 1]) &&
        noVacia(fila[CHECKIN_COL_PM - 1]);

      const esVieja = fecha instanceof Date ? fecha < limiteFecha : false;

      if (completada && esVieja) {
        filasParaArchivar.push({ filaReal: filaReal, valores: fila });
      }
    });

    if (filasParaArchivar.length === 0) {
      Logger.log("archivarOrdenesCompletadas: no hay filas para archivar esta corrida.");
      return;
    }

    // Solo se crea/toca "Base_de_Datos" una vez que sabemos que sí hay algo
    // que archivar.
    const destino = checkinGetArchiveSheet_();

    const totalCandidatas = filasParaArchivar.length;
    const loteActual = filasParaArchivar
      .sort(function (a, b) { return a.filaReal - b.filaReal; })
      .slice(0, CHECKIN_MAX_FILAS_POR_CORRIDA);

    if (totalCandidatas > CHECKIN_MAX_FILAS_POR_CORRIDA) {
      Logger.log("archivarOrdenesCompletadas: hay " + totalCandidatas + " filas candidatas, procesando " + loteActual.length + " en esta corrida. Vuelve a correr para seguir con el resto.");
    }

    const valoresParaCopiar = loteActual.map(function (f) { return f.valores; });
    const destinoFilaAntes = destino.getLastRow();

    let copiaExitosa = false;
    try {
      destino.getRange(destinoFilaAntes + 1, 1, valoresParaCopiar.length, numCols).setValues(valoresParaCopiar);
      SpreadsheetApp.flush();
      const filasNuevasReales = destino.getLastRow() - destinoFilaAntes;
      if (filasNuevasReales === valoresParaCopiar.length) {
        copiaExitosa = true;
      } else {
        Logger.log("archivarOrdenesCompletadas: ABORTADO, se esperaban " + valoresParaCopiar.length + " filas nuevas en \"" + CHECKIN_ARCHIVE_SHEET_NAME + "\" pero se detectaron " + filasNuevasReales + ". NO se borró nada de \"" + CHECKIN_SHEET_NAME + "\" por seguridad.");
      }
    } catch (error) {
      Logger.log("archivarOrdenesCompletadas: ERROR al copiar a \"" + CHECKIN_ARCHIVE_SHEET_NAME + "\": " + error + ". NO se borró nada de \"" + CHECKIN_SHEET_NAME + "\" por seguridad.");
    }

    if (!copiaExitosa) return;

    // Si hay un filtro activo, quitarlo antes de borrar (deleteRows puede
    // fallar o comportarse mal con un filtro puesto). Se vuelve a crear
    // solo en la siguiente corrida de filtrarOrdenesDeHoy.
    if (origen.getFilter()) {
      origen.getFilter().remove();
    }

    const bloques = checkinToContiguousBlocks_(loteActual.map(function (f) { return f.filaReal; }));
    bloques.sort(function (a, b) { return b.start - a.start; }); // de mayor a menor, para borrar sin desfasar índices
    bloques.forEach(function (b) {
      origen.deleteRows(b.start, b.end - b.start + 1);
    });

    Logger.log("archivarOrdenesCompletadas: " + loteActual.length + " fila(s) movidas a \"" + CHECKIN_ARCHIVE_SHEET_NAME + "\".");
  } finally {
    lock.releaseLock();
  }
}

// Corre esta función UNA sola vez para que archivarOrdenesCompletadas se
// ejecute sola cada semana (lunes ~4am).
function configurarTriggerArchivado() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function (t) {
    if (t.getHandlerFunction() === "archivarOrdenesCompletadas") {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger("archivarOrdenesCompletadas")
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(4)
    .create();

  Logger.log("Trigger semanal configurado: archivarOrdenesCompletadas cada lunes ~4am.");
}

// Herramienta MANUAL (sin trigger): copia TODO lo que hay ahora mismo en
// "Check-Ins" a "Base_de_Datos", sin filtrar por completo/incompleto ni por
// fecha. Útil como respaldo general antes de una limpieza grande. Marca una
// propiedad de confirmación que limpiarCheckInsDejando48Horas exige antes
// de borrar nada, para nunca borrar sin haber respaldado primero.
function respaldarTodoABaseDeDatos() {
  const lock = LockService.getScriptLock();
  const tieneLock = lock.tryLock(30000);
  if (!tieneLock) {
    Logger.log("respaldarTodoABaseDeDatos: no se pudo obtener el lock, intenta de nuevo en un momento.");
    return;
  }

  try {
    const origen = checkinGetSheet_();
    const destino = checkinGetArchiveSheet_();
    const numCols = CHECKIN_HEADERS.length;

    const ultimaFila = origen.getLastRow();
    if (ultimaFila < 2) {
      Logger.log("respaldarTodoABaseDeDatos: no hay filas de datos que copiar.");
      return;
    }

    const numRows = ultimaFila - 2 + 1;
    const datos = origen.getRange(2, 1, numRows, numCols).getValues();
    const destinoFilaAntes = destino.getLastRow();

    destino.getRange(destinoFilaAntes + 1, 1, numRows, numCols).setValues(datos);
    SpreadsheetApp.flush();

    const filasNuevasReales = destino.getLastRow() - destinoFilaAntes;
    if (filasNuevasReales !== numRows) {
      Logger.log("respaldarTodoABaseDeDatos: ADVERTENCIA, se esperaban " + numRows + " filas nuevas pero se detectaron " + filasNuevasReales + ". NO se marcó la copia como completa -- revisa antes de correr limpiarCheckInsDejando48Horas.");
      return;
    }

    PropertiesService.getScriptProperties().setProperty(
      CHECKIN_PROP_COPIA_COMPLETA,
      JSON.stringify({ fecha: new Date().toISOString(), filasCopiadas: numRows })
    );

    Logger.log("respaldarTodoABaseDeDatos: ÉXITO, " + numRows + " fila(s) copiadas a \"" + CHECKIN_ARCHIVE_SHEET_NAME + "\". Ya puedes correr limpiarCheckInsDejando48Horas() con confianza.");
  } finally {
    lock.releaseLock();
  }
}

// Herramienta MANUAL (sin trigger): borra de "Check-Ins" todo lo de más de
// CHECKIN_HORAS_A_CONSERVAR horas. Por seguridad, solo funciona si acabas de
// correr respaldarTodoABaseDeDatos() con éxito -- si no, avisa y no borra
// nada.
function limpiarCheckInsDejando48Horas() {
  const marca = PropertiesService.getScriptProperties().getProperty(CHECKIN_PROP_COPIA_COMPLETA);
  if (!marca) {
    Logger.log("limpiarCheckInsDejando48Horas: ABORTADO. No se encontró confirmación de que respaldarTodoABaseDeDatos haya corrido exitosamente. Corre primero esa función.");
    return;
  }
  Logger.log("limpiarCheckInsDejando48Horas: confirmación de respaldo encontrada -> " + marca);

  const lock = LockService.getScriptLock();
  const tieneLock = lock.tryLock(30000);
  if (!tieneLock) return;

  try {
    const hoja = checkinGetSheet_();
    const ultimaFila = hoja.getLastRow();
    if (ultimaFila < 2) return;

    const numRows = ultimaFila - 2 + 1;
    const fechas = hoja.getRange(2, 1, numRows, 1).getValues();

    const ahora = new Date();
    const limite = new Date(ahora.getTime() - CHECKIN_HORAS_A_CONSERVAR * 60 * 60 * 1000);

    const filasParaBorrar = [];
    fechas.forEach(function (fila, i) {
      const fecha = fila[0];
      const esVieja = fecha instanceof Date ? fecha < limite : false;
      if (esVieja) filasParaBorrar.push(2 + i);
    });

    if (filasParaBorrar.length === 0) {
      Logger.log("limpiarCheckInsDejando48Horas: no hay filas de más de " + CHECKIN_HORAS_A_CONSERVAR + "h para borrar.");
      return;
    }

    if (hoja.getFilter()) {
      hoja.getFilter().remove();
    }

    const loteActual = filasParaBorrar.slice(0, CHECKIN_MAX_FILAS_POR_CORRIDA);
    const bloques = checkinToContiguousBlocks_(loteActual);
    bloques.sort(function (a, b) { return b.start - a.start; });
    bloques.forEach(function (b) {
      hoja.deleteRows(b.start, b.end - b.start + 1);
    });

    Logger.log("limpiarCheckInsDejando48Horas: " + loteActual.length + " fila(s) borradas de \"" + CHECKIN_SHEET_NAME + "\". Quedaron solo las de las últimas " + CHECKIN_HORAS_A_CONSERVAR + "h.");
  } finally {
    lock.releaseLock();
  }
}

// Config de runFormatOnNewRows_CheckIns_: qué columnas revisar, y de dónde
// copiar el formato/validación cuando a una fila le falte. La fila 2 (la
// primera fila de datos) sirve como "plantilla" -- si quieres que
// Forklift/Door/Pallets/Shipout tengan un menú desplegable o checkbox fijo,
// configúralo a mano ahí una vez, y esta función lo copia solo a las filas
// nuevas que les falte.
const CHECKIN_FORMAT_CFG = {
  templateRow: 2,
  dataStartRow: 2,
  validationCols: [CHECKIN_COL_FORKLIFT, CHECKIN_COL_DOOR, CHECKIN_COL_PALLETS, CHECKIN_COL_SHIPOUT],
};

// Se llama sola al final de cada doPost exitoso -- no hace falta trigger ni
// correrla a mano. También la puedes correr manualmente si quieres forzar
// una pasada (ej. después de configurar la plantilla de la fila 2).
function runFormatOnNewRows_CheckIns_() {
  const hoja = checkinGetSheet_();
  const lastRow = hoja.getLastRow();
  const lastCol = hoja.getLastColumn();
  // Hace falta al menos una fila de datos además de la plantilla (fila 2)
  // para que haya algo que arreglar.
  if (lastRow < CHECKIN_FORMAT_CFG.dataStartRow + 1) return;

  const rowsToFix = checkinGetRowsToFix_(hoja, CHECKIN_FORMAT_CFG.dataStartRow, lastRow, CHECKIN_FORMAT_CFG.validationCols);
  if (rowsToFix.length > 0) {
    checkinApplyTemplateToRows_(hoja, CHECKIN_FORMAT_CFG.templateRow, rowsToFix, lastCol);
  }
}

// Detecta filas a las que les falta validación (dropdown/checkbox) en
// cualquiera de las columnas dadas.
function checkinGetRowsToFix_(sh, startRow, endRow, validationCols) {
  const numRows = endRow - startRow + 1;
  if (numRows <= 0) return [];

  const validationsByCol = validationCols.map(function (col) {
    return sh.getRange(startRow, col, numRows, 1).getDataValidations().flat();
  });

  const rows = [];
  for (let i = 0; i < numRows; i++) {
    const missing = validationsByCol.some(function (vcol) { return vcol[i] == null; });
    if (missing) rows.push(startRow + i);
  }
  return rows;
}

// Copia formato + validaciones desde la fila plantilla hacia las filas
// dadas, en bloques contiguos (más eficiente que celda por celda). Nunca
// toca valores, y nunca se copia la plantilla sobre sí misma.
function checkinApplyTemplateToRows_(sh, templateRow, rows, lastCol) {
  if (!rows || rows.length === 0) return;

  const targetRows = rows.filter(function (r) { return r !== templateRow; });
  if (targetRows.length === 0) return;

  const templateRange = sh.getRange(templateRow, 1, 1, lastCol);
  const templateValidationsRow = templateRange.getDataValidations()[0];

  const blocks = checkinToContiguousBlocks_(targetRows);

  blocks.forEach(function (b) {
    const numRows = b.end - b.start + 1;
    const targetRange = sh.getRange(b.start, 1, numRows, lastCol);

    templateRange.copyTo(targetRange, { formatOnly: true });

    const validationsMatrix = [];
    for (let i = 0; i < numRows; i++) validationsMatrix.push(templateValidationsRow.slice());
    targetRange.setDataValidations(validationsMatrix);
  });
}

// Convierte números de fila sueltos en bloques consecutivos, ej.
// [5,6,7,10] -> [{start:5,end:7},{start:10,end:10}]. Se usa para borrar o
// copiar por bloques en vez de fila por fila (mucho más eficiente).
function checkinToContiguousBlocks_(rows) {
  const out = [];
  const sorted = rows.slice().sort(function (a, b) { return a - b; });

  let s = sorted[0];
  let e = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === e + 1) {
      e = sorted[i];
    } else {
      out.push({ start: s, end: e });
      s = e = sorted[i];
    }
  }
  out.push({ start: s, end: e });
  return out;
}

// Herramienta MANUAL de una sola corrida: borra TODAS las reglas de
// Formato condicional que haya en "Check-Ins" ahora mismo, sin importar
// cuántas ni si las pusiste tú a mano desde el menú Formato o si vienen de
// una versión anterior de este script. Este archivo ya no crea ni mantiene
// ninguna regla de color -- si más adelante quieres colores otra vez,
// configúralos tú a mano en Formato → Formato condicional.
function quitarFormatoCondicional() {
  const hoja = checkinGetSheet_();
  const cuantasHabia = hoja.getConditionalFormatRules().length;
  hoja.setConditionalFormatRules([]);
  Logger.log("quitarFormatoCondicional: se borraron " + cuantasHabia + " regla(s) de Formato condicional.");
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

// Igual que checkinGetSheet_, pero para la pestaña de archivo -- si todavía
// no existe, la crea con los mismos encabezados que "Check-Ins".
function checkinGetArchiveSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(CHECKIN_ARCHIVE_SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(CHECKIN_ARCHIVE_SHEET_NAME);
    sheet.getRange(1, 1, 1, CHECKIN_HEADERS.length).setValues([CHECKIN_HEADERS]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function checkinJsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
