import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CHECKIN_STATUS } from "@/lib/options";

export function StaffTableFilters({
  q,
  status,
}: {
  q: string;
  status: string;
}) {
  return (
    <form
      method="GET"
      className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white p-4"
    >
      <div className="min-w-[220px] flex-1">
        <Label htmlFor="q">Buscar</Label>
        <Input
          id="q"
          name="q"
          defaultValue={q}
          placeholder="Chofer, camión o placas…"
        />
      </div>
      <div>
        <Label htmlFor="status">Estado</Label>
        <Select id="status" name="status" defaultValue={status} className="w-40">
          <option value="">Todos</option>
          <option value={CHECKIN_STATUS.OPEN}>Abiertos</option>
          <option value={CHECKIN_STATUS.CHECKED_OUT}>Cerrados</option>
        </Select>
      </div>
      <Button type="submit" variant="secondary">
        Buscar
      </Button>
    </form>
  );
}
