"use client";

import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { Trash2, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  cancelClassAction,
  createSlotAction,
  deleteSlotAction,
  getDashboardData,
  removeBookingFromSlotAction,
} from "../actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DashboardHeader } from "@/components/ui/dashboard/dashboard-header";
import { DashboardActionBar } from "@/components/ui/dashboard/dashboard-action-bar";
import { AgendaSlotList } from "@/components/ui/dashboard/agenda-slot-list";
import {
  INFO_BADGE_STYLE,
  TEMPLATE_BADGE_STYLES,
  WARNING_SURFACE_STYLE,
  WARNING_TEXT_STYLE,
} from "@/components/ui/dashboard/status-tokens";
import { uiShell } from "@/components/ui/dashboard/ui-tokens";
import {
  Booking,
  QuickFilter,
  Slot,
  Student,
  Template,
  TemplateType,
} from "@/components/ui/dashboard/types";

const badgeStyles: Record<TemplateType, string> = TEMPLATE_BADGE_STYLES;

const dayLabel = new Intl.DateTimeFormat("pt-PT", {
  weekday: "long",
  day: "2-digit",
  month: "long",
});
const timeLabel = new Intl.DateTimeFormat("pt-PT", {
  hour: "2-digit",
  minute: "2-digit",
});

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function InstructorDashboardPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("TODAY");
  const [detailsSlotId, setDetailsSlotId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [startAt, setStartAt] = useState("09:00");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reload = async () => {
    const data = await getDashboardData();
    setSlots(
      data.slots.map((s) => ({
        ...s,
        start: new Date(s.start),
        end: new Date(s.end),
      })),
    );
    setTemplates(data.templates as Template[]);
    if (!selectedTemplateId && data.templates.length > 0) {
      setSelectedTemplateId(data.templates[0].id);
    }
    setBookings(data.bookings as Booking[]);
    setStudents(data.students as Student[]);
  };

  useEffect(() => {
    reload();
  }, []);

  const filteredSlots = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 7);
    return slots
      .filter((slot) => {
        if (quickFilter === "TODAY")
          return slot.start >= today && slot.start < tomorrow;
        if (quickFilter === "TOMORROW") {
          const dayAfter = new Date(tomorrow);
          dayAfter.setDate(tomorrow.getDate() + 1);
          return slot.start >= tomorrow && slot.start < dayAfter;
        }
        if (quickFilter === "WEEK")
          return slot.start >= today && slot.start < weekEnd;
        return (
          startOfDay(slot.start).getTime() === startOfDay(selectedDay).getTime()
        );
      })
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [quickFilter, selectedDay, slots]);

  const detailsSlot = slots.find((s) => s.id === detailsSlotId) ?? null;
  const detailsBookings = detailsSlot
    ? bookings.filter(
        (b) => b.slotId === detailsSlot.id && b.status !== "CANCELED",
      )
    : [];

  const createSlot = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    startTransition(async () => {
      try {
        const date = startOfDay(selectedDay);
        const [h, m] = startAt.split(":").map(Number);
        date.setHours(h || 0, m || 0, 0, 0);
        if (!selectedTemplateId) {
          throw new Error("Cria primeiro um template para adicionares slots.");
        }
        await createSlotAction({
          templateId: selectedTemplateId,
          startAtISO: date.toISOString(),
        });
        await reload();
        router.refresh();
        setIsDrawerOpen(false);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Falha ao criar slot.",
        );
      }
    });
  };

  return (
    <main className="min-h-screen bg-[#F9FAFB] pb-10">
      <div className={`${uiShell.page} py-6 sm:py-8`}>
        <section className={uiShell.card}>
          <DashboardHeader formattedDate={dayLabel.format(selectedDay)} />
          <DashboardActionBar
            quickFilter={quickFilter}
            selectedDateValue={startOfDay(selectedDay).toISOString().slice(0, 10)}
            onFilterChange={setQuickFilter}
            onDateChange={(value) => setSelectedDay(new Date(value))}
            onAddSlot={() => setIsDrawerOpen(true)}
          />
          <AgendaSlotList
            slots={filteredSlots}
            formatTime={(date) => timeLabel.format(date)}
            badgeStyles={badgeStyles}
            onOpenDetails={setDetailsSlotId}
          />
        </section>
      </div>

      <Dialog open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold tracking-tight">
              Criar slot
            </DialogTitle>
            <DialogDescription>
              Seleciona o template e define a hora de inicio.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createSlot} className="space-y-4">
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              required
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.title}
                </option>
              ))}
            </select>
            <Input
              type="time"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
            />
            {errorMessage ? (
              <p className="text-sm text-rose-600">{errorMessage}</p>
            ) : null}
            <DialogFooter className="bg-transparent p-0 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDrawerOpen(false)}>
                Cancelar
              </Button>
              <Button disabled={isPending}>
                {isPending ? "A guardar..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(detailsSlot)} onOpenChange={(open) => !open && setDetailsSlotId(null)}>
        <DialogContent className="max-w-xl">
          {detailsSlot ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold tracking-tight">
                  Detalhes da Aula
                </DialogTitle>
                <DialogDescription>
                  {detailsSlot.templateTitle} · {timeLabel.format(detailsSlot.start)} -{" "}
                  {timeLabel.format(detailsSlot.end)}
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="max-h-[45vh]">
                <div className="space-y-2 pr-2">
                  {detailsBookings.map((booking) => (
                    <Card key={booking.id} size="sm" className="bg-white shadow-sm">
                      <CardContent className="flex items-center justify-between gap-2">
                        <div>
                          <p className="flex items-center gap-1 text-sm font-semibold text-slate-900">
                            <UserRound className="h-3.5 w-3.5" />
                            {booking.studentName}
                          </p>
                          <p className="text-xs text-muted-foreground">{booking.studentPhone}</p>
                          <Badge variant="outline" className={`mt-1 ${INFO_BADGE_STYLE}`}>
                            {
                              bookings.filter(
                                (b) =>
                                  b.studentPhone === booking.studentPhone &&
                                  b.status !== "CANCELED",
                              ).length
                            }
                            a aula
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={async () => {
                            await removeBookingFromSlotAction({ bookingId: booking.id });
                            await reload();
                            router.refresh();
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              <Card className={`${WARNING_SURFACE_STYLE} shadow-sm`}>
                <CardContent>
                  <p className={`text-sm ${WARNING_TEXT_STYLE}`}>
                    {detailsBookings.length > 0
                      ? `Esta aula tem ${detailsBookings.length} alunos. Ao cancelar, todos serao notificados.`
                      : "Esta aula ainda nao tem alunos inscritos."}
                  </p>
                </CardContent>
              </Card>

              <DialogFooter className="bg-transparent p-0 pt-2">
                <Button
                  variant="outline"
                  onClick={async () => {
                    await deleteSlotAction({ slotId: detailsSlot.id });
                    await reload();
                    setDetailsSlotId(null);
                    router.refresh();
                  }}
                >
                  Eliminar Slot
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    await cancelClassAction({ slotId: detailsSlot.id });
                    await reload();
                    setDetailsSlotId(null);
                    router.refresh();
                  }}
                >
                  Cancelar Aula
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

    </main>
  );
}
