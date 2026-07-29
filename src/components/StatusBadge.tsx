import { Badge } from "@/components/ui/badge";
import { CHECKIN_STATUS } from "@/lib/options";

export function StatusBadge({ status }: { status: string }) {
  if (status === CHECKIN_STATUS.CHECKED_OUT) {
    return <Badge variant="success">Cerrado</Badge>;
  }
  return <Badge variant="warning">Abierto</Badge>;
}
