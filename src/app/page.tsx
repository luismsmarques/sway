"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type TemplateType = "PRIVATE" | "GROUP";

type Template = {
  id: string;
  title: string;
  type: TemplateType;
  durationMins: number;
  capacity: number;
};

type Slot = {
  id: string;
  templateId: string;
  templateTitle: string;
  templateType: TemplateType;
  start: Date;
  end: Date;
  capacity: number;
  booked: number;
};

const mockTemplates: Template[] = [
  {
    id: "t1",
    title: "Aula Surf 90min",
    type: "GROUP",
    durationMins: 90,
    capacity: 6,
  },
  {
    id: "t2",
    title: "Treino Funcional 60min",
    type: "PRIVATE",
    durationMins: 60,
    capacity: 1,
  },
  {
    id: "t3",
    title: "Yoga Flow 75min",
    type: "GROUP",
    durationMins: 75,
    capacity: 12,
  },
];

const badgeStyles: Record<TemplateType, string> = {
  PRIVATE: "bg-sky-50 text-sky-700 ring-sky-200",
  GROUP: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const STORAGE_KEY = "solo-flow-slots";

const dayLabel = new Intl.DateTimeFormat("pt-PT", {
  weekday: "long",
  day: "2-digit",
  month: "long",
});

const dayChipLabel = new Intl.DateTimeFormat("pt-PT", {
  weekday: "short",
  day: "2-digit",
});

const timeLabel = new Intl.DateTimeFormat("pt-PT", {
  hour: "2-digit",
  minute: "2-digit",
});

function toLocalTimeInputValue(date: Date) {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function formatDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function hasOverlap(slotA: Slot, slotB: Slot) {
  return slotA.start < slotB.end && slotB.start < slotA.end;
}

function AlertTriangleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m10.29 3.86-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.71-3.14l-8-14a2 2 0 0 0-3.42 0Z" />
      <line x1="12" x2="12" y1="9" y2="13" />
      <line x1="12" x2="12.01" y1="17" y2="17" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function buildDayCarousel(totalDays = 10) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: totalDays }).map((_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return date;
  });
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function mergeDateAndTime(date: Date, timeHHMM: string) {
  const [hours, minutes] = timeHHMM.split(":").map(Number);
  const output = new Date(date);
  output.setHours(hours || 0, minutes || 0, 0, 0);
  return output;
}

function serializeSlots(slots: Slot[]) {
  return slots.map((slot) => ({
    ...slot,
    start: slot.start.toISOString(),
    end: slot.end.toISOString(),
  }));
}

function deserializeSlots(raw: unknown): Slot[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item) => {
      if (
        !item ||
        typeof item !== "object" ||
        !("start" in item) ||
        !("end" in item)
      ) {
        return null;
      }

      const slot = item as Omit<Slot, "start" | "end"> & {
        start: string;
        end: string;
      };

      return {
        ...slot,
        start: new Date(slot.start),
        end: new Date(slot.end),
      };
    })
    .filter((slot): slot is Slot => Boolean(slot));
}

export default function InstructorDashboardPage() {
  const [templates] = useState<Template[]>(mockTemplates);
  const [slots, setSlots] = useState<Slot[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return [];
    }
    try {
      return deserializeSlots(JSON.parse(saved));
    } catch {
      return [];
    }
  });

  const dayOptions = useMemo(() => buildDayCarousel(10), []);
  const [selectedDay, setSelectedDay] = useState<Date>(dayOptions[0]);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerStep, setDrawerStep] = useState<1 | 2>(1);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [startAt, setStartAt] = useState(toLocalTimeInputValue(new Date()));
  const [pendingDeleteSlot, setPendingDeleteSlot] = useState<Slot | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeSlots(slots)));
  }, [slots]);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId),
    [selectedTemplateId, templates],
  );

  const dailySlots = useMemo(() => {
    const dayStart = startOfDay(selectedDay);
    const dayEnd = endOfDay(selectedDay);
    return slots
      .filter((slot) => slot.start >= dayStart && slot.start <= dayEnd)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [selectedDay, slots]);

  const conflictSlotIds = useMemo(() => {
    const ids = new Set<string>();

    for (let i = 0; i < dailySlots.length; i += 1) {
      for (let j = i + 1; j < dailySlots.length; j += 1) {
        if (hasOverlap(dailySlots[i], dailySlots[j])) {
          ids.add(dailySlots[i].id);
          ids.add(dailySlots[j].id);
        }
      }
    }

    return ids;
  }, [dailySlots]);

  const handleCreateSlot = (event: FormEvent) => {
    event.preventDefault();

    if (!selectedTemplate) {
      return;
    }

    const start = mergeDateAndTime(selectedDay, startAt);
    if (Number.isNaN(start.getTime())) {
      return;
    }

    const end = new Date(start);
    end.setMinutes(end.getMinutes() + selectedTemplate.durationMins);

    const newSlot: Slot = {
      id: crypto.randomUUID(),
      templateId: selectedTemplate.id,
      templateTitle: selectedTemplate.title,
      templateType: selectedTemplate.type,
      start,
      end,
      capacity: selectedTemplate.capacity,
      booked: 0,
    };

    setSlots((prev) => [...prev, newSlot]);
    setSelectedTemplateId("");
    setDrawerStep(1);
    setStartAt(toLocalTimeInputValue(new Date()));
    setIsDrawerOpen(false);
  };

  const openDrawer = () => {
    setDrawerStep(1);
    setSelectedTemplateId("");
    setStartAt(toLocalTimeInputValue(new Date()));
    setIsDrawerOpen(true);
  };

  const handleDeleteSlot = (slot: Slot) => {
    setPendingDeleteSlot(slot);
  };

  const confirmDeleteSlot = () => {
    if (!pendingDeleteSlot) {
      return;
    }
    setSlots((prev) => prev.filter((slot) => slot.id !== pendingDeleteSlot.id));
    setPendingDeleteSlot(null);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-white/60 bg-white/70 backdrop-blur-md">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Daily Feed
          </p>
          <h1 className="mt-1 text-lg font-semibold text-slate-900">
            {dayLabel.format(selectedDay)}
          </h1>
          <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
            {dayOptions.map((day) => {
              const isActive = formatDayKey(day) === formatDayKey(selectedDay);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition ${
                    isActive
                      ? "bg-sky-100 text-sky-800 ring-1 ring-sky-200"
                      : "bg-white text-slate-600 ring-1 ring-slate-200"
                  }`}
                >
                  {dayChipLabel.format(day)}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-4 px-4 pb-24 pt-4">
        <header className="space-y-1">
          <p className="text-sm font-medium text-slate-500">Solo-Flow</p>
          <p className="text-sm text-slate-600">
            Pinta a agenda em segundos: escolhe template e hora de inicio.
          </p>
        </header>

        {dailySlots.length === 0 ? (
          <section className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200/70">
            <h2 className="text-lg font-semibold text-slate-900">
              Sem slots para mostrar
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Perfeito para comecar. Toca no + e adiciona o primeiro horario do dia.
            </p>
          </section>
        ) : (
          <section className="space-y-3">
            {dailySlots.map((slot) => (
              <article
                key={slot.id}
                className={`rounded-2xl border bg-white p-4 shadow-sm ${
                  conflictSlotIds.has(slot.id)
                    ? "border-rose-200"
                    : "border-transparent ring-1 ring-slate-200/70"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-semibold tracking-tight text-slate-900">
                      {timeLabel.format(slot.start)} - {timeLabel.format(slot.end)}
                    </p>
                    <p className="mt-1 truncate text-sm font-medium text-slate-800">
                      {slot.templateTitle}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${badgeStyles[slot.templateType]}`}
                      >
                        {slot.templateType === "GROUP" ? "Grupo" : "Privada"}
                      </span>
                      {conflictSlotIds.has(slot.id) ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 ring-1 ring-rose-200">
                          <AlertTriangleIcon />
                          Sobreposicao
                        </span>
                      ) : null}
                    </div>
                    {slot.templateType === "GROUP" ? (
                      <p className="mt-2 text-sm font-medium text-slate-700">
                        {slot.booked} / {slot.capacity} vagas
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteSlot(slot)}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Eliminar slot"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>

      <button
        type="button"
        onClick={openDrawer}
        className="fixed bottom-8 right-8 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 text-3xl leading-none text-white shadow-lg transition hover:bg-sky-600"
        aria-label="Criar slot"
      >
        +
      </button>

      {isDrawerOpen ? (
        <>
          <button
            type="button"
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/35"
            aria-label="Fechar drawer"
          />

          <aside className="fixed bottom-0 left-0 right-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-3xl bg-white p-5 pb-7 shadow-2xl ring-1 ring-slate-200 md:left-auto md:right-6 md:top-6 md:w-[28rem] md:rounded-3xl md:p-6">
            {drawerStep === 1 ? (
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Escolhe um template
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Passo 1 de 2. Seleciona o molde da aula.
                </p>

                <div className="mt-5 space-y-2">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => {
                        setSelectedTemplateId(template.id);
                        setDrawerStep(2);
                      }}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-sky-200 hover:bg-sky-50/40"
                    >
                      <p className="text-sm font-semibold text-slate-900">
                        {template.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        {template.durationMins} min
                      </p>
                    </button>
                  ))}
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="h-11 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleCreateSlot}>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Define a hora de inicio
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Passo 2 de 2. A hora de fim e calculada automaticamente.
                  </p>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="start_at"
                    className="text-sm font-medium text-slate-700"
                  >
                    Hora de inicio
                  </label>
                  <input
                    id="start_at"
                    type="time"
                    value={startAt}
                    onChange={(event) => setStartAt(event.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                    required
                  />
                </div>

                <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {selectedTemplate ? (
                    <>
                      Fim estimado:{" "}
                      <span className="font-semibold text-slate-900">
                        {timeLabel.format(
                          new Date(
                            mergeDateAndTime(selectedDay, startAt).getTime() +
                              selectedTemplate.durationMins * 60 * 1000,
                          ),
                        )}
                      </span>
                    </>
                  ) : (
                    "Seleciona um template para calcular a hora de fim."
                  )}
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setDrawerStep(1)}
                    className="h-11 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="h-11 rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600"
                  >
                    Guardar slot
                  </button>
                </div>
              </form>
            )}
          </aside>
        </>
      ) : null}

      {pendingDeleteSlot ? (
        <>
          <button
            type="button"
            onClick={() => setPendingDeleteSlot(null)}
            className="fixed inset-0 z-[60] bg-slate-900/40"
            aria-label="Fechar confirmacao"
          />
          <section className="fixed inset-x-4 top-1/2 z-[61] -translate-y-1/2 rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200 md:inset-x-auto md:right-6 md:top-auto md:bottom-6 md:translate-y-0 md:w-80">
            <h3 className="text-base font-semibold text-slate-900">
              Eliminar slot?
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Esta acao remove o horario da agenda do dia.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDeleteSlot(null)}
                className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteSlot}
                className="h-10 rounded-xl bg-rose-500 px-4 text-sm font-medium text-white"
              >
                Eliminar
              </button>
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
