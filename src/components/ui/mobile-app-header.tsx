"use client";

import { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type MobileAppHeaderProps = {
  title: string;
  rightSlot?: ReactNode;
  showBackButton?: boolean;
};

export function MobileAppHeader({
  title,
  rightSlot,
  showBackButton = false,
}: MobileAppHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-5 sm:px-6">
        <div className="w-10">
          {showBackButton ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="active:scale-95 transition-transform"
              onClick={() => router.back()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
        <p className="text-base font-semibold tracking-tight text-slate-900">{title}</p>
        <div className="flex w-10 justify-end">{rightSlot}</div>
      </div>
    </header>
  );
}
