import Link from "next/link";
import { uiShell } from "./ui-tokens";

type DashboardHeaderProps = {
  formattedDate: string;
};

export function DashboardHeader({ formattedDate }: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
      <div>
        <p className={uiShell.eyebrow}>Dashboard</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">Agenda</h1>
        <p className="mt-1 text-sm text-slate-600">{formattedDate}</p>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/settings"
          className="rounded-lg border border-slate-100 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 active:scale-95 transition-transform"
        >
          Settings
        </Link>
        <Link
          href="/templates/new"
          className="rounded-lg border border-slate-100 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 active:scale-95 transition-transform"
        >
          Templates
        </Link>
      </div>
    </header>
  );
}
