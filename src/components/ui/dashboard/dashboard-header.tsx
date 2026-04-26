import { uiShell } from "./ui-tokens";

type DashboardHeaderProps = {
  formattedDate: string;
};

export function DashboardHeader({ formattedDate }: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
      <div>
        <p className={uiShell.eyebrow}>Dashboard</p>
        <h1 className={`mt-1 ${uiShell.sectionTitle}`}>Agenda do instrutor</h1>
        <p className="mt-1 text-sm text-slate-600">{formattedDate}</p>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
          U
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-900">Instrutor</p>
          <p className="text-xs text-slate-500">Conta ativa</p>
        </div>
      </div>
    </header>
  );
}
