"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { createBookingAction, getPublicBookingData } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";

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

const typeBadgeStyles: Record<TemplateType, string> = {
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

  const capacityBadge = (slot: PublicSlot) => {
    if (slot.currentCapacity <= 0) {
      return { label: "Esgotado", className: "bg-rose-50 text-rose-700 ring-rose-200" };
    }
    if (slot.currentCapacity <= 2) {
      return {
        label: "Ultimas Vagas",
        className: "bg-amber-50 text-amber-700 ring-amber-200",
      };
    }
    return { label: "Livre", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" };
  };

  if (!instructor) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 font-sans">
        <Card className="mx-auto max-w-[450px] bg-white text-center shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Perfil nao encontrado
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Verifica se o link esta correto.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5 font-sans">
      <div className="mx-auto max-w-[450px] space-y-4">
        <Card className="bg-white shadow-sm">
          <CardContent className="pt-1">
            <div className="flex items-center gap-3">
              <img
                src={
                  instructor.avatarUrl ??
                  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80&auto=format&fit=crop"
                }
                alt={instructor.name}
                className="h-14 w-14 rounded-full object-cover ring-2 ring-white"
              />
              <div>
                <p className="text-sm text-muted-foreground">/book/{instructor.slug}</p>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                  {instructor.name}
                </h1>
                <p className="text-sm text-muted-foreground">{instructor.bio}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {successMessage ? (
          <Card className="bg-white text-center shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold tracking-tight">
                {successMessage}
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Reserva confirmada com sucesso.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={addToCalendar} className="w-full bg-sky-500 hover:bg-sky-600">
                Adicionar ao Calendario
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {Object.keys(groupedSlots).length === 0 ? (
          <Card className="bg-white text-center shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold tracking-tight">
                Sem horarios disponiveis
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Volta mais tarde para novas aulas.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <section className="space-y-4">
            {Object.entries(groupedSlots).map(([day, daySlots]) => (
              <div key={day} className="space-y-2">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  {dayLabel.format(new Date(day))}
                </h2>

                <div className="space-y-3">
                  {daySlots.map((slot) => {
                    const isFull = slot.currentCapacity <= 0;
                    const state = capacityBadge(slot);
                    return (
                      <Card key={slot.id} className="bg-white shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-base">{slot.title}</CardTitle>
                          <CardDescription className="text-sm text-muted-foreground">
                            {timeLabel.format(new Date(slot.startTime))} -{" "}
                            {timeLabel.format(new Date(slot.endTime))}
                          </CardDescription>
                          <CardAction className="flex gap-2">
                            <Badge variant="outline" className={typeBadgeStyles[slot.type]}>
                              {slot.type === "GROUP" ? "Grupo" : "Privada"}
                            </Badge>
                            <Badge variant="outline" className={state.className}>
                              {state.label}
                            </Badge>
                          </CardAction>
                        </CardHeader>
                        <CardContent>
                          {slot.type === "GROUP" ? (
                            <p className="text-sm text-muted-foreground">
                              {slot.currentCapacity > 0
                                ? `${slot.currentCapacity} vagas disponiveis`
                                : "Sem vagas disponiveis"}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Sessao individual disponivel.
                            </p>
                          )}
                          <Button
                            type="button"
                            onClick={() => openCheckout(slot.id)}
                            disabled={isFull}
                            className="mt-3 w-full bg-sky-600 hover:bg-sky-700"
                          >
                            {isFull ? "Esgotado" : "Reservar"}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        )}
      </div>

      <Drawer open={Boolean(selectedSlot)} onOpenChange={(open) => !open && closeCheckout()}>
        <DrawerContent>
          {selectedSlot ? (
            <>
              <DrawerHeader className="text-left">
                <DrawerTitle className="text-2xl font-semibold tracking-tight">
                  Finalizar reserva
                </DrawerTitle>
                <DrawerDescription className="text-sm text-muted-foreground">
                  {selectedSlot.title} - {timeLabel.format(new Date(selectedSlot.startTime))}
                </DrawerDescription>
              </DrawerHeader>
              <div className="space-y-4 px-4 pb-2">
                <div className="space-y-2">
                  <label htmlFor="student_name" className="text-sm font-medium text-slate-700">
                    Nome
                  </label>
                  <Input
                    id="student_name"
                    value={studentName}
                    onChange={(event) => setStudentName(event.target.value)}
                    placeholder="O teu nome"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="student_phone" className="text-sm font-medium text-slate-700">
                    Telemovel
                  </label>
                  <Input
                    id="student_phone"
                    value={studentPhone}
                    onChange={(event) => setStudentPhone(event.target.value)}
                    placeholder="+351 9xx xxx xxx"
                    inputMode="numeric"
                    pattern="[0-9+ ]*"
                    className="h-10"
                  />
                </div>
                {errorMessage ? (
                  <p className="text-sm font-medium text-rose-600">{errorMessage}</p>
                ) : null}
              </div>
              <DrawerFooter>
                <Button type="button" onClick={handleConfirmBooking} disabled={isPending}>
                  {isPending ? "A confirmar..." : "Confirmar Reserva"}
                </Button>
                <Button type="button" variant="outline" onClick={closeCheckout}>
                  Cancelar
                </Button>
              </DrawerFooter>
            </>
          ) : null}
        </DrawerContent>
      </Drawer>
    </main>
  );
}
