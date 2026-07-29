import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

const MULTI_SELECT_SEPARATOR = ",";

export function serializeMultiSelect(values: string[]): string | null {
  const clean = values.map((v) => v.trim()).filter(Boolean);
  return clean.length > 0 ? clean.join(MULTI_SELECT_SEPARATOR) : null;
}

export function parseMultiSelect(value: string | null | undefined): string[] {
  if (!value) return [];
  return value.split(MULTI_SELECT_SEPARATOR).filter(Boolean);
}

const dateTimeFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "short",
  timeStyle: "short",
});

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
});

const timeFormatter = new Intl.DateTimeFormat("es-MX", {
  timeStyle: "short",
});

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return dateTimeFormatter.format(new Date(date));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return dateFormatter.format(new Date(date));
}

export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return timeFormatter.format(new Date(date));
}

// Convierte un Date a formato "YYYY-MM-DDTHH:mm" para precargar un
// <input type="datetime-local">. Usa la hora local del servidor a propósito
// -- es una bodega en un solo huso horario, no hace falta manejar zonas.
export function toDateTimeLocalValue(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
