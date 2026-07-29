"use client";

import type { StepConfig, Answers } from "@/lib/wizardSteps";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type SetAnswer = <K extends keyof Answers>(key: K, value: Answers[K]) => void;

function Field({
  step,
  answers,
  setAnswer,
}: {
  step: StepConfig;
  answers: Answers;
  setAnswer: SetAnswer;
}) {
  switch (step.kind) {
    case "name-split":
      return (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="First Name"
            value={answers.firstName}
            onChange={(e) => setAnswer("firstName", e.target.value)}
            autoFocus
          />
          <Input
            placeholder="Last Name"
            value={answers.lastName}
            onChange={(e) => setAnswer("lastName", e.target.value)}
          />
        </div>
      );

    case "checkbox-group":
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          {step.options?.map((option) => {
            const checked = answers.loadAccommodation.includes(option);
            return (
              <label
                key={option}
                className="flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-2.5 text-sm text-neutral-700"
              >
                <Checkbox
                  checked={checked}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...answers.loadAccommodation, option]
                      : answers.loadAccommodation.filter((v) => v !== option);
                    setAnswer("loadAccommodation", next);
                  }}
                />
                {option}
              </label>
            );
          })}
        </div>
      );

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
            Selecciona…
          </option>
          {step.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      );

    case "tel":
    case "text":
    default:
      return (
        <Input
          type={step.kind === "tel" ? "tel" : "text"}
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
  canGoPrevious: boolean;
  isLastStep: boolean;
  pending: boolean;
  onNext: () => void;
  onPrevious: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onNext();
        }}
      >
        <div className="px-6 py-10 text-center sm:px-10">
          <h2 className="text-2xl font-medium text-neutral-800 sm:text-3xl">
            {step.title}
            <span className="ml-1 text-red-500">*</span>
          </h2>
          {step.subtitle && (
            <p className="mt-1 text-neutral-400">{step.subtitle}</p>
          )}

          <div className="mt-8 text-left">
            <Field step={step} answers={answers} setAnswer={setAnswer} />
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>

        <div className="grid grid-cols-2">
          <button
            type="button"
            onClick={onPrevious}
            disabled={!canGoPrevious}
            className="flex items-center justify-start gap-2 bg-[#e0206a] px-6 py-5 font-semibold uppercase tracking-wide text-white/70 transition-colors enabled:hover:bg-[#c81b5d] disabled:cursor-not-allowed disabled:text-white/40"
          >
            <span aria-hidden>←</span> Previous
          </button>
          <button
            type="submit"
            disabled={pending}
            className="flex items-center justify-end gap-2 bg-[#ff2d78] px-6 py-5 font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#e6266c] disabled:opacity-60"
          >
            {pending ? "Enviando…" : isLastStep ? "Submit" : "Next"}{" "}
            <span aria-hidden>→</span>
          </button>
        </div>
      </form>
    </div>
  );
}
