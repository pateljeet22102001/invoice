"use client";

import { Menu } from "lucide-react";
import { BRAND } from "@/lib/constants/brand";

export function MobileTopBar({
  businessName,
  onMenuOpen,
}: {
  businessName: string;
  onMenuOpen: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
      <button
        type="button"
        onClick={onMenuOpen}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">{BRAND.name}</p>
        <p className="truncate text-xs text-slate-500">{businessName}</p>
      </div>
    </header>
  );
}
