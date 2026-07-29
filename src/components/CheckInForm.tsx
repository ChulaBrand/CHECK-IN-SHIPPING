"use client";

import { useActionState, useState } from "react";
import { createCheckIn, type CreateCheckInState } from "@/app/actions";
import {
  LOADING_TYPES,
  PRODUCE_TYPES,
  LOAD_ACCOMMODATION_OPTIONS,
} from "@/lib/options";
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

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="mt-1 text-sm text-red-600">{messages[0]}</p>;
}

const initialState: CreateCheckInState = undefined;

export function CheckInForm() {
  const [state, formAction, pending] = useActionState(
    createCheckIn,
    initialState
  );
  const [produceType, setProduceType] = useState("");

  return (
    <form action={formAction} className="space-y-6">
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
            <FieldError messages={state?.errors?.driverName} />
          </div>
          <div>
            <Label htmlFor="truckOrCompanyName">
              Nombre del camión / Empresa
            </Label>
            <Input id="truckOrCompanyName" name="truckOrCompanyName" required />
            <FieldError messages={state?.errors?.truckOrCompanyName} />
          </div>
          <div>
            <Label htmlFor="trailerPlates">Placas del remolque</Label>
            <Input id="trailerPlates" name="trailerPlates" required />
            <FieldError messages={state?.errors?.trailerPlates} />
          </div>
          <div>
            <Label htmlFor="driversLicense">Licencia de conducir</Label>
            <Input id="driversLicense" name="driversLicense" required />
            <FieldError messages={state?.errors?.driversLicense} />
          </div>
          <div>
            <Label htmlFor="phoneNumber">Teléfono</Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              required
            />
            <FieldError messages={state?.errors?.phoneNumber} />
          </div>
          <div>
            <Label htmlFor="unitNumber"># Económico o # de Caja</Label>
            <Input id="unitNumber" name="unitNumber" required />
            <FieldError messages={state?.errors?.unitNumber} />
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
            <FieldError messages={state?.errors?.loadingType} />
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
            <FieldError messages={state?.errors?.produceType} />
          </div>

          {produceType === "Otro" && (
            <div>
              <Label htmlFor="produceTypeOther">Especifica el producto</Label>
              <Input
                id="produceTypeOther"
                name="produceTypeOther"
                required
              />
              <FieldError messages={state?.errors?.produceTypeOther} />
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
            <FieldError messages={state?.errors?.loadAccommodation} />
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

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Registrando…" : "Registrar Check-In"}
      </Button>
    </form>
  );
}
