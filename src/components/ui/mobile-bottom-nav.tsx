"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Settings, Shapes } from "lucide-react";

const items = [
  { href: "/dashboard", label: "Agenda", icon: CalendarDays },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/templates/new", label: "Templates", icon: Shapes },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-100 bg-white/95 pb-[max(env(safe-area-inset-bottom),8px)] backdrop-blur-md md:hidden">
      <div className="mx-auto grid h-20 max-w-4xl grid-cols-3 px-5">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl text-center text-[10px] font-medium leading-none transition-transform active:scale-95 ${
                active ? "text-sky-500" : "text-slate-500"
              }`}
            >
              <item.icon className={`h-6 w-6 ${active ? "text-sky-500" : "text-slate-400"}`} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
