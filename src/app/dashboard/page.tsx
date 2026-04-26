"use client";

import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { Trash2, UserRound, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  cancelClassAction,
  createSlotAction,
  deleteSlotAction,
  getDashboardData,
  removeBookingFromSlotAction,
} from "../actions";

type TemplateType = "PRIVATE" | "GROUP";
type QuickFilter = "TODAY" | "TOMORROW" | "WEEK";

type Slot = {
  id: string;
  ownerId: string;
  templateId: string;
  templateTitle: string;
  templateType: TemplateType;
  start: Date;
  end: Date;
  capacity: number;
  booked: number;
};
type Booking = {
  id: string;
  ownerId: string;
  slotId: string;
  studentId: string | null;
  studentName: string;
  studentPhone: string;
  status: "PENDING" | "CONFIRMED" | "CANCELED";
  createdAt: string;
};
type Student = { id: string; ownerId: string; phone: string; name: string };
type Template = {
  id: string;
  title: string;
  durationMins: number;
  type: TemplateType;
};

const badgeStyles: Record<TemplateType, string> = {
  PRIVATE: "bg-sky-50 text-sky-700 ring-sky-200",
  GROUP: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

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
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-white/60 bg-white/70 backdrop-blur-md">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Daily Feed
          </p>
          <h1 className="mt-1 text-lg font-semibold text-slate-900">
            {dayLabel.format(selectedDay)}
          </h1>
          <div className="mt-3 flex gap-2">
            {(["TODAY", "TOMORROW", "WEEK"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setQuickFilter(f)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  quickFilter === f
                    ? "bg-sky-100 text-sky-800 ring-1 ring-sky-200"
                    : "bg-white text-slate-600 ring-1 ring-slate-200"
                }`}
              >
                {f === "TODAY" ? "Hoje" : f === "TOMORROW" ? "Amanha" : "Esta Semana"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-3 px-4 pb-24 pt-4">
        {filteredSlots.map((slot) => (
          <article
            key={slot.id}
            className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70"
            onClick={() => setDetailsSlotId(slot.id)}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-slate-900">
                  {timeLabel.format(slot.start)} - {timeLabel.format(slot.end)}
                </p>
                <p className="mt-1 text-sm text-slate-700">{slot.templateTitle}</p>
                <span
                  className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${badgeStyles[slot.templateType]}`}
                >
                  {slot.templateType === "GROUP" ? "Grupo" : "Privada"}
                </span>
                {slot.templateType === "GROUP" ? (
                  <p className="mt-2 text-sm text-slate-600">
                    🟢 {slot.booked} vagas ocupadas de {slot.capacity}
                  </p>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setIsDrawerOpen(true)}
        className="fixed bottom-8 right-8 z-30 h-14 w-14 rounded-full bg-sky-500 text-3xl text-white shadow-lg"
      >
        +
      </button>

      {isDrawerOpen ? (
        <aside className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-white p-5 shadow-2xl">
          <form onSubmit={createSlot} className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Criar slot</h2>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 px-4"
              required
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.title}
                </option>
              ))}
            </select>
            <input
              type="time"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 px-4"
            />
            {errorMessage ? (
              <p className="text-sm text-rose-600">{errorMessage}</p>
            ) : null}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="h-10 rounded-xl border border-slate-200 px-4"
              >
                Cancelar
              </button>
              <button
                disabled={isPending}
                className="h-10 rounded-xl bg-sky-500 px-4 text-white"
              >
                {isPending ? "A guardar..." : "Guardar"}
              </button>
            </div>
          </form>
        </aside>
      ) : null}

      {detailsSlot ? (
        <aside className="fixed bottom-0 left-0 right-0 z-[60] max-h-[88vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl">
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-semibold text-slate-900">
              Detalhes da Aula
            </h3>
            <button
              onClick={() => setDetailsSlotId(null)}
              className="rounded-full p-1 text-slate-500"
            >
              <X size={16} />
            </button>
          </div>
          <p className="mt-1 text-sm text-slate-600">{detailsSlot.templateTitle}</p>
          <div className="mt-4 space-y-2">
            {detailsBookings.map((booking) => (
              <div key={booking.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="flex items-center gap-1 text-sm font-semibold text-slate-900">
                      <UserRound size={14} />
                      {booking.studentName}
                    </p>
                    <p className="text-xs text-slate-600">{booking.studentPhone}</p>
                    <span className="mt-1 inline-flex rounded-full bg-sky-50 px-2 py-0.5 text-xs text-sky-700">
                      {
                        bookings.filter(
                          (b) =>
                            b.studentPhone === booking.studentPhone &&
                            b.status !== "CANCELED",
                        ).length
                      }
                      a aula
                    </span>
                  </div>
                  <button
                    onClick={async () => {
                      await removeBookingFromSlotAction({ bookingId: booking.id });
                      await reload();
                      router.refresh();
                    }}
                    className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {detailsBookings.length > 0 ? (
            <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
              Esta aula tem {detailsBookings.length} alunos. Ao cancelar, todos
              serao notificados.
            </p>
          ) : null}
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={async () => {
                await deleteSlotAction({ slotId: detailsSlot.id });
                await reload();
                setDetailsSlotId(null);
                router.refresh();
              }}
              className="h-10 rounded-xl border border-slate-200 px-4 text-sm"
            >
              Eliminar Slot
            </button>
            <button
              onClick={async () => {
                await cancelClassAction({ slotId: detailsSlot.id });
                await reload();
                setDetailsSlotId(null);
                router.refresh();
              }}
              className="h-10 rounded-xl bg-rose-500 px-4 text-sm text-white"
            >
              Cancelar Aula
            </button>
          </div>
        </aside>
      ) : null}

      {filteredSlots.length === 0 ? (
        <section className="mx-auto max-w-2xl rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200/70">
          <h2 className="text-lg font-semibold text-slate-900">
            Sem slots para mostrar
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Perfeito para comecar. Toca no + e adiciona o primeiro horario.
          </p>
        </section>
      ) : null}
    </main>
  );
}
