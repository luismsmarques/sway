"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getReconfirmationDataAction,
  respondReconfirmationAction,
} from "@/app/actions";
import {
  INFO_BADGE_STYLE,
  WARNING_SURFACE_STYLE,
  WARNING_TEXT_STYLE,
} from "@/components/ui/dashboard/status-tokens";
import { uiButton, uiShell } from "@/components/ui/dashboard/ui-tokens";
import { MobileAppHeader } from "@/components/ui/mobile-app-header";
import { MobileSkeletonCard } from "@/components/ui/mobile-skeleton";

type ReconfirmData = {
  id: string;
  status: "PENDING" | "CONFIRMED" | "CANCELED";
  studentName: string;
  studentPhone: string;
  slot: {
    id: string;
    startTime: string;
    endTime: string;
    templateTitle: string;
    ownerName: string;
  };
};

const dateLabel = new Intl.DateTimeFormat("pt-PT", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export default function ReconfirmBookingPage() {
  const params = useParams<{ bookingId: string }>();
  const bookingId = params?.bookingId ?? "";
  const [isPending, startTransition] = useTransition();
  const [booking, setBooking] = useState<ReconfirmData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    const data = await getReconfirmationDataAction(bookingId);
    setBooking(data as ReconfirmData | null);
    setIsLoading(false);
  };

  useEffect(() => {
    if (bookingId) {
      load();
    }
  }, [bookingId]);

  const slotTimeText = useMemo(() => {
    if (!booking) {
      return "";
    }
    const start = new Date(booking.slot.startTime);
    const end = new Date(booking.slot.endTime);
    return `${dateLabel.format(start)} - ${dateLabel.format(end)}`;
  }, [booking]);

  const decide = (decision: "CONFIRM" | "CANCEL") => {
    if (!booking) {
      return;
    }

    setErrorMessage(null);
    setDoneMessage(null);

    startTransition(async () => {
      try {
        const result = await respondReconfirmationAction({
          bookingId: booking.id,
          decision,
        });

        if (result.status === "CONFIRMED") {
          setDoneMessage("Perfeito. A tua presenca ficou reconfirmada.");
        } else {
          setDoneMessage("Reserva cancelada com sucesso. Obrigado pelo aviso.");
        }

        await load();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel concluir.");
      }
    });
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#F9FAFB] py-8">
        <MobileAppHeader title="Reconfirmar" showBackButton />
        <section className={`${uiShell.page}`}>
          <MobileSkeletonCard />
        </section>
      </main>
    );
  }

  if (!booking) {
    return (
      <main className="min-h-screen bg-[#F9FAFB] py-8">
        <MobileAppHeader title="Reconfirmar" showBackButton />
        <section className={`${uiShell.page}`}>
          <Card className={`${uiShell.card} text-center`}>
            <CardHeader>
              <CardTitle className={uiShell.sectionTitle}>Link invalido</CardTitle>
              <CardDescription className="text-sm text-slate-600">
                Esta reserva nao existe ou ja nao esta disponivel.
              </CardDescription>
            </CardHeader>
          </Card>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F9FAFB] pb-28 pt-8">
      <MobileAppHeader title="Reconfirmar" showBackButton />
      <section className={`${uiShell.page} space-y-4`}>
        <Card className={uiShell.card}>
          <CardHeader className="space-y-3">
            <p className={uiShell.eyebrow}>Re-confirmacao da aula</p>
            <CardTitle className={uiShell.sectionTitle}>Consegues manter este horario?</CardTitle>
            <CardDescription className="text-sm text-slate-600">
              {booking.slot.ownerName} atualizou o horario da tua reserva.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">{booking.slot.templateTitle}</p>
              <p className="mt-1 text-sm text-slate-600">{slotTimeText}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline" className={INFO_BADGE_STYLE}>
                  Aluno: {booking.studentName}
                </Badge>
                <Badge variant="outline" className="bg-white text-slate-700">
                  {booking.studentPhone}
                </Badge>
              </div>
            </div>

            {booking.status === "CANCELED" ? (
              <div className={`rounded-xl p-4 ${WARNING_SURFACE_STYLE}`}>
                <p className={`text-sm font-medium ${WARNING_TEXT_STYLE}`}>
                  Esta reserva ja esta cancelada.
                </p>
              </div>
            ) : null}

            {doneMessage ? <p className="text-sm font-medium text-emerald-700">{doneMessage}</p> : null}
            {errorMessage ? <p className="text-sm font-medium text-rose-700">{errorMessage}</p> : null}
          </CardContent>
        </Card>
      </section>
      {booking.status !== "CANCELED" ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-100 bg-white/95 px-5 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur-md">
          <div className="mx-auto grid max-w-4xl gap-2">
            <Button
              type="button"
              onClick={() => decide("CONFIRM")}
              disabled={isPending}
              className={uiButton.primary}
            >
              Sim, confirmo
            </Button>
            <Button
              type="button"
              onClick={() => decide("CANCEL")}
              disabled={isPending}
              variant="outline"
              className="border-slate-100 bg-white text-slate-700 hover:bg-slate-100 active:scale-95 transition-transform"
            >
              Nao posso, quero cancelar
            </Button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
