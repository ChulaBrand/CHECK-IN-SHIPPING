"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  updateRecord,
  completeCheckIn,
  type UpdateRecordState,
} from "@/app/staff/records/[id]/actions";
import {
  LOADING_TYPES,
  PRODUCE_TYPES,
  LOAD_ACCOMMODATION_OPTIONS,
  CHECKIN_STATUS,
} from "@/lib/options";
import { parseMultiSelect, toDateTimeLocalValue, formatDateTime } from "@/lib/utils";
import type { CheckIn } from "@/generated/prisma/client";
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
  CardFooter,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="mt-1 text-sm text-red-600">{messages[0]}</p>;
}

const initialState: UpdateRecordState = undefined;

function FormButtons({
  canComplete,
  completeAction,
}: {
  canComplete: boolean;
  completeAction: (formData: FormData) => void;
}) {
  const { pending } = useFormStatus();
  return (
    <>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Guardando…" : "Guardar Cambios"}
      </Button>
      {canComplete && (
        <Button type="submit" formAction={completeAction} disabled={pending}>
          {pending ? "Procesando…" : "Completar Check-In"}
        </Button>
      )}
    </>
  );
}

export function RecordEditForm({ checkIn }: { checkIn: CheckIn }) {
  const updateRecordWithId = updateRecord.bind(null, checkIn.id);
  const completeCheckInWithId = completeCheckIn.bind(null, checkIn.id);
  const [state, formAction] = useActionState(updateRecordWithId, initialState);

  const [produceType, setProduceType] = useState(checkIn.produceType);
  const selectedAccommodation = parseMultiSelect(checkIn.loadAccommodation);

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Registro #{checkIn.id}</CardTitle>
            <CardDescription>
              Check-in el {formatDateTime(checkIn.createdAt)}
              {checkIn.checkOutTime &&
                ` · Salida el ${formatDateTime(checkIn.checkOutTime)}`}
            </CardDescription>
          </div>
          <StatusBadge status={checkIn.status} />
        </CardHeader>
      </Card>

      {state && "success" in state && state.success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
          Cambios guardados.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Datos del chofer y camión</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="driverName">Nombre y apellido</Label>
            <Input
              id="driverName"
              name="driverName"
              defaultValue={checkIn.driverName}
              required
            />
            <FieldError messages={state && "errors" in state ? state.errors.driverName : undefined} />
          </div>
          <div>
            <Label htmlFor="truckOrCompanyName">
              Nombre del camión / Empresa
            </Label>
            <Input
              id="truckOrCompanyName"
              name="truckOrCompanyName"
              defaultValue={checkIn.truckOrCompanyName}
              required
            />
            <FieldError messages={state && "errors" in state ? state.errors.truckOrCompanyName : undefined} />
          </div>
          <div>
            <Label htmlFor="trailerPlates">Placas del remolque</Label>
            <Input
              id="trailerPlates"
              name="trailerPlates"
              defaultValue={checkIn.trailerPlates}
              required
            />
            <FieldError messages={state && "errors" in state ? state.errors.trailerPlates : undefined} />
          </div>
          <div>
            <Label htmlFor="driversLicense">Licencia de conducir</Label>
            <Input
              id="driversLicense"
              name="driversLicense"
              defaultValue={checkIn.driversLicense}
              required
            />
            <FieldError messages={state && "errors" in state ? state.errors.driversLicense : undefined} />
          </div>
          <div>
            <Label htmlFor="phoneNumber">Teléfono</Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              defaultValue={checkIn.phoneNumber}
              required
            />
            <FieldError messages={state && "errors" in state ? state.errors.phoneNumber : undefined} />
          </div>
          <div>
            <Label htmlFor="unitNumber"># Económico o # de Caja</Label>
            <Input
              id="unitNumber"
              name="unitNumber"
              defaultValue={checkIn.unitNumber}
              required
            />
            <FieldError messages={state && "errors" in state ? state.errors.unitNumber : undefined} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalles de la carga</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label>¿Viene a cargar o descargar?</Label>
            <div className="grid grid-cols-2 gap-3">
              {LOADING_TYPES.map((option) => (
                <label
                  key={option}
                  className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-neutral-300 bg-white px-4 py-3 text-center text-sm font-medium text-neutral-800 has-[:checked]:border-neutral-900 has-[:checked]:bg-neutral-900 has-[:checked]:text-white"
                >
                  <input
                    type="radio"
                    name="loadingType"
                    value={option}
                    defaultChecked={checkIn.loadingType === option}
                    required
                    className="sr-only"
                  />
                  {option}
                </label>
              ))}
            </div>
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
              {PRODUCE_TYPES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </div>

          {produceType === "Otro" && (
            <div>
              <Label htmlFor="produceTypeOther">Especifica el producto</Label>
              <Input
                id="produceTypeOther"
                name="produceTypeOther"
                defaultValue={checkIn.produceTypeOther ?? ""}
                required
              />
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
                  <Checkbox
                    name="loadAccommodation"
                    value={option}
                    defaultChecked={selectedAccommodation.includes(option)}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="spNumberOrder">SP # / Order</Label>
              <Input
                id="spNumberOrder"
                name="spNumberOrder"
                defaultValue={checkIn.spNumberOrder ?? ""}
              />
            </div>
            <div>
              <Label htmlFor="spNumberOrder2">SP # / Order #</Label>
              <Input
                id="spNumberOrder2"
                name="spNumberOrder2"
                defaultValue={checkIn.spNumberOrder2 ?? ""}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal de la bodega</CardTitle>
          <CardDescription>
            Completa estos datos para cerrar el registro.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="entryTime">Hora de entrada</Label>
            <Input
              id="entryTime"
              name="entryTime"
              type="datetime-local"
              defaultValue={toDateTimeLocalValue(checkIn.entryTime)}
            />
          </div>
          <div>
            <Label htmlFor="forkliftAssigned">Forklift asignado</Label>
            <Input
              id="forkliftAssigned"
              name="forkliftAssigned"
              defaultValue={checkIn.forkliftAssigned ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="dockAssigned">Dock asignado</Label>
            <Input
              id="dockAssigned"
              name="dockAssigned"
              defaultValue={checkIn.dockAssigned ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="palletCount"># de Tarimas</Label>
            <Input
              id="palletCount"
              name="palletCount"
              type="number"
              min={0}
              step={1}
              defaultValue={checkIn.palletCount ?? ""}
            />
            <FieldError messages={state && "errors" in state ? state.errors.palletCount : undefined} />
          </div>
        </CardContent>
        <CardFooter>
          <FormButtons
            canComplete={checkIn.status === CHECKIN_STATUS.OPEN}
            completeAction={completeCheckInWithId}
          />
        </CardFooter>
      </Card>
    </form>
  );
}
