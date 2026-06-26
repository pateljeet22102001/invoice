"use client";

import { useEffect, useState } from "react";
import { MobileTopBar } from "@/components/layout/mobile-top-bar";
import { Sidebar } from "@/components/layout/sidebar";

export function DashboardShell({
  businessName,
  userName,
  businessType,
  children,
}: {
  businessName: string;
  userName: string;
  businessType: string;
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {mobileNavOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <Sidebar
        businessName={businessName}
        userName={userName}
        businessType={businessType}
        mobileOpen={mobileNavOpen}
        onNavigate={() => setMobileNavOpen(false)}
      />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <MobileTopBar
          businessName={businessName}
          onMenuOpen={() => setMobileNavOpen(true)}
        />
        {children}
      </div>
    </div>
  );
}
