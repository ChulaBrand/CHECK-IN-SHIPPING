"use client";

import { useCallback, useEffect, useState } from "react";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { QuestionCard } from "@/components/QuestionCard";
import { ProgressDots } from "@/components/ProgressDots";
import { LanguageToggle } from "@/components/LanguageToggle";
import { emptyAnswers, getActiveSteps, type Answers } from "@/lib/wizardSteps";
import { serializeMultiSelect } from "@/lib/utils";
import { formatPhoneMask } from "@/lib/phone";
import { assetPath } from "@/lib/asset";
import { ui, type Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

function CornerLogo() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={assetPath("/chula-brand-logo.png")}
      alt="Chula Brand"
      className="fixed left-6 top-6 h-20 w-auto"
    />
  );
}

// URL del Web App de Google Apps Script (Implementar > Nueva implementación).
// Se define al hacer el build -- ver README para cómo configurarla.
const APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL ?? "";

// Si el envío falla (wifi inestable en la caseta), reintenta un par de veces
// antes de darnos por vencidos -- así una racha corta sin señal no pierde un
// check-in real.
const SUBMIT_ATTEMPTS = 3;
const SUBMIT_TIMEOUT_MS = 10_000;

// Cuánto tiempo sin tocar la pantalla en una pregunta antes de recargar la
// página sola -- evita que se quede un formulario a medio llenar bloqueando
// al siguiente camión, y de paso limpia cualquier estado raro de la pestaña.
const IDLE_RELOAD_MS = 3 * 60 * 1000;

// Cuánto se queda la pantalla de éxito antes de volver sola al inicio.
const SUCCESS_RETURN_MS = 5000;

type Phase = "welcome" | "question" | "success";

async function submitWithRetry(
  url: string,
  payload: Record<string, string>
): Promise<boolean> {
  for (let attempt = 1; attempt <= SUBMIT_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SUBMIT_TIMEOUT_MS);
    try {
      // mode: "no-cors" + text/plain: Apps Script no maneja bien CORS con
      // JSON, este es el patrón estándar para mandarle datos desde el
      // navegador. Efecto: no podemos leer la respuesta (no sabemos con
      // certeza si Apps Script tuvo éxito), solo si la petición salió.
      await fetch(url, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      return true;
    } catch {
      if (attempt === SUBMIT_ATTEMPTS) return false;
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    } finally {
      clearTimeout(timeout);
    }
  }
  return false;
}

export function CheckInForm() {
  const [locale, setLocale] = useState<Locale>("en");
  const [phase, setPhase] = useState<Phase>("welcome");
  const [answers, setAnswers] = useState<Answers>(emptyAnswers);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);
  const [submitFailed, setSubmitFailed] = useState(false);

  const steps = getActiveSteps(answers);
  const currentStep = steps[currentIndex];

  function setAnswer<K extends keyof Answers>(key: K, value: Answers[K]) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setError(undefined);
  }

  const reset = useCallback(() => {
    setAnswers(emptyAnswers);
    setCurrentIndex(0);
    setError(undefined);
    setSubmitFailed(false);
    setPhase("welcome");
  }, []);

  // Vuelve sola al inicio unos segundos después de mostrar éxito -- es un
  // kiosco, el siguiente chofer no debería tener que tocar nada.
  useEffect(() => {
    if (phase !== "success") return;
    const timer = setTimeout(reset, SUCCESS_RETURN_MS);
    return () => clearTimeout(timer);
  }, [phase, reset]);

  // Si nadie toca la pantalla mientras hay una pregunta a medio llenar,
  // recarga la página sola -- así nunca se queda un formulario abandonado
  // bloqueando al siguiente camión.
  useEffect(() => {
    if (phase !== "question") return;
    let idleTimer: ReturnType<typeof setTimeout>;
    function scheduleReload() {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => window.location.reload(), IDLE_RELOAD_MS);
    }
    const events: (keyof WindowEventMap)[] = [
      "pointerdown",
      "keydown",
      "touchstart",
    ];
    events.forEach((eventName) =>
      window.addEventListener(eventName, scheduleReload)
    );
    scheduleReload();
    return () => {
      clearTimeout(idleTimer);
      events.forEach((eventName) =>
        window.removeEventListener(eventName, scheduleReload)
      );
    };
  }, [phase]);

  async function submit() {
    setSubmitFailed(false);

    if (!APPS_SCRIPT_URL) {
      console.error(
        "Falta configurar NEXT_PUBLIC_APPS_SCRIPT_URL -- ver README."
      );
      setSubmitFailed(true);
      return;
    }

    setPending(true);
    const ok = await submitWithRetry(APPS_SCRIPT_URL, {
      driverName: `${answers.firstName} ${answers.lastName}`.trim(),
      truckOrCompanyName: answers.truckOrCompanyName,
      trailerPlates: answers.trailerPlates,
      driversLicense: answers.driversLicense,
      phoneNumber: formatPhoneMask(answers.phoneNumber),
      loadingType: answers.loadingType,
      unitNumber: answers.unitNumber,
      produceTypes: serializeMultiSelect(answers.produceTypes),
      produceTypeOther: answers.produceTypeOther,
      loadAccommodation: serializeMultiSelect(answers.loadAccommodation),
      spNumberOrder2: answers.spNumberOrder2,
    });
    setPending(false);
    if (ok) {
      setPhase("success");
    } else {
      setSubmitFailed(true);
    }
  }

  function handleNext() {
    const validationError = currentStep.validate(answers, locale);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(undefined);
    if (currentIndex + 1 >= steps.length) {
      submit();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  function handlePrevious() {
    setError(undefined);
    setCurrentIndex((i) => Math.max(0, i - 1));
  }

  return (
    <>
      <LanguageToggle locale={locale} onChange={setLocale} />

      {phase === "welcome" && (
        <WelcomeScreen locale={locale} onStart={() => setPhase("question")} />
      )}

      {phase === "success" && (
        <>
          <CornerLogo />
          <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 px-8 py-16 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500">
                <svg
                  viewBox="0 0 24 24"
                  className="h-10 w-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  aria-hidden
                >
                  <path
                    d="M5 13l4 4L19 7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-neutral-900 sm:text-3xl">
                {ui.successTitle[locale]}
              </h2>
              <p className="text-neutral-600">{ui.successSubtitle[locale]}</p>
              <p className="text-sm text-neutral-400">
                {ui.successAutoReturn[locale]}
              </p>
              <Button onClick={reset} variant="secondary">
                {ui.registerAnother[locale]}
              </Button>
            </div>
          </div>
        </>
      )}

      {phase === "question" && (
        <div>
          <CornerLogo />
          {submitFailed && (
            <div className="mx-auto mb-4 w-full max-w-4xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-red-800">
              {APPS_SCRIPT_URL
                ? ui.failedToSend[locale]
                : ui.notConnected[locale]}
            </div>
          )}
          <QuestionCard
            key={currentStep.id}
            step={currentStep}
            answers={answers}
            setAnswer={setAnswer}
            error={error}
            locale={locale}
            canGoPrevious={currentIndex > 0}
            isLastStep={currentIndex === steps.length - 1}
            pending={pending}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
          <ProgressDots total={steps.length} currentIndex={currentIndex} />
        </div>
      )}
    </>
  );
}
