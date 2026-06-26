import Link from "next/link";
import { Receipt } from "lucide-react";
import { BRAND } from "@/lib/constants/brand";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-semibold">{BRAND.fullName}</p>
            <p className="text-sm text-indigo-200">{BRAND.tagline}</p>
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold leading-tight">
            Billing, stock, and GST accounts in one app
          </h2>
          <p className="mt-4 max-w-md text-sm leading-7 text-slate-300">
            GST invoices, delivery challans, stock, receipts, and CA reports.
            Built for Indian traders — as capable as Tally, easier to use daily.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-indigo-100">
            <li>• B2B GST invoices with WhatsApp sharing</li>
            <li>• Accounts, ledgers, and trial balance</li>
            <li>• GSTIN, HSN, CGST/SGST/IGST ready</li>
          </ul>
        </div>

        <p className="text-xs text-slate-400">© 2026 {BRAND.fullName}</p>
      </div>

      <div className="flex w-full flex-col justify-center px-4 py-8 sm:px-6 sm:py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <p className="text-lg font-semibold text-slate-900">{BRAND.fullName}</p>
            <p className="text-sm text-slate-500">{BRAND.tagline}</p>
          </div>

          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-2 text-sm text-slate-600">{subtitle}</p>

          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
