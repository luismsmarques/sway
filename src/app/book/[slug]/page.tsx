"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { createBookingAction, getPublicBookingData } from "@/app/actions";

type TemplateType = "PRIVATE" | "GROUP";

type PublicSlot = {
  id: string;
  title: string;
  type: TemplateType;
  startTime: string;
  endTime: string;
  totalCapacity: number;
  currentCapacity: number; // remaining spots
};

const badgeStyles: Record<TemplateType, string> = {
  PRIVATE: "bg-sky-50 text-sky-700 ring-sky-200",
  GROUP: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const dayLabel = new Intl.DateTimeFormat("pt-PT", {
  weekday: "short",
  day: "2-digit",
  month: "short",
});


const timeLabel = new Intl.DateTimeFormat("pt-PT", {
  hour: "2-digit",
  minute: "2-digit",
});

function dayKeyFromISO(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

async function fireConfetti() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const module = await import("canvas-confetti");
    const confetti = module.default;

    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.65 },
      ticks: 250,
    });
  } catch {
    // If the package is not installed yet, booking flow still works.
  }
}

export default function PublicBookingPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const slug = params?.slug ?? "";
  const [instructor, setInstructor] = useState<{
    slug: string;
    name: string;
    avatarUrl: string | null;
    bio: string;
  } | null>(null);
  const [slots, setSlots] = useState<PublicSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [lastBookedSlot, setLastBookedSlot] = useState<PublicSlot | null>(null);
  const [studentName, setStudentName] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = async () => {
    const data = await getPublicBookingData(slug);
    setInstructor(data.owner);
    setSlots(data.slots);
  };

  useEffect(() => {
    if (slug) {
      load();
    }
  }, [slug]);

  const availableSlots = useMemo(() => {
    const now = Date.now();

    return slots
      .filter((slot) => new Date(slot.startTime).getTime() >= now)
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      );
  }, [slots]);

  const selectedSlot = useMemo(
    () => slots.find((slot) => slot.id === selectedSlotId) ?? null,
    [selectedSlotId, slots],
  );

  const groupedSlots = useMemo(() => {
    return availableSlots.reduce<Record<string, PublicSlot[]>>((acc, slot) => {
      const key = dayKeyFromISO(slot.startTime);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(slot);
      return acc;
    }, {});
  }, [availableSlots]);

  const openCheckout = (slotId: string) => {
    setSuccessMessage(null);
    setStudentName("");
    setStudentPhone("");
    setSelectedSlotId(slotId);
  };

  const closeCheckout = () => {
    setSelectedSlotId(null);
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot || !studentName.trim() || !studentPhone.trim()) {
      return;
    }

    if (selectedSlot.currentCapacity <= 0) {
      return;
    }

    setErrorMessage(null);
    startTransition(async () => {
      try {
        await createBookingAction({
          ownerSlug: slug,
          slotId: selectedSlot.id,
          studentName: studentName.trim(),
          studentPhone: studentPhone.trim(),
        });
        setLastBookedSlot(selectedSlot);
        setSelectedSlotId(null);
        setSuccessMessage(`Reserva feita, ${studentName.trim()}! Vemo-nos em breve.`);
        await load();
        router.refresh();
        await fireConfetti();
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Desculpe, esta aula acabou de esgotar!",
        );
      }
    });
  };

  const addToCalendar = () => {
    if (!lastBookedSlot) {
      return;
    }
    const title = encodeURIComponent(lastBookedSlot.title);
    const details = encodeURIComponent("Reserva criada via Solo-Flow");
    const location = encodeURIComponent("Solo-Flow");
    const start = lastBookedSlot.startTime
      .replace(/[-:]/g, "")
      .replace(".000Z", "Z");
    const end = lastBookedSlot.endTime
      .replace(/[-:]/g, "")
      .replace(".000Z", "Z");
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (!instructor) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 font-sans">
        <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200/70">
          <h1 className="text-xl font-semibold text-slate-900">
            Perfil nao encontrado
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Verifica se o link esta correto.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5 font-sans md:px-8 md:py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
          <div className="flex items-center gap-3 md:gap-4">
            <img
              src={
                instructor.avatarUrl ??
                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80&auto=format&fit=crop"
              }
              alt={instructor.name}
              className="h-16 w-16 rounded-full object-cover ring-2 ring-white"
            />
            <div>
              <p className="text-sm font-medium text-slate-500">
                /book/{instructor.slug}
              </p>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
                {instructor.name}
              </h1>
              <p className="mt-1 text-sm text-slate-600">{instructor.bio}</p>
            </div>
          </div>
        </section>

        {successMessage ? (
          <section className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200/70">
            <p className="text-2xl font-semibold text-slate-900">{successMessage}</p>
            <button
              type="button"
              onClick={addToCalendar}
              className="mt-4 h-11 rounded-xl bg-sky-500 px-5 text-sm font-medium text-white transition hover:bg-sky-600"
            >
              Adicionar ao Calendario
            </button>
          </section>
        ) : null}

        {Object.keys(groupedSlots).length === 0 ? (
          <section className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200/70">
            <h2 className="text-lg font-semibold text-slate-900">
              Sem horarios disponiveis
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Volta mais tarde para novas aulas.
            </p>
          </section>
        ) : (
          <section className="space-y-6">
            {Object.entries(groupedSlots).map(([day, daySlots]) => (
              <div key={day} className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  {dayLabel.format(new Date(day))}
                </h2>

                <div className="space-y-3">
                  {daySlots.map((slot) => {
                    const isFull = slot.currentCapacity <= 0;
                    return (
                      <article
                        key={slot.id}
                        className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-semibold text-slate-900">
                              {slot.title}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              {timeLabel.format(new Date(slot.startTime))} -{" "}
                              {timeLabel.format(new Date(slot.endTime))}
                            </p>
                            {slot.type === "GROUP" ? (
                              <p className="mt-1 text-sm font-medium text-slate-700">
                                {slot.currentCapacity > 0
                                  ? `Apenas ${slot.currentCapacity} vagas disponiveis`
                                  : "Sem vagas disponiveis"}
                              </p>
                            ) : null}
                          </div>

                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${badgeStyles[slot.type]}`}
                          >
                            {slot.type === "GROUP" ? "Grupo" : "Privada"}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => openCheckout(slot.id)}
                          disabled={isFull}
                          className="mt-4 h-11 w-full rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          {isFull ? "Esgotado" : "Reservar"}
                        </button>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        )}
      </div>

      {selectedSlot ? (
        <>
          <button
            type="button"
            onClick={closeCheckout}
            className="fixed inset-0 z-40 bg-slate-900/35"
            aria-label="Fechar checkout"
          />

          <aside className="fixed bottom-0 left-0 right-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-3xl bg-white p-5 pb-7 shadow-2xl ring-1 ring-slate-200 md:left-auto md:right-6 md:top-6 md:w-[28rem] md:rounded-3xl md:p-6">
            <h3 className="text-lg font-semibold text-slate-900">Finalizar reserva</h3>
            <p className="mt-1 text-sm text-slate-600">
              {selectedSlot.title} -{" "}
              {timeLabel.format(new Date(selectedSlot.startTime))}
            </p>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="student_name"
                  className="text-sm font-medium text-slate-700"
                >
                  Nome
                </label>
                <input
                  id="student_name"
                  value={studentName}
                  onChange={(event) => setStudentName(event.target.value)}
                  placeholder="O teu nome"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="student_phone"
                  className="text-sm font-medium text-slate-700"
                >
                  Telemovel
                </label>
                <input
                  id="student_phone"
                  value={studentPhone}
                  onChange={(event) => setStudentPhone(event.target.value)}
                  placeholder="+351 9xx xxx xxx"
                  inputMode="numeric"
                  pattern="[0-9+ ]*"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>
            {errorMessage ? (
              <p className="mt-3 text-sm font-medium text-rose-600">{errorMessage}</p>
            ) : null}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeCheckout}
                className="h-11 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmBooking}
                disabled={isPending}
                className="h-11 rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600"
              >
                {isPending ? "A confirmar..." : "Confirmar Reserva"}
              </button>
            </div>
          </aside>
        </>
      ) : null}

    </main>
  );
}
