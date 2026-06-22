import Link from "next/link";
import { ArrowRight, Package, FileText, Warehouse, IndianRupee } from "lucide-react";
import { BRAND } from "@/lib/constants/brand";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-indigo-300" />
            <span className="text-lg font-semibold">{BRAND.fullName}</span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            prefetch
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            prefetch
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
          >
            Sign Up
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20 pt-16">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-indigo-300">
            {BRAND.subtitle}
          </p>
          <h1 className="text-5xl font-bold leading-tight tracking-tight">
            GST Billing, Stock, and Accounts — All in One Place
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            For Indian shops, wholesalers, and traders. GST invoices, challans,
            stock, ledgers, and CA reports — in INR with GSTIN and HSN support.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/signup"
              prefetch
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
            >
              Start Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              prefetch
              className="inline-flex items-center rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="mt-20 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Package,
              title: "Products & HSN",
              text: "Catalog with SKU, INR pricing, GST rates, and HSN codes.",
            },
            {
              icon: Warehouse,
              title: "Inventory",
              text: "Real-time stock tracking with low-stock alerts.",
            },
            {
              icon: FileText,
              title: "GST Invoices",
              text: "Professional tax invoices linked to customers and products.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/20">
                <Icon className="h-5 w-5 text-indigo-300" />
              </div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
