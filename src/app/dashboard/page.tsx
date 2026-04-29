"use client";

import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { Plus, Trash2, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  cancelClassAction,
  createSlotAction,
  createRecurringSlotsAction,
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
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DashboardHeader } from "@/components/ui/dashboard/dashboard-header";
import { DashboardActionBar } from "@/components/ui/dashboard/dashboard-action-bar";
import { AgendaSlotList } from "@/components/ui/dashboard/agenda-slot-list";
import {
  INFO_BADGE_STYLE,
  WARNING_SURFACE_STYLE,
  WARNING_TEXT_STYLE,
} from "@/components/ui/dashboard/status-tokens";
import { MobileAppHeader } from "@/components/ui/mobile-app-header";
import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav";
import { MobileSkeletonCard } from "@/components/ui/mobile-skeleton";
import {
  Booking,
  QuickFilter,
  Slot,
  Student,
  Template,
} from "@/components/ui/dashboard/types";

const dayLabel = new Intl.DateTimeFormat("pt-PT", {
  weekday: "long",
  day: "2-digit",
  month: "long",
});
const timeLabel = new Intl.DateTimeFormat("pt-PT", {
  hour: "2-digit",
  minute: "2-digit",
});
const shortDateLabel = new Intl.DateTimeFormat("pt-PT", {
  day: "2-digit",
  month: "2-digit",
});
const weekdayOptions = [
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sab" },
  { value: 0, label: "Dom" },
];

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
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatWeeks, setRepeatWeeks] = useState("4");
  const [repeatDays, setRepeatDays] = useState<number[]>([new Date().getDay()]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasTemplates = templates.length > 0;

  const reload = async () => {
    setIsLoading(true);
    try {
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
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao carregar dashboard.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
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

  const repeatPreview = useMemo(() => {
    if (!repeatEnabled) {
      return null;
    }

    const base = startOfDay(selectedDay);
    const [h, m] = startAt.split(":").map(Number);
    base.setHours(h || 0, m || 0, 0, 0);
    const weeks = Number(repeatWeeks);
    if (!Number.isFinite(weeks) || weeks < 1 || repeatDays.length === 0) {
      return { total: 0, created: 0, first: null as Date | null, last: null as Date | null };
    }

    const rangeEnd = new Date(base);
    rangeEnd.setDate(rangeEnd.getDate() + weeks * 7);

    const existing = new Set(
      slots.map((slot) => {
        const d = new Date(slot.start);
        return d.toISOString();
      }),
    );

    let total = 0;
    let created = 0;
    let first: Date | null = null;
    let last: Date | null = null;

    for (let day = new Date(base); day < rangeEnd; day.setDate(day.getDate() + 1)) {
      const current = new Date(day);
      if (!repeatDays.includes(current.getDay())) {
        continue;
      }
      current.setHours(h || 0, m || 0, 0, 0);
      if (current < base) {
        continue;
      }
      total += 1;
      const key = current.toISOString();
      if (!existing.has(key)) {
        created += 1;
      }
      if (!first) {
        first = new Date(current);
      }
      last = new Date(current);
    }

    return { total, created, first, last };
  }, [repeatDays, repeatEnabled, repeatWeeks, selectedDay, slots, startAt]);

  const createSlot = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    if (!hasTemplates || !selectedTemplateId) {
      setErrorMessage("Cria primeiro um template para adicionares slots.");
      return;
    }
    startTransition(async () => {
      try {
        const date = startOfDay(selectedDay);
        const [h, m] = startAt.split(":").map(Number);
        date.setHours(h || 0, m || 0, 0, 0);
        if (repeatEnabled) {
          const result = await createRecurringSlotsAction({
            templateId: selectedTemplateId,
            startAtISO: date.toISOString(),
            recurrence: {
              weekdays: repeatDays,
              weeks: Number(repeatWeeks),
            },
          });
          setSuccessMessage(
            result.createdCount > 0
              ? `${result.createdCount} slots criados com repeticao.`
              : "Nenhum novo slot foi criado (ja existiam nestes horarios).",
          );
        } else {
          await createSlotAction({
            templateId: selectedTemplateId,
            startAtISO: date.toISOString(),
          });
          setSuccessMessage("Slot criado com sucesso.");
        }
        await reload();
        router.refresh();
        setIsDrawerOpen(false);
      } catch (error) {
        const rawMessage = error instanceof Error ? error.message : "Falha ao criar slot.";
        const normalizedMessage =
          rawMessage.includes("Can't reach database server") ||
          rawMessage.includes("Invalid `") ||
          rawMessage.includes("Error validating datasource") ||
          rawMessage.includes("An error occurred in the Server Components render")
            ? "Nao foi possivel ligar a base de dados. Confirma a DATABASE_URL no .env.local e reinicia o servidor local."
            : rawMessage;
        setErrorMessage(normalizedMessage);
      }
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-24">
      <MobileAppHeader title="Agenda" />
      <div className="px-6 py-4 pb-24">
        {isLoading ? (
          <MobileSkeletonCard />
        ) : (
          <section className="w-full">
            <DashboardHeader formattedDate={dayLabel.format(selectedDay)} />
            <DashboardActionBar
              quickFilter={quickFilter}
              selectedDay={selectedDay}
              onFilterChange={setQuickFilter}
              onDateChange={(value) => setSelectedDay(new Date(value))}
            />
            <AgendaSlotList
              slots={filteredSlots}
              formatTime={(date) => timeLabel.format(date)}
              onOpenDetails={setDetailsSlotId}
            />
          </section>
        )}
      </div>
      {!isLoading ? (
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="fixed bottom-24 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg shadow-sky-200 transition-transform active:scale-95"
          aria-label="Adicionar slot"
        >
          <Plus className="h-6 w-6" />
        </button>
      ) : null}

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="bg-white">
          <DrawerHeader>
            <DrawerTitle className="text-2xl font-semibold tracking-tight">
              Criar slot
            </DrawerTitle>
            <DrawerDescription>
              Seleciona o template e define a hora de inicio.
            </DrawerDescription>
          </DrawerHeader>
          <form onSubmit={createSlot} className="space-y-4 px-4 pb-2">
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              required
            >
              {hasTemplates ? (
                templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.title}
                  </option>
                ))
              ) : (
                <option value="">Sem templates disponiveis</option>
              )}
            </select>
            {!hasTemplates ? (
              <p className="text-sm text-slate-600">
                Nao tens templates ainda. Cria um em <strong>/templates/new</strong> para poderes
                adicionar slots.
              </p>
            ) : null}
            <Input
              type="time"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
            />
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={repeatEnabled}
                  onChange={(event) => setRepeatEnabled(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Repetir slot semanalmente
              </label>

              {repeatEnabled ? (
                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {weekdayOptions.map((day) => {
                      const isActive = repeatDays.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() =>
                            setRepeatDays((prev) =>
                              prev.includes(day.value)
                                ? prev.filter((value) => value !== day.value)
                                : [...prev, day.value],
                            )
                          }
                          className={`h-8 rounded-lg border px-3 text-xs font-semibold ${
                            isActive
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 bg-white text-slate-600"
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">
                      Durante quantas semanas?
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={12}
                      value={repeatWeeks}
                      onChange={(event) => setRepeatWeeks(event.target.value)}
                    />
                  </div>
                  {repeatPreview ? (
                    <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                      <p className="text-xs text-slate-700">
                        Preview: {repeatPreview.created} de {repeatPreview.total} slots novos
                        {repeatPreview.first && repeatPreview.last
                          ? ` entre ${shortDateLabel.format(repeatPreview.first)} e ${shortDateLabel.format(repeatPreview.last)}`
                          : ""}
                        .
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Slots ja existentes no mesmo horario sao ignorados.
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
            {errorMessage ? (
              <p className="text-sm text-rose-600">{errorMessage}</p>
            ) : null}
            <DrawerFooter className="bg-transparent p-0 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDrawerOpen(false)}>
                Cancelar
              </Button>
              <Button disabled={isPending || !hasTemplates}>
                {isPending ? "A guardar..." : "Guardar"}
              </Button>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>

      {successMessage ? (
        <section className="px-6 pb-2">
          <p className="text-sm font-medium text-emerald-700">{successMessage}</p>
        </section>
      ) : null}

      <Drawer open={Boolean(detailsSlot)} onOpenChange={(open) => !open && setDetailsSlotId(null)}>
        <DrawerContent>
          {detailsSlot ? (
            <>
              <DrawerHeader>
                <DrawerTitle className="text-2xl font-semibold tracking-tight">
                  Detalhes da Aula
                </DrawerTitle>
                <DrawerDescription>
                  {detailsSlot.templateTitle} · {timeLabel.format(detailsSlot.start)} -{" "}
                  {timeLabel.format(detailsSlot.end)}
                </DrawerDescription>
              </DrawerHeader>

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

              <DrawerFooter className="bg-transparent p-4 pt-2">
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
              </DrawerFooter>
            </>
          ) : null}
        </DrawerContent>
      </Drawer>

      <MobileBottomNav />
    </main>
  );
}
