export function MobileSkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-100 bg-white p-5">
      <div className="h-4 w-1/3 rounded bg-slate-100" />
      <div className="mt-3 h-5 w-2/3 rounded bg-slate-100" />
      <div className="mt-2 h-4 w-1/2 rounded bg-slate-100" />
      <div className="mt-5 h-10 w-full rounded-xl bg-slate-100" />
    </div>
  );
}
