import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

const MULTI_SELECT_SEPARATOR = ", ";

export function serializeMultiSelect(values: string[]): string {
  const clean = values.map((v) => v.trim()).filter(Boolean);
  return clean.join(MULTI_SELECT_SEPARATOR);
}
