"use client";

import { useState } from "react";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { QuestionCard } from "@/components/QuestionCard";
import { ProgressDots } from "@/components/ProgressDots";
import { emptyAnswers, getActiveSteps, type Answers } from "@/lib/wizardSteps";
import { serializeMultiSelect } from "@/lib/utils";
import { assetPath } from "@/lib/asset";
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

type Phase = "welcome" | "question" | "success";

export function CheckInForm() {
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
    try {
      // mode: "no-cors" + text/plain: Apps Script no maneja bien CORS con
      // JSON, este es el patrón estándar para mandarle datos desde el
      // navegador. Efecto: no podemos leer la respuesta (no sabemos con
      // certeza si Apps Script tuvo éxito), solo si la petición salió.
      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          driverName: `${answers.firstName} ${answers.lastName}`.trim(),
          truckOrCompanyName: answers.truckOrCompanyName,
          trailerPlates: answers.trailerPlates,
          driversLicense: answers.driversLicense,
          phoneNumber: answers.phoneNumber,
          loadingType: answers.loadingType,
          unitNumber: answers.unitNumber,
          produceTypes: serializeMultiSelect(answers.produceTypes),
          produceTypeOther: answers.produceTypeOther,
          loadAccommodation: serializeMultiSelect(answers.loadAccommodation),
          spNumberOrder2: answers.spNumberOrder2,
        }),
      });
      setPhase("success");
    } catch {
      setSubmitFailed(true);
    } finally {
      setPending(false);
    }
  }

  function handleNext() {
    const validationError = currentStep.validate(answers);
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

  function reset() {
    setAnswers(emptyAnswers);
    setCurrentIndex(0);
    setError(undefined);
    setSubmitFailed(false);
    setPhase("welcome");
  }

  if (phase === "welcome") {
    return <WelcomeScreen onStart={() => setPhase("question")} />;
  }

  if (phase === "success") {
    return (
      <>
        <CornerLogo />
        <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex flex-col items-center gap-4 px-8 py-16 text-center">
            <h2 className="text-2xl font-semibold text-neutral-900">
              Check-in registrado
            </h2>
            <p className="text-neutral-600">
              Espera indicaciones del personal de la bodega.
            </p>
            <Button onClick={reset} variant="secondary">
              Registrar otro check-in
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div>
      <CornerLogo />
      {submitFailed && (
        <div className="mx-auto mb-4 w-full max-w-2xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-red-800">
          {APPS_SCRIPT_URL
            ? "No se pudo enviar. Revisa tu conexión e intenta de nuevo."
            : "El formulario todavía no está conectado (falta configurar la URL del Apps Script)."}
        </div>
      )}
      <QuestionCard
        key={currentStep.id}
        step={currentStep}
        answers={answers}
        setAnswer={setAnswer}
        error={error}
        canGoPrevious={currentIndex > 0}
        isLastStep={currentIndex === steps.length - 1}
        pending={pending}
        onNext={handleNext}
        onPrevious={handlePrevious}
      />
      <ProgressDots total={steps.length} currentIndex={currentIndex} />
    </div>
  );
}
