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
          <Input
            placeholder={ui.firstNamePlaceholder[locale]}
            value={answers.firstName}
            onChange={(e) => setAnswer("firstName", e.target.value)}
            autoFocus
          />
          <Input
            placeholder={ui.lastNamePlaceholder[locale]}
            value={answers.lastName}
            onChange={(e) => setAnswer("lastName", e.target.value)}
          />
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
        <div className="flex flex-col gap-2">
          {step.options?.map((option) => {
            const checked = step.answerKey
              ? answers[step.answerKey] === option
              : false;
            return (
              <label
                key={option}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 text-neutral-700",
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
  // Los pasos que abren el teclado del iPad (texto/teléfono/nombre) usan un
  // acomodo horizontal (título a la izquierda, campo a la derecha) en vez de
  // apilado -- así la tarjeta se queda angosta de alto y el botón Next nunca
  // termina empujado detrás del teclado ni hay que buscarlo. Los pasos de
  // opciones (radio/select/checkboxes) no abren teclado, así que pueden
  // seguir apilados y crecer con .question-card-body (ver globals.css).
  const opensKeyboard =
    step.kind === "text" || step.kind === "tel" || step.kind === "name-split";

  return (
    <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onNext();
        }}
      >
        {opensKeyboard ? (
          <div className="flex min-h-[180px] flex-col justify-center gap-4 px-6 py-8 text-center sm:min-h-[160px] sm:flex-row sm:items-center sm:gap-10 sm:px-12 sm:text-left">
            <div className="shrink-0 sm:w-60">
              <h2 className="text-2xl font-medium text-neutral-800 sm:text-3xl">
                {step.title[locale]}
                <span className="ml-1 text-red-500">*</span>
              </h2>
              {step.subtitle && (
                <p className="mt-1 text-neutral-400">{step.subtitle[locale]}</p>
              )}
            </div>

            <div className="flex-1 text-left">
              <Field step={step} answers={answers} setAnswer={setAnswer} locale={locale} />
              {/* Siempre montado (con o sin texto) para reservar el espacio y
                  que el error no empuje el layout. */}
              <p className="mt-2 min-h-[1.5rem] text-sm text-red-600">
                {error ?? ""}
              </p>
            </div>
          </div>
        ) : (
          // Alto mínimo: crece cuando hay espacio (ver .question-card-body en
          // globals.css, usa dvh) pero nunca baja de 240px. Estos pasos no
          // abren teclado, así que no hay riesgo de tapar los botones.
          <div className="question-card-body flex min-h-[240px] flex-col justify-center px-6 py-10 text-center sm:px-12">
            <h2 className="text-2xl font-medium text-neutral-800 sm:text-3xl">
              {step.title[locale]}
              <span className="ml-1 text-red-500">*</span>
            </h2>
            {step.subtitle && (
              <p className="mt-1 text-neutral-400">{step.subtitle[locale]}</p>
            )}

            <div className="mt-8 text-left">
              <Field step={step} answers={answers} setAnswer={setAnswer} locale={locale} />
            </div>

            <p className="mt-3 min-h-[1.5rem] text-sm text-red-600">
              {error ?? ""}
            </p>
          </div>
        )}

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
