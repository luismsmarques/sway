import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuickFilter } from "./types";
import { uiButton } from "./ui-tokens";

type DashboardActionBarProps = {
  quickFilter: QuickFilter;
  selectedDateValue: string;
  onFilterChange: (filter: QuickFilter) => void;
  onDateChange: (value: string) => void;
  onAddSlot: () => void;
};

const FILTERS: QuickFilter[] = ["TODAY", "TOMORROW", "WEEK"];

export function DashboardActionBar({
  quickFilter,
  selectedDateValue,
  onFilterChange,
  onDateChange,
  onAddSlot,
}: DashboardActionBarProps) {
  return (
    <section className="border-b border-slate-200 px-6 py-4">
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

        <Input
          type="date"
          value={selectedDateValue}
          onChange={(event) => onDateChange(event.target.value)}
          className="h-9 w-[180px] border-slate-200 bg-white"
        />

        <Button
          type="button"
          onClick={onAddSlot}
          className={`ml-auto border border-slate-900 ${uiButton.primary}`}
        >
          <Plus className="h-4 w-4" />
          Adicionar slot
        </Button>
      </div>
    </section>
  );
}
