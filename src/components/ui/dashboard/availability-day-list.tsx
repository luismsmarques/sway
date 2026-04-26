import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CapacityState, PublicSlot, TemplateType } from "./public-booking-types";
import { uiButton, uiShell } from "./ui-tokens";

type AvailabilityDayListProps = {
  groupedSlots: Record<string, PublicSlot[]>;
  dayLabel: (date: Date) => string;
  timeLabel: (date: Date) => string;
  typeBadgeStyles: Record<TemplateType, string>;
  capacityBadge: (slot: PublicSlot) => CapacityState;
  onOpenCheckout: (slotId: string) => void;
};

export function AvailabilityDayList({
  groupedSlots,
  dayLabel,
  timeLabel,
  typeBadgeStyles,
  capacityBadge,
  onOpenCheckout,
}: AvailabilityDayListProps) {
  if (Object.keys(groupedSlots).length === 0) {
    return (
      <Card className={`${uiShell.card} text-center`}>
        <CardHeader>
          <CardTitle className={uiShell.sectionTitle}>Sem horarios disponiveis</CardTitle>
          <p className="text-sm text-slate-600">Volta mais tarde para novas aulas.</p>
        </CardHeader>
      </Card>
    );
  }

  return (
    <section className="space-y-3">
      {Object.entries(groupedSlots).map(([day, daySlots]) => (
        <Card key={day} className={uiShell.card}>
          <CardHeader className="border-b border-slate-200">
            <CardTitle className={uiShell.eyebrow}>
              {dayLabel(new Date(day))}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-slate-100">
              {daySlots.map((slot) => {
                const isFull = slot.currentCapacity <= 0;
                const state = capacityBadge(slot);
                return (
                  <li key={slot.id} className="p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold tracking-tight text-slate-900">
                          {slot.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {timeLabel(new Date(slot.startTime))} -{" "}
                          {timeLabel(new Date(slot.endTime))}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className={typeBadgeStyles[slot.type]}>
                          {slot.type === "GROUP" ? "Grupo" : "Privada"}
                        </Badge>
                        <Badge variant="outline" className={state.className}>
                          {state.label}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={() => onOpenCheckout(slot.id)}
                      disabled={isFull}
                      className={`mt-4 w-full ${uiButton.primary}`}
                    >
                      {isFull ? "Esgotado" : "Reservar horario"}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
