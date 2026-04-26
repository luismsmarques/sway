import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PublicInstructor } from "./public-booking-types";
import { uiShell } from "./ui-tokens";

type StudentProfileHeroProps = {
  instructor: PublicInstructor;
};

export function StudentProfileHero({ instructor }: StudentProfileHeroProps) {
  return (
    <Card className={uiShell.card}>
      <CardContent className="px-6 py-8 text-center">
        <div className="mx-auto max-w-xl">
          <img
            src={
              instructor.avatarUrl ??
              "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80&auto=format&fit=crop"
            }
            alt={instructor.name}
            className="mx-auto h-24 w-24 rounded-full border border-slate-200 object-cover"
          />
          <div className="mt-4">
            <p className="text-sm text-slate-500">/book/{instructor.slug}</p>
            <div className="mt-1 flex items-center justify-center gap-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                {instructor.name}
              </h1>
              <Badge variant="outline" className="border-slate-200 bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                Verificado
              </Badge>
            </div>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">{instructor.bio}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
