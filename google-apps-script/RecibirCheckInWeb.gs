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
 *    de estas 5 (en cualquier orden), autorizando permisos la primera vez:
 *      - **configurarEncabezados**       -- crea la fila de encabezados.
 *      - **configurarTriggerFiltro**     -- filtra la vista a "solo hoy".
 *      - **configurarTriggerHoraSalida** -- Depa marcado -> Hora de Salida
 *        automática.
 *      - **configurarTriggerArchivado**  -- archivado semanal de órdenes
 *        completadas y viejas (ver abajo).
 *      - **configurarTriggerArchivadoDiario** -- mueve TODO a
 *        "Base_de_Datos" y deja "Check-Ins" vacía cada día ~5am (ver
 *        abajo).
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
 *   la vista las órdenes que ya no son de hoy (el día "corta" a las 5am:
 *   antes de las 5am se ve ayer completo + lo de hoy que lleve la
 *   madrugada; de las 5am en adelante, solo hoy), Y las que ya están
 *   atendidas: Clerk, Pallets y Shipout los tres llenos, Y ADEMÁS el
 *   checkbox de Depa (ya salió) marcado -- las cuatro cosas a la vez, ya
 *   no basta con que falte cualquiera de ellas. Es un filtro de vista:
 *   nunca borra ni mueve nada.
 * - archivarOrdenesCompletadas (semanal, lunes ~4am, una vez armado el
 *   trigger) mueve a la pestaña "Base_de_Datos" las órdenes que ya están
 *   100% completas (Forklift, Door, Pallets, Shipout, Clerk y PM llenos) Y
 *   tienen más de 2 días -- copia primero, verifica, y solo entonces borra
 *   el original. Así "Check-Ins" no crece para siempre con órdenes ya
 *   cerradas.
 * - archivarTodoDiario (diario ~5am, una vez armado el trigger) mueve a
 *   "Base_de_Datos" las órdenes de más de CHECKIN_HORAS_A_CONSERVAR horas
 *   (24h) -- completas o no -- y las borra de "Check-Ins". Las de las
 *   últimas 24h se quedan sin tocar, por si el personal las sigue
 *   necesitando a la vista. Copia primero, verifica, y solo entonces borra
 *   (usando checkinBorrarFilasSeguro_, que vacía con clearContent() en vez
 *   de deleteRows() si algún día le tocara borrar TODAS las filas -- Sheets
 *   no permite dejar una hoja sin ninguna fila no congelada).
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
 * - limpiarCheckInsDejando24Horas: borra de "Check-Ins" todo lo de más de
 *   24 horas. Por seguridad, solo funciona si acabas de correr
 *   respaldarTodoABaseDeDatos con éxito (si no, te avisa y no borra nada).
 * - repararCheckInsDuplicadosEnBaseDeDatos: corre esta SOLO si una corrida
 *   de archivado (archivarTodoDiario o archivarOrdenesCompletadas) copió
 *   filas a "Base_de_Datos" pero un error a mitad de camino impidió que las
 *   borrara de "Check-Ins" -- revisa las Ejecuciones para confirmarlo.
 *   Identifica "es la misma orden" solo por las columnas A:L (lo que llena
 *   el chofer, nunca cambia después) -- si el personal ya avanzó M:V
 *   (Forklift/Door/Pallets/PM/etc.) en "Check-Ins" mientras la fila
 *   esperaba a borrarse, primero refresca esa fila en "Base_de_Datos" con
 *   lo más reciente, y hasta entonces borra de "Check-Ins".
 * - diagnosticarComparacionCheckInsBaseDeDatos: de solo lectura, no borra
 *   ni cambia nada. Úsala si repararCheckInsDuplicadosEnBaseDeDatos dice
 *   que no encontró nada aunque a simple vista se vean filas iguales en
 *   las dos pestañas -- busca un par que coincida por Nombre+Apellido+
 *   Placas y registra en el log, columna por columna, el tipo y valor
 *   exacto de cada lado, para ver exactamente en cuál difieren.
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
const CHECKIN_HORAS_A_CONSERVAR = 24; // limpiarCheckInsDejando24Horas: cuánto se deja
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

  // Activas/inactivas: la fila NO se oculta hasta que Clerk, Pallets y
  // Shipout los tres ya tienen algo, Y ADEMÁS ya salió (checkbox de Depa
  // marcado) -- las cuatro cosas a la vez, ya no basta con que falte
  // cualquiera de ellas. Va en una sola fórmula (no una condición por
  // columna) porque necesitamos un OR -- si se pusiera una condición
  // ISBLANK/checkbox por columna, Sheets las junta con AND entre columnas,
  // que es la lógica contraria (ocultaría la fila en cuanto CUALQUIERA de
  // las cuatro se llenara/marcara, no hasta que las cuatro estén listas).
  filtro.setColumnFilterCriteria(
    CHECKIN_COL_PALLETS,
    SpreadsheetApp.newFilterCriteria()
      .whenFormulaSatisfied('=OR(ISBLANK($Q2), ISBLANK($R2), ISBLANK($S2), NOT($O2))')
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

    checkinBorrarFilasSeguro_(origen, numCols, loteActual.map(function (f) { return f.filaReal; }));

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

// Mantenimiento DIARIO: todos los días ~5am (una vez armado el trigger)
// mueve TODAS las filas de "Check-Ins" a "Base_de_Datos" -- sin importar si
// están completas o no -- y las borra de "Check-Ins", que amanece vacía
// (solo encabezados) cada día. Copia primero, verifica que el número de
// filas copiadas cuadre, y solo entonces borra el original (si algo no
// cuadra, no borra nada). Encaja con la ventana de madrugada de
// filtrarOrdenesDeHoy (12am-5am también muestra lo de ayer): a las 5am en
// punto ya no hace falta esa ventana, porque "Check-Ins" acaba de quedar
// en blanco.
function archivarTodoDiario() {
  const lock = LockService.getScriptLock();
  const tieneLock = lock.tryLock(30000);
  if (!tieneLock) return;

  try {
    const origen = checkinGetSheet_();
    const numCols = CHECKIN_HEADERS.length;

    const ultimaFila = origen.getLastRow();
    if (ultimaFila < 2) {
      Logger.log("archivarTodoDiario: no hay filas de datos que mover.");
      return;
    }

    const numRows = ultimaFila - 2 + 1;
    const datos = origen.getRange(2, 1, numRows, numCols).getValues();

    // Deja las últimas CHECKIN_HORAS_A_CONSERVAR horas SIN tocar (por si
    // el personal las sigue necesitando a la vista) -- solo mueve lo más
    // viejo que eso, completo o no.
    const ahora = new Date();
    const limite = new Date(ahora.getTime() - CHECKIN_HORAS_A_CONSERVAR * 60 * 60 * 1000);

    const filasParaArchivar = [];
    const datosParaArchivar = [];
    datos.forEach(function (fila, i) {
      const fecha = fila[0]; // columna A
      const esVieja = fecha instanceof Date ? fecha < limite : false;
      if (esVieja) {
        filasParaArchivar.push(2 + i);
        datosParaArchivar.push(fila);
      }
    });

    if (filasParaArchivar.length === 0) {
      Logger.log("archivarTodoDiario: no hay filas de más de " + CHECKIN_HORAS_A_CONSERVAR + "h para mover.");
      return;
    }

    const destino = checkinGetArchiveSheet_();
    const destinoFilaAntes = destino.getLastRow();

    let copiaExitosa = false;
    try {
      destino.getRange(destinoFilaAntes + 1, 1, datosParaArchivar.length, numCols).setValues(datosParaArchivar);
      SpreadsheetApp.flush();
      const filasNuevasReales = destino.getLastRow() - destinoFilaAntes;
      if (filasNuevasReales === datosParaArchivar.length) {
        copiaExitosa = true;
      } else {
        Logger.log("archivarTodoDiario: ABORTADO, se esperaban " + datosParaArchivar.length + " filas nuevas en \"" + CHECKIN_ARCHIVE_SHEET_NAME + "\" pero se detectaron " + filasNuevasReales + ". NO se borró nada de \"" + CHECKIN_SHEET_NAME + "\" por seguridad.");
      }
    } catch (error) {
      Logger.log("archivarTodoDiario: ERROR al copiar a \"" + CHECKIN_ARCHIVE_SHEET_NAME + "\": " + error + ". NO se borró nada de \"" + CHECKIN_SHEET_NAME + "\" por seguridad.");
    }

    if (!copiaExitosa) return;

    // Quitar el filtro antes de borrar (deleteRows puede fallar o
    // comportarse mal con un filtro puesto). Se vuelve a crear solo en la
    // siguiente corrida de filtrarOrdenesDeHoy.
    if (origen.getFilter()) {
      origen.getFilter().remove();
    }

    checkinBorrarFilasSeguro_(origen, numCols, filasParaArchivar);

    Logger.log("archivarTodoDiario: " + filasParaArchivar.length + " fila(s) de más de " + CHECKIN_HORAS_A_CONSERVAR + "h movidas a \"" + CHECKIN_ARCHIVE_SHEET_NAME + "\" y borradas de \"" + CHECKIN_SHEET_NAME + "\". Quedan " + (numRows - filasParaArchivar.length) + " fila(s) de las últimas " + CHECKIN_HORAS_A_CONSERVAR + "h.");
  } finally {
    lock.releaseLock();
  }
}

// Corre esta función UNA sola vez para que archivarTodoDiario se ejecute
// sola todos los días ~5am.
function configurarTriggerArchivadoDiario() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function (t) {
    if (t.getHandlerFunction() === "archivarTodoDiario") {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger("archivarTodoDiario")
    .timeBased()
    .everyDays(1)
    .atHour(5)
    .create();

  Logger.log("Trigger diario configurado: archivarTodoDiario todos los días ~5am.");
}

// Herramienta MANUAL (sin trigger): copia TODO lo que hay ahora mismo en
// "Check-Ins" a "Base_de_Datos", sin filtrar por completo/incompleto ni por
// fecha. Útil como respaldo general antes de una limpieza grande. Marca una
// propiedad de confirmación que limpiarCheckInsDejando24Horas exige antes
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
      Logger.log("respaldarTodoABaseDeDatos: ADVERTENCIA, se esperaban " + numRows + " filas nuevas pero se detectaron " + filasNuevasReales + ". NO se marcó la copia como completa -- revisa antes de correr limpiarCheckInsDejando24Horas.");
      return;
    }

    PropertiesService.getScriptProperties().setProperty(
      CHECKIN_PROP_COPIA_COMPLETA,
      JSON.stringify({ fecha: new Date().toISOString(), filasCopiadas: numRows })
    );

    Logger.log("respaldarTodoABaseDeDatos: ÉXITO, " + numRows + " fila(s) copiadas a \"" + CHECKIN_ARCHIVE_SHEET_NAME + "\". Ya puedes correr limpiarCheckInsDejando24Horas() con confianza.");
  } finally {
    lock.releaseLock();
  }
}

// Herramienta MANUAL (sin trigger): borra de "Check-Ins" todo lo de más de
// CHECKIN_HORAS_A_CONSERVAR horas. Por seguridad, solo funciona si acabas de
// correr respaldarTodoABaseDeDatos() con éxito -- si no, avisa y no borra
// nada.
function limpiarCheckInsDejando24Horas() {
  const marca = PropertiesService.getScriptProperties().getProperty(CHECKIN_PROP_COPIA_COMPLETA);
  if (!marca) {
    Logger.log("limpiarCheckInsDejando24Horas: ABORTADO. No se encontró confirmación de que respaldarTodoABaseDeDatos haya corrido exitosamente. Corre primero esa función.");
    return;
  }
  Logger.log("limpiarCheckInsDejando24Horas: confirmación de respaldo encontrada -> " + marca);

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
      Logger.log("limpiarCheckInsDejando24Horas: no hay filas de más de " + CHECKIN_HORAS_A_CONSERVAR + "h para borrar.");
      return;
    }

    if (hoja.getFilter()) {
      hoja.getFilter().remove();
    }

    const loteActual = filasParaBorrar.slice(0, CHECKIN_MAX_FILAS_POR_CORRIDA);
    checkinBorrarFilasSeguro_(hoja, CHECKIN_HEADERS.length, loteActual);

    Logger.log("limpiarCheckInsDejando24Horas: " + loteActual.length + " fila(s) borradas de \"" + CHECKIN_SHEET_NAME + "\". Quedaron solo las de las últimas " + CHECKIN_HORAS_A_CONSERVAR + "h.");
  } finally {
    lock.releaseLock();
  }
}

// Herramienta MANUAL de reparación (sin trigger): úsala si una corrida de
// archivarTodoDiario (o archivarOrdenesCompletadas) alcanzó a copiar filas a
// "Base_de_Datos" pero un error a mitad de camino impidió que las borrara de
// "Check-Ins" -- revisa las Ejecuciones del proyecto para confirmar que fue
// eso.
//
// Identifica "es la misma orden" comparando SOLO las columnas A:L -- lo que
// llena el chofer al enviar el formulario, igual que el rango que escribe
// doPost de un jalón, y que ya nunca se vuelve a tocar. A propósito NO
// compara M:V (Forklift, Door, Pallets, Clerk, PM, Comentarios, Acomodo):
// esas las sigue llenando el personal directo en "Check-Ins" mientras la
// fila espera a borrarse, así que casi siempre van a estar más avanzadas
// ahí que en la copia vieja de "Base_de_Datos" -- comparar la fila COMPLETA
// (como hacía la primera versión de esta función) casi nunca encuentra
// coincidencia por eso, y la fila se queda atorada para siempre.
//
// Antes de borrar de "Check-Ins", si M:V ya no coincide con lo que quedó en
// "Base_de_Datos", ACTUALIZA esa fila en "Base_de_Datos" con el contenido
// más reciente de "Check-Ins" (y lo verifica) -- así nunca se pierde
// trabajo del personal por quedarse solo con la copia vieja. Compara desde
// la fila 2 hacia abajo y se detiene en la primera fila sin match en A:L
// (de ahí para abajo son check-ins reales que todavía no se han
// archivado).
function repararCheckInsDuplicadosEnBaseDeDatos() {
  const lock = LockService.getScriptLock();
  const tieneLock = lock.tryLock(30000);
  if (!tieneLock) {
    Logger.log("repararCheckInsDuplicadosEnBaseDeDatos: no se pudo obtener el lock, intenta de nuevo en un momento.");
    return;
  }

  try {
    const origen = checkinGetSheet_();
    const numCols = CHECKIN_HEADERS.length;
    const numColsIdentidad = 12; // A:L -- lo único que llena el chofer y nunca cambia después
    const ultimaFilaOrigen = origen.getLastRow();
    if (ultimaFilaOrigen < 2) {
      Logger.log('repararCheckInsDuplicadosEnBaseDeDatos: "' + CHECKIN_SHEET_NAME + '" no tiene filas de datos, nada que reparar.');
      return;
    }

    const destino = checkinGetArchiveSheet_();
    const ultimaFilaDestino = destino.getLastRow();
    if (ultimaFilaDestino < 2) {
      Logger.log('repararCheckInsDuplicadosEnBaseDeDatos: "' + CHECKIN_ARCHIVE_SHEET_NAME + '" está vacía, no hay nada contra qué comparar. No se borró nada.');
      return;
    }

    const datosOrigen = origen.getRange(2, 1, ultimaFilaOrigen - 1, numCols).getValues();
    const datosDestino = destino.getRange(2, 1, ultimaFilaDestino - 1, numCols).getValues();

    // La columna B (Time) la escribe doPost como TEXTO "hh:mm a", pero si
    // la columna destino no tiene formato de texto plano, Sheets la
    // auto-convierte a un valor de hora real al copiarla (setValues()
    // re-interpreta strings que "parecen" fecha/hora, igual que si los
    // tecleraras a mano en la hoja) -- así que la misma orden puede verse
    // como texto en un lado y como Date en el otro. Comparar el texto
    // reformateado es fràgil (ceros a la izquierda, espacios, mayúsculas),
    // así que en vez de eso esto la reduce a minutos-desde-medianoche en
    // ambos casos -- un número, no depende de formato.
    function minutosDelDia_(v) {
      if (v instanceof Date) return v.getHours() * 60 + v.getMinutes();
      const m = /^(\d{1,2}):(\d{2})\s*([AP])M?$/i.exec(String(v).trim());
      if (!m) return null;
      let h = parseInt(m[1], 10) % 12;
      if (m[3].toUpperCase() === "P") h += 12;
      return h * 60 + parseInt(m[2], 10);
    }

    // Firma = las primeras `hastaCol` columnas de la fila concatenadas en
    // un solo texto, separadas por un caracter de control (\u0001) que
    // nunca va a aparecer en datos reales. Normaliza cada valor ANTES de
    // unir: la columna B (Time, índice 1) se reduce a minutos-del-día (ver
    // minutosDelDia_ arriba); las demás columnas Date (la A, que siempre es
    // un Date real de verdad en los dos lados) se reducen a milisegundos.
    function firma_(fila, hastaCol) {
      return fila
        .slice(0, hastaCol)
        .map(function (v, idx) {
          if (idx === 1) {
            const min = minutosDelDia_(v);
            return min === null ? v : "min:" + min;
          }
          return v instanceof Date ? v.getTime() : v;
        })
        .join("\u0001");
    }

    // Identidad (A:L) -> número de fila real en Base_de_Datos. Si dos
    // filas comparten identidad (un archivado fallido corrido más de una
    // vez), se queda con la última -- es la copia más reciente.
    const filaDestinoPorIdentidad = {};
    datosDestino.forEach(function (fila, i) {
      filaDestinoPorIdentidad[firma_(fila, numColsIdentidad)] = 2 + i;
    });

    let filasDuplicadas = 0;
    let filasActualizadas = 0;
    const destinoRowDeCadaOrigen = [];
    for (let i = 0; i < datosOrigen.length; i++) {
      const filaActual = datosOrigen[i];
      const filaDestinoNum = filaDestinoPorIdentidad[firma_(filaActual, numColsIdentidad)];
      if (!filaDestinoNum) break; // primera fila sin match en A:L -- de ahí para abajo no se toca nada

      // ¿El personal siguió llenando M:V en Check-Ins después del
      // archivado fallido? Si la fila completa ya no coincide con la copia
      // en Base_de_Datos, hay que refrescarla ahí antes de borrar el
      // original.
      const filaDestinoActual = datosDestino[filaDestinoNum - 2];
      if (firma_(filaActual, numCols) !== firma_(filaDestinoActual, numCols)) {
        destino.getRange(filaDestinoNum, 1, 1, numCols).setValues([filaActual]);
        filasActualizadas++;
      }

      destinoRowDeCadaOrigen.push(filaDestinoNum);
      filasDuplicadas++;
    }

    if (filasDuplicadas === 0) {
      Logger.log('repararCheckInsDuplicadosEnBaseDeDatos: ninguna fila al principio de "' + CHECKIN_SHEET_NAME + '" tiene una fila con la misma identidad (A:L) en "' + CHECKIN_ARCHIVE_SHEET_NAME + '". No se borró nada.');
      return;
    }

    if (filasActualizadas > 0) {
      SpreadsheetApp.flush();
      // Copia, verifica, y HASTA ENTONCES borra -- mismo principio que el
      // resto del archivo: vuelve a leer Base_de_Datos y confirma que de
      // verdad quedó igual antes de tocar Check-Ins.
      const datosDestinoVerif = destino.getRange(2, 1, destino.getLastRow() - 1, numCols).getValues();
      for (let i = 0; i < filasDuplicadas; i++) {
        const verificacion = datosDestinoVerif[destinoRowDeCadaOrigen[i] - 2];
        if (firma_(datosOrigen[i], numCols) !== firma_(verificacion, numCols)) {
          Logger.log('repararCheckInsDuplicadosEnBaseDeDatos: ABORTADO, la fila ' + (2 + i) + ' de "' + CHECKIN_SHEET_NAME + '" no quedó igual en "' + CHECKIN_ARCHIVE_SHEET_NAME + '" después de actualizarla. NO se borró nada por seguridad.');
          return;
        }
      }
    }

    Logger.log(
      "repararCheckInsDuplicadosEnBaseDeDatos: " + filasDuplicadas + ' fila(s) al principio de "' + CHECKIN_SHEET_NAME +
      '" ya estaban en "' + CHECKIN_ARCHIVE_SHEET_NAME + '" (' + filasActualizadas + ' se refrescaron ahí primero porque el personal las había seguido llenando) -- se van a borrar de "' + CHECKIN_SHEET_NAME +
      '". Quedan ' + (datosOrigen.length - filasDuplicadas) + " fila(s) sin tocar."
    );

    if (origen.getFilter()) {
      origen.getFilter().remove();
    }
    const filasParaBorrar = [];
    for (let i = 0; i < filasDuplicadas; i++) filasParaBorrar.push(2 + i);
    checkinBorrarFilasSeguro_(origen, numCols, filasParaBorrar);

    Logger.log("repararCheckInsDuplicadosEnBaseDeDatos: listo, se borraron " + filasDuplicadas + " fila(s) de \"" + CHECKIN_SHEET_NAME + "\".");
  } finally {
    lock.releaseLock();
  }
}

// Herramienta de DIAGNÓSTICO (sin trigger, NO modifica nada): busca en
// "Check-Ins" y "Base_de_Datos" un par de filas que un humano reconocería
// como la misma orden (mismo Nombre + Apellido + Placas) y registra en el
// log, columna por columna (A:L), el TIPO de dato y el valor exacto de cada
// lado. Úsala si repararCheckInsDuplicadosEnBaseDeDatos sigue sin encontrar
// nada aunque a simple vista se vean iguales -- el log dice exactamente en
// cuál columna y por qué difieren (tipo de dato, formato, o el valor de
// verdad), sin necesidad de adivinar desde una captura de pantalla.
function diagnosticarComparacionCheckInsBaseDeDatos() {
  const origen = checkinGetSheet_();
  const destino = checkinGetArchiveSheet_();
  const numColsIdentidad = 12;

  const ultimaFilaOrigen = origen.getLastRow();
  const ultimaFilaDestino = destino.getLastRow();
  if (ultimaFilaOrigen < 2 || ultimaFilaDestino < 2) {
    Logger.log("diagnosticarComparacionCheckInsBaseDeDatos: alguna de las dos hojas no tiene filas de datos que comparar.");
    return;
  }

  const datosOrigen = origen.getRange(2, 1, ultimaFilaOrigen - 1, numColsIdentidad).getValues();
  const datosDestino = destino.getRange(2, 1, ultimaFilaDestino - 1, numColsIdentidad).getValues();

  function textoSuelto_(v) {
    return v instanceof Date ? String(v.getTime()) : String(v);
  }

  for (let i = 0; i < datosOrigen.length; i++) {
    const fo = datosOrigen[i];
    let filaMatch = null;
    for (let k = 0; k < datosDestino.length; k++) {
      const fd = datosDestino[k];
      // Nombre (C=2) + Apellido (D=3) + Placas (F=5) -- lo que un humano
      // usaría para reconocer "es la misma orden" a simple vista.
      if (textoSuelto_(fd[2]) === textoSuelto_(fo[2]) && textoSuelto_(fd[3]) === textoSuelto_(fo[3]) && textoSuelto_(fd[5]) === textoSuelto_(fo[5])) {
        filaMatch = fd;
        break;
      }
    }
    if (filaMatch) {
      Logger.log("=== Comparando Check-Ins fila " + (2 + i) + ' contra su match en "' + CHECKIN_ARCHIVE_SHEET_NAME + '" por Nombre+Apellido+Placas ===');
      for (let c = 0; c < numColsIdentidad; c++) {
        const letraCol = String.fromCharCode(65 + c);
        const vo = fo[c];
        const vd = filaMatch[c];
        const tipoOrigen = vo instanceof Date ? "Date" : typeof vo;
        const tipoDestino = vd instanceof Date ? "Date" : typeof vd;
        const igual = tipoOrigen === tipoDestino && textoSuelto_(vo) === textoSuelto_(vd);
        Logger.log(
          letraCol + " (" + CHECKIN_HEADERS[c] + "): Check-Ins=[" + tipoOrigen + '] "' + vo + '"   Base_de_Datos=[' + tipoDestino + '] "' + vd + '"   ' + (igual ? "OK, coinciden" : "*** DIFERENTE ***")
        );
      }
      return; // un solo par ya alcanza para diagnosticar
    }
  }

  Logger.log("diagnosticarComparacionCheckInsBaseDeDatos: no encontré ningún par por Nombre+Apellido+Placas para comparar.");
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

// Borra las filas indicadas (arreglo de números de fila, no necesariamente
// contiguos) con cuidado del límite de Google Sheets que impide dejar una
// hoja sin NINGUNA fila no congelada: si el conjunto a borrar cubre TODAS
// las filas de datos que hay ahora mismo (fila 2 a la última), Sheets
// rechaza el deleteRows con "Sorry, it is not possible to delete all
// non-frozen rows" -- error real que causó que archivarTodoDiario fallara
// SIEMPRE que Check-Ins tuviera solo lo que la propia corrida iba a mover
// (o sea, casi siempre). Cuando pasa eso, en vez de borrar las filas se
// les vacía el contenido con clearContent() -- mismo resultado (la hoja
// "queda vacía") sin chocar con esa restricción.
function checkinBorrarFilasSeguro_(hoja, numCols, filas) {
  if (filas.length === 0) return;

  const ultimaFilaConDatos = hoja.getLastRow();
  const cubreTodasLasFilasDeDatos = filas.length >= ultimaFilaConDatos - 1; // fila 1 = encabezados, no cuenta

  if (cubreTodasLasFilasDeDatos) {
    filas.forEach(function (f) {
      hoja.getRange(f, 1, 1, numCols).clearContent();
    });
    return;
  }

  const bloques = checkinToContiguousBlocks_(filas);
  bloques.sort(function (a, b) { return b.start - a.start; }); // de mayor a menor, para borrar sin desfasar índices
  bloques.forEach(function (b) {
    hoja.deleteRows(b.start, b.end - b.start + 1);
  });
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
