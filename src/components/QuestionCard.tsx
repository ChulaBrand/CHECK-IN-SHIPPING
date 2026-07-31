"use client";

import { useLayoutEffect, useRef } from "react";
import type { StepConfig, Answers } from "@/lib/wizardSteps";
import { ui, type Locale } from "@/lib/i18n";
import {
  formatPhoneMask,
  extractPhoneDigits,
  phoneMaskCursorPosition,
} from "@/lib/phone";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type SetAnswer = <K extends keyof Answers>(key: K, value: Answers[K]) => void;

// El campo solo soporta escribir/borrar al final de los dígitos ya escritos
// (como un PIN) -- después de cada cambio regresamos el cursor justo después
// del último dígito real, si no Backspace a veces borra un "_" en vez de un
// dígito, o el siguiente dígito se inserta en medio de la máscara.
function PhoneInput({
  digits,
  onChange,
}: {
  digits: string;
  onChange: (digits: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const masked = formatPhoneMask(digits);
  const cursorPos = phoneMaskCursorPosition(digits.length);

  useLayoutEffect(() => {
    const el = inputRef.current;
    if (el && document.activeElement === el) {
      el.setSelectionRange(cursorPos, cursorPos);
    }
  }, [digits, cursorPos]);

  // El navegador coloca su propio cursor al enfocar/hacer click (ej. al
  // volver de un error de validación, o al tocar el campo en medio de la
  // máscara) DESPUÉS de que corran estos manejadores, así que forzarlo aquí
  // mismo no gana esa carrera -- se difiere un tick para corregirlo después.
  const snapCursorNextTick = () => {
    setTimeout(() => {
      const el = inputRef.current;
      if (el) el.setSelectionRange(cursorPos, cursorPos);
    }, 0);
  };

  return (
    <Input
      ref={inputRef}
      type="tel"
      inputMode="numeric"
      value={masked}
      onChange={(e) => onChange(extractPhoneDigits(e.target.value))}
      onFocus={snapCursorNextTick}
      onClick={snapCursorNextTick}
      autoFocus
    />
  );
}

function Field({
  step,
  answers,
  setAnswer,
  locale,
}: {
  step: StepConfig;
  answers: Answers;
  setAnswer: SetAnswer;
  locale: Locale;
}) {
  switch (step.kind) {
    case "name-split":
      return (
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <Input
              placeholder={ui.firstNamePlaceholder[locale]}
              value={answers.firstName}
              onChange={(e) => setAnswer("firstName", e.target.value)}
              autoFocus
            />
            <p className="mt-1 text-xs text-neutral-400">
              {ui.firstNamePlaceholder[locale]}
            </p>
          </div>
          <div className="flex-1">
            <Input
              placeholder={ui.lastNamePlaceholder[locale]}
              value={answers.lastName}
              onChange={(e) => setAnswer("lastName", e.target.value)}
            />
            <p className="mt-1 text-xs text-neutral-400">
              {ui.lastNamePlaceholder[locale]}
            </p>
          </div>
        </div>
      );

    case "checkbox-group": {
      const key = step.checkboxKey;
      const selected = key ? answers[key] : [];
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          {step.options?.map((option) => {
            const checked = selected.includes(option);
            return (
              <label
                key={option}
                className="flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-3 text-base text-neutral-700"
              >
                <Checkbox
                  checked={checked}
                  onChange={(e) => {
                    if (!key) return;
                    const next = e.target.checked
                      ? [...selected, option]
                      : selected.filter((v) => v !== option);
                    setAnswer(key, next);
                  }}
                />
                {option}
              </label>
            );
          })}
        </div>
      );
    }

    case "radio":
      return (
        <div className="flex flex-row gap-3">
          {step.options?.map((option) => {
            const checked = step.answerKey
              ? answers[step.answerKey] === option
              : false;
            return (
              <label
                key={option}
                className={cn(
                  "flex flex-1 cursor-pointer items-center justify-center gap-3 rounded-md border px-4 py-3 text-neutral-700",
                  checked ? "border-[#ff2d78]" : "border-neutral-300"
                )}
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                    checked ? "border-[#ff2d78]" : "border-neutral-400"
                  )}
                >
                  {checked && (
                    <span className="h-2 w-2 rounded-full bg-[#ff2d78]" />
                  )}
                </span>
                <input
                  type="radio"
                  name={step.id}
                  value={option}
                  checked={checked}
                  onChange={() =>
                    step.answerKey && setAnswer(step.answerKey, option)
                  }
                  className="sr-only"
                />
                {option}
              </label>
            );
          })}
        </div>
      );

    case "select":
      return (
        <Select
          value={step.answerKey ? answers[step.answerKey] : ""}
          onChange={(e) =>
            step.answerKey && setAnswer(step.answerKey, e.target.value)
          }
          autoFocus
        >
          <option value="" disabled>
            {ui.selectPlaceholder[locale]}
          </option>
          {step.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      );

    case "tel":
      return (
        <PhoneInput
          digits={step.answerKey ? answers[step.answerKey] : ""}
          onChange={(digits) => step.answerKey && setAnswer(step.answerKey, digits)}
        />
      );

    case "text":
    default:
      return (
        <Input
          type="text"
          value={step.answerKey ? answers[step.answerKey] : ""}
          onChange={(e) =>
            step.answerKey && setAnswer(step.answerKey, e.target.value)
          }
          autoFocus
        />
      );
  }
}

export function QuestionCard({
  step,
  answers,
  setAnswer,
  error,
  locale,
  canGoPrevious,
  isLastStep,
  pending,
  onNext,
  onPrevious,
}: {
  step: StepConfig;
  answers: Answers;
  setAnswer: SetAnswer;
  error?: string;
  locale: Locale;
  canGoPrevious: boolean;
  isLastStep: boolean;
  pending: boolean;
  onNext: () => void;
  onPrevious: () => void;
}) {
  // Medidas exactas pedidas: los pasos de un solo campo (texto/teléfono/
  // nombre) y el de Cargar-o-Descargar tienen un alto TOTAL fijo (tarjeta +
  // botones). Los de checkboxes (muchas opciones) se quedan con el alto
  // natural de siempre -- no llevan número fijo.
  const FIXED_TOTAL_HEIGHT: Partial<Record<typeof step.kind, number>> = {
    tel: 200,
    text: 230,
    radio: 240,
  };
  const fixedHeight = FIXED_TOTAL_HEIGHT[step.kind];

  return (
    <div
      className="mx-auto flex w-full max-w-[800px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      style={fixedHeight ? { height: `${fixedHeight}px` } : undefined}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onNext();
        }}
        className="flex flex-1 flex-col overflow-hidden"
      >
        {/* Como en el Jotform real: el título siempre va arriba del campo,
            nunca al lado. Los pasos con alto fijo (ver FIXED_TOTAL_HEIGHT)
            reparten ese alto entre este cuerpo y la franja de botones de
            abajo; los demás (checkboxes) usan min-h-[160px] como piso y
            crecen con el contenido, igual que antes. */}
        <div
          className={cn(
            "flex flex-col justify-center px-6 text-center sm:px-10",
            fixedHeight ? "flex-1 overflow-hidden py-3" : "min-h-[160px] py-6"
          )}
        >
          <h2
            className={cn(
              "font-medium text-neutral-800",
              fixedHeight ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"
            )}
          >
            {step.title[locale]}
            <span className="ml-1 text-red-500">*</span>
          </h2>
          {step.subtitle && (
            <p className="mt-1 text-neutral-400">{step.subtitle[locale]}</p>
          )}

          <div className={cn("text-left", fixedHeight ? "mt-2" : "mt-4")}>
            <Field step={step} answers={answers} setAnswer={setAnswer} locale={locale} />
          </div>

          {/* Siempre montado (con o sin texto) para reservar el espacio y
              que el error no empuje el layout. */}
          <p
            className={cn(
              "text-red-600",
              fixedHeight ? "mt-1 min-h-[1.25rem] text-xs" : "mt-3 min-h-[1.5rem] text-sm"
            )}
          >
            {error ?? ""}
          </p>
        </div>

        <div className="grid grid-cols-2">
          <button
            type="button"
            onClick={onPrevious}
            disabled={!canGoPrevious}
            className="flex items-center justify-start gap-2 bg-[#e0206a] px-6 py-5 font-semibold uppercase tracking-wide text-white/70 transition-colors enabled:hover:bg-[#c81b5d] disabled:cursor-not-allowed disabled:text-white/40"
          >
            <span aria-hidden>←</span> {ui.previous[locale]}
          </button>
          <button
            type="submit"
            disabled={pending}
            className="flex items-center justify-end gap-2 bg-[#ff2d78] px-6 py-5 font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#e6266c] disabled:opacity-60"
          >
            {pending ? ui.sending[locale] : isLastStep ? ui.submit[locale] : ui.next[locale]}{" "}
            <span aria-hidden>→</span>
          </button>
        </div>
      </form>
    </div>
  );
}
