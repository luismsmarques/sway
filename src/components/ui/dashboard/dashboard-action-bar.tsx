import { Button } from "@/components/ui/button";
import { QuickFilter } from "./types";
import { uiButton } from "./ui-tokens";

type DashboardActionBarProps = {
  quickFilter: QuickFilter;
  selectedDay: Date;
  onFilterChange: (filter: QuickFilter) => void;
  onDateChange: (value: string) => void;
};

const FILTERS: QuickFilter[] = ["TODAY", "TOMORROW", "WEEK"];
const weekdayLabel = new Intl.DateTimeFormat("pt-PT", { weekday: "short" });
const dayNumberLabel = new Intl.DateTimeFormat("pt-PT", { day: "2-digit" });

export function DashboardActionBar({
  quickFilter,
  selectedDay,
  onFilterChange,
  onDateChange,
}: DashboardActionBarProps) {
  const stripDays = Array.from({ length: 14 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + index);
    return date;
  });

  return (
    <section className="space-y-3 border-b border-slate-100 px-6 py-3">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((filter) => (
          <Button
            key={filter}
            type="button"
            onClick={() => onFilterChange(filter)}
            variant={quickFilter === filter ? "default" : "outline"}
            size="sm"
            className={
              quickFilter === filter
                ? `border-slate-200 ${uiButton.primary}`
                : uiButton.subtle
            }
          >
            {filter === "TODAY" ? "Hoje" : filter === "TOMORROW" ? "Amanha" : "Esta semana"}
          </Button>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {stripDays.map((date) => {
          const iso = date.toISOString().slice(0, 10);
          const active =
            selectedDay.getFullYear() === date.getFullYear() &&
            selectedDay.getMonth() === date.getMonth() &&
            selectedDay.getDate() === date.getDate();
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onDateChange(iso)}
              className={`min-w-[58px] rounded-xl border px-3 py-2 text-center transition-transform active:scale-95 ${
                active
                  ? "border-sky-500 bg-sky-50 text-sky-600"
                  : "border-slate-200 bg-white text-slate-600 active:bg-slate-50"
              }`}
            >
              <p className="text-[11px] uppercase">{weekdayLabel.format(date).replace(".", "")}</p>
              <p className="text-sm font-semibold">{dayNumberLabel.format(date)}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
