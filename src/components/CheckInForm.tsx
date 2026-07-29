"use client";

import { useRef, useState, type FormEvent } from "react";
import { checkInCreateSchema } from "@/lib/validation";
import {
  LOADING_TYPES,
  PRODUCE_TYPES,
  LOAD_ACCOMMODATION_OPTIONS,
} from "@/lib/options";
import { serializeMultiSelect, formText } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

// URL del Web App de Google Apps Script (Implementar > Nueva implementación).
// Se define al hacer el build -- ver README para cómo configurarla en Netlify.
const APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL ?? "";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="mt-1 text-sm text-red-600">{messages[0]}</p>;
}

type Status = "idle" | "submitting" | "success" | "error";

export function CheckInForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>(
    {}
  );
  const [status, setStatus] = useState<Status>("idle");
  const [produceType, setProduceType] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const parsed = checkInCreateSchema.safeParse({
      driverName: formText(formData, "driverName"),
      truckOrCompanyName: formText(formData, "truckOrCompanyName"),
      trailerPlates: formText(formData, "trailerPlates"),
      driversLicense: formText(formData, "driversLicense"),
      phoneNumber: formText(formData, "phoneNumber"),
      loadingType: formText(formData, "loadingType"),
      unitNumber: formText(formData, "unitNumber"),
      produceType: formText(formData, "produceType"),
      produceTypeOther: formText(formData, "produceTypeOther"),
      loadAccommodation: formData.getAll("loadAccommodation").map(String),
      spNumberOrder: formText(formData, "spNumberOrder"),
      spNumberOrder2: formText(formData, "spNumberOrder2"),
    });

    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors);
      setStatus("error");
      return;
    }
    setErrors({});

    if (!APPS_SCRIPT_URL) {
      console.error(
        "Falta configurar NEXT_PUBLIC_APPS_SCRIPT_URL -- ver README."
      );
      setStatus("error");
      return;
    }

    setStatus("submitting");
    const data = parsed.data;

    try {
      // mode: "no-cors" + text/plain: Apps Script no maneja bien CORS con
      // JSON, así este es el patrón estándar para mandarle datos desde el
      // navegador. Efecto: no podemos leer la respuesta (no sabemos con
      // certeza si Apps Script tuvo éxito), solo si la petición salió.
      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          driverName: data.driverName,
          truckOrCompanyName: data.truckOrCompanyName,
          trailerPlates: data.trailerPlates,
          driversLicense: data.driversLicense,
          phoneNumber: data.phoneNumber,
          loadingType: data.loadingType,
          unitNumber: data.unitNumber,
          produceType: data.produceType,
          produceTypeOther: data.produceTypeOther ?? "",
          loadAccommodation: serializeMultiSelect(data.loadAccommodation),
          spNumberOrder: data.spNumberOrder ?? "",
          spNumberOrder2: data.spNumberOrder2 ?? "",
        }),
      });
      setStatus("success");
      formRef.current?.reset();
      setProduceType("");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">
              Check-in registrado
            </h2>
            <p className="mt-1 text-neutral-600">
              Espera indicaciones del personal de la bodega.
            </p>
          </div>
          <Button onClick={() => setStatus("idle")} variant="secondary">
            Registrar otro check-in
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      {status === "error" && !APPS_SCRIPT_URL && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          El formulario todavía no está conectado a la hoja de cálculo
          (falta configurar la URL del Apps Script). Avísale a quien
          administra la página.
        </div>
      )}
      {status === "error" && APPS_SCRIPT_URL && Object.keys(errors).length === 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          No se pudo enviar el check-in. Revisa tu conexión a internet e
          intenta de nuevo.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Datos del chofer y camión</CardTitle>
          <CardDescription>
            Información de quien conduce y de la unidad.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="driverName">Nombre y apellido</Label>
            <Input id="driverName" name="driverName" required autoFocus />
            <FieldError messages={errors.driverName} />
          </div>
          <div>
            <Label htmlFor="truckOrCompanyName">
              Nombre del camión / Empresa
            </Label>
            <Input id="truckOrCompanyName" name="truckOrCompanyName" required />
            <FieldError messages={errors.truckOrCompanyName} />
          </div>
          <div>
            <Label htmlFor="trailerPlates">Placas del remolque</Label>
            <Input id="trailerPlates" name="trailerPlates" required />
            <FieldError messages={errors.trailerPlates} />
          </div>
          <div>
            <Label htmlFor="driversLicense">Licencia de conducir</Label>
            <Input id="driversLicense" name="driversLicense" required />
            <FieldError messages={errors.driversLicense} />
          </div>
          <div>
            <Label htmlFor="phoneNumber">Teléfono</Label>
            <Input id="phoneNumber" name="phoneNumber" type="tel" required />
            <FieldError messages={errors.phoneNumber} />
          </div>
          <div>
            <Label htmlFor="unitNumber"># Económico o # de Caja</Label>
            <Input id="unitNumber" name="unitNumber" required />
            <FieldError messages={errors.unitNumber} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalles de la carga</CardTitle>
          <CardDescription>
            ¿Qué viene a hacer y qué trae el camión?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label>¿Viene a cargar o descargar?</Label>
            <div className="grid grid-cols-2 gap-3">
              {LOADING_TYPES.map((option) => (
                <label
                  key={option}
                  className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-neutral-300 bg-white px-4 py-4 text-center text-base font-medium text-neutral-800 transition-colors has-[:checked]:border-neutral-900 has-[:checked]:bg-neutral-900 has-[:checked]:text-white"
                >
                  <input
                    type="radio"
                    name="loadingType"
                    value={option}
                    required
                    className="sr-only"
                  />
                  {option}
                </label>
              ))}
            </div>
            <FieldError messages={errors.loadingType} />
          </div>

          <div>
            <Label htmlFor="produceType">Qué viene a descargar</Label>
            <Select
              id="produceType"
              name="produceType"
              required
              value={produceType}
              onChange={(e) => setProduceType(e.target.value)}
            >
              <option value="" disabled>
                Selecciona un producto…
              </option>
              {PRODUCE_TYPES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
            <FieldError messages={errors.produceType} />
          </div>

          {produceType === "Otro" && (
            <div>
              <Label htmlFor="produceTypeOther">Especifica el producto</Label>
              <Input id="produceTypeOther" name="produceTypeOther" required />
              <FieldError messages={errors.produceTypeOther} />
            </div>
          )}

          <div>
            <Label>Acomodo de la carga</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {LOAD_ACCOMMODATION_OPTIONS.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-800"
                >
                  <Checkbox name="loadAccommodation" value={option} />
                  {option}
                </label>
              ))}
            </div>
            <FieldError messages={errors.loadAccommodation} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="spNumberOrder">SP # / Order</Label>
              <Input id="spNumberOrder" name="spNumberOrder" />
            </div>
            <div>
              <Label htmlFor="spNumberOrder2">SP # / Order #</Label>
              <Input id="spNumberOrder2" name="spNumberOrder2" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={status === "submitting"}
      >
        {status === "submitting" ? "Registrando…" : "Registrar Check-In"}
      </Button>
    </form>
  );
}
