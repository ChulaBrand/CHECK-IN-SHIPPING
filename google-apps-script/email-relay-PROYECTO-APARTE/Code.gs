/**
 * ⚠️ ADVERTENCIA — LÉELO ANTES DE PEGAR ESTO EN ALGÚN LADO ⚠️
 *
 * Este archivo NO va en el mismo proyecto de Apps Script que
 * RecibirCheckInWeb.gs (el del formulario de Check-In Shipping). Van en
 * proyectos de Apps Script COMPLETAMENTE SEPARADOS, cada uno con su propia
 * URL /exec.
 *
 * Motivo: Apps Script (igual que JavaScript normal) no permite dos
 * funciones con el mismo nombre en el mismo proyecto -- si `doPost` se
 * define dos veces, la segunda definición reemplaza a la primera por
 * completo. Pegar este archivo junto con RecibirCheckInWeb.gs es EXACTAMENTE
 * lo que causó que el formulario de check-in dejara de mandar datos al
 * Sheet un día completo sin que nadie se diera cuenta (el navegador no
 * puede detectar el error porque el envío usa modo "no-cors").
 *
 * Cómo instalarlo correctamente (proyecto nuevo, independiente):
 * 1. Ve a https://script.google.com -- inicia sesión con la cuenta de
 *    Google que quieres que aparezca en "De:" al mandar los correos (puede
 *    ser una cuenta distinta a la dueña del Sheet de Check-Ins).
 * 2. **Proyecto nuevo** (no lo crees desde dentro de ningún Google Sheet --
 *    este script no necesita estar atado a ninguna hoja).
 * 3. Borra el contenido de `Code.gs` que trae por default y pega ESTE
 *    archivo completo.
 * 4. **Extensiones → Propiedades del proyecto → Propiedades del script**
 *    (o el ícono de engrane → "Propiedades del proyecto" → pestaña
 *    "Propiedades del script") → agrega:
 *      - Nombre:  RELAY_SECRET
 *      - Valor:   (invéntate una contraseña larga y única, solo para esto)
 * 5. **Implementar → Nueva implementación** → tipo "Aplicación web":
 *      - Ejecutar como: Yo (la cuenta de correo que quieres que aparezca
 *        en "De:")
 *      - Quién tiene acceso: Cualquier usuario
 * 6. Copia la URL que termina en `/exec` -- esa es la URL a la que hay que
 *    mandarle POST con `{ secret, to, subject, body }` para que mande el
 *    correo. Guárdala aparte, no es la misma URL que la del check-in.
 */

// ── RELAY DE CORREO ──────────────────────────────────────────────────────
// Proyecto APARTE del Sheet de Shipping — vive bajo la cuenta de Google dueña del
// correo que quieres que aparezca en "De:". No hace nada más que recibir una
// instrucción (secreto + destinatario + asunto + cuerpo) y mandar el correo con
// MailApp — como esta cuenta es la dueña de ESTE proyecto, el correo sale
// genuinamente de ella, sin alias ni servicio externo de por medio.
//
// Configura esta Script Property antes de usarlo (Extensiones → Propiedades del
// proyecto → Propiedades del script):
//   RELAY_SECRET -> el mismo valor que EMAIL_RELAY_SECRET en el Sheet de Shipping,
//                   para que solo ese Sheet (o quien tenga el secreto) pueda usar esto.
const RELAY_SECRET = PropertiesService.getScriptProperties().getProperty('RELAY_SECRET');

// Comparación a tiempo constante — mismo motivo que en el Sheet principal: este
// endpoint no tiene sesión, solo este secreto, y queda expuesto a internet.
function constantTimeEquals(a, b) {
  a = String(a || ''); b = String(b || '');
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function doPost(e) {
  const bad = ContentService.createTextOutput(JSON.stringify({ ok: false })).setMimeType(ContentService.MimeType.JSON);
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return bad;
  }
  if (!data || typeof data !== 'object') return bad;
  if (!RELAY_SECRET || !constantTimeEquals(data.secret, RELAY_SECRET)) return bad;

  const to = String(data.to || '').trim();
  const subject = String(data.subject || '').trim();
  const body = String(data.body || '');
  if (!to || !subject) return bad;

  try {
    MailApp.sendEmail(to, subject, body);
    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  }
}
