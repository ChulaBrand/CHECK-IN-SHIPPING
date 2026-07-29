// Máscara de teléfono estilo "(XXX) XXX-XXXX" -- rellena lo que falta con
// "_" para que se vea cuántos dígitos quedan por escribir.

const DIGIT_COUNT = 10;
const PLACEHOLDER = "_";

export function extractPhoneDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, DIGIT_COUNT);
}

export function formatPhoneMask(rawDigits: string): string {
  const digits = extractPhoneDigits(rawDigits);
  const padded = (digits + PLACEHOLDER.repeat(DIGIT_COUNT)).slice(
    0,
    DIGIT_COUNT
  );
  return `(${padded.slice(0, 3)}) ${padded.slice(3, 6)}-${padded.slice(6, 10)}`;
}

// Posición (dentro del string ya formateado) justo después del último dígito
// real, para cada cantidad de dígitos escritos -- en el patrón
// "(XXX) XXX-XXXX" los 10 dígitos caen en los índices 1,2,3, 6,7,8,
// 10,11,12,13. Se usa para mantener el cursor pegado al último dígito real
// (nunca sobre un "_") -- si no, Backspace a veces borra un "_" en vez de un
// dígito real, o el siguiente dígito se inserta en medio de la máscara.
const DIGIT_SLOT_END_POSITIONS = [1, 2, 3, 6, 7, 8, 10, 11, 12, 13].map(
  (i) => i + 1
);

export function phoneMaskCursorPosition(digitCount: number): number {
  if (digitCount <= 0) return 1;
  const n = Math.min(digitCount, DIGIT_SLOT_END_POSITIONS.length);
  return DIGIT_SLOT_END_POSITIONS[n - 1];
}
