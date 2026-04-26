"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { createBookingAction, getPublicBookingData } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AvailabilityDayList } from "@/components/ui/dashboard/availability-day-list";
import { BookingDrawerForm } from "@/components/ui/dashboard/booking-drawer-form";
import {
  CapacityState,
  PublicInstructor,
  PublicSlot,
  TemplateType,
} from "@/components/ui/dashboard/public-booking-types";
import {
  getCapacityBadgeState,
  TEMPLATE_BADGE_STYLES,
} from "@/components/ui/dashboard/status-tokens";
import { StudentProfileHero } from "@/components/ui/dashboard/student-profile-hero";
import { uiButton, uiShell } from "@/components/ui/dashboard/ui-tokens";
import { MobileAppHeader } from "@/components/ui/mobile-app-header";
import { MobileSkeletonCard } from "@/components/ui/mobile-skeleton";

const typeBadgeStyles: Record<TemplateType, string> = TEMPLATE_BADGE_STYLES;

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
  const [instructor, setInstructor] = useState<PublicInstructor | null>(null);
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

  const capacityBadge = (slot: PublicSlot): CapacityState => {
    return getCapacityBadgeState(slot.currentCapacity);
  };

  if (!instructor) {
    return (
      <main className="min-h-screen bg-[#F9FAFB] py-6 font-sans sm:py-8">
        <MobileAppHeader title="Reservar aula" />
        <Card className={`mx-auto w-full max-w-4xl text-center ${uiShell.card}`}>
          <CardHeader>
            <CardTitle className={uiShell.sectionTitle}>Perfil nao encontrado</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Verifica se o link esta correto.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F9FAFB] py-6 font-sans sm:py-8">
      <MobileAppHeader title={instructor.name} />
      <div className={`${uiShell.page} space-y-4`}>
        {slots.length === 0 ? <MobileSkeletonCard /> : null}
        <StudentProfileHero instructor={instructor} />

        {successMessage ? (
          <Card className={`${uiShell.card} text-center`}>
            <CardHeader>
              <CardTitle className={uiShell.sectionTitle}>{successMessage}</CardTitle>
              <CardDescription className="text-sm text-slate-600">
                Reserva confirmada com sucesso.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={addToCalendar} className={`w-full ${uiButton.primary}`}>
                Adicionar ao Calendario
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <AvailabilityDayList
          groupedSlots={groupedSlots}
          dayLabel={(date) => dayLabel.format(date)}
          timeLabel={(date) => timeLabel.format(date)}
          typeBadgeStyles={typeBadgeStyles}
          capacityBadge={capacityBadge}
          onOpenCheckout={openCheckout}
        />
      </div>

      <BookingDrawerForm
        selectedSlot={selectedSlot}
        open={Boolean(selectedSlot)}
        studentName={studentName}
        studentPhone={studentPhone}
        errorMessage={errorMessage}
        isPending={isPending}
        formatTime={(date) => timeLabel.format(date)}
        onOpenChange={(open) => !open && closeCheckout()}
        onStudentNameChange={setStudentName}
        onStudentPhoneChange={setStudentPhone}
        onConfirm={handleConfirmBooking}
        onCancel={closeCheckout}
      />
    </main>
  );
}
