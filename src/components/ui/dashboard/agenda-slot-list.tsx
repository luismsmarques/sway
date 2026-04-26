import { Ellipsis } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slot } from "./types";

type AgendaSlotListProps = {
  slots: Slot[];
  formatTime: (date: Date) => string;
  badgeStyles: Record<"PRIVATE" | "GROUP", string>;
  onOpenDetails: (slotId: string) => void;
};

export function AgendaSlotList({
  slots,
  formatTime,
  badgeStyles,
  onOpenDetails,
}: AgendaSlotListProps) {
  if (slots.length === 0) {
    return (
      <section className="px-6 py-12 text-center">
        <p className="text-lg font-semibold tracking-tight text-slate-900">
          Sem slots para mostrar
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Comeca por adicionar o primeiro horario no painel de acoes.
        </p>
      </section>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {slots.map((slot) => (
        <li
          key={slot.id}
          className="px-5 py-6 transition-transform active:scale-95 sm:py-8"
        >
          <div className="flex items-start gap-4">
            <div className="w-24 shrink-0 text-left">
              <p className="font-mono text-sm font-bold tracking-tight text-slate-900">
                {formatTime(slot.start)}
              </p>
              <p className="mt-1 text-xs text-slate-500">{formatTime(slot.end)}</p>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-base font-semibold tracking-tight text-slate-900">
                  {slot.templateTitle}
                </p>
                <Badge className={badgeStyles[slot.templateType]} variant="outline">
                  {slot.templateType === "GROUP" ? "Grupo" : "Privada"}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {slot.templateType === "GROUP"
                  ? `${slot.booked}/${slot.capacity} vagas ocupadas`
                  : "Sessao individual"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-xs font-medium text-slate-500">
                {slot.templateType === "GROUP" ? `${slot.capacity - slot.booked} livres` : "1:1"}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onOpenDetails(slot.id)}
                className="text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                <Ellipsis className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
