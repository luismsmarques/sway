type DashboardHeaderProps = {
  formattedDate: string;
};

export function DashboardHeader({ formattedDate }: DashboardHeaderProps) {
  return (
    <header className="px-6 py-3">
      <p className="text-sm text-slate-500">{formattedDate}</p>
    </header>
  );
}
