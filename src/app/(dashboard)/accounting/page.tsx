import Link from "next/link";
import { Header } from "@/components/layout/header";
import { PageShell, PrimaryButton } from "@/app/(dashboard)/layout";
import { getAccountingSummary } from "@/lib/accounting/reports";
import { requireBusiness } from "@/lib/session";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccountingPage() {
  const { businessId } = await requireBusiness();
  const summary = await getAccountingSummary(businessId);

  return (
    <>
      <Header
        title="Accounting"
        description="Double-entry books — ledgers, journals, trial balance & P&L"
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/accounting/ca-reports"
              className="inline-flex items-center justify-center rounded-lg border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-800 transition hover:bg-violet-100"
            >
              CA / Auditor
            </Link>
            <Link
              href="/accounting/vouchers"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Payment / Receipt
            </Link>
            <Link
              href="/accounting/journals/new"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              + Journal Entry
            </Link>
            <PrimaryButton href="/accounting/ledgers">View Ledgers</PrimaryButton>
          </div>
        }
      />
      <PageShell>
        <div className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
          <p className="font-medium">Tally-style double-entry accounting</p>
          <p className="mt-1 text-indigo-800">
            GST invoices auto-post sales vouchers. Mark invoice as <strong>PAID</strong> for
            receipt. Use <strong>Payment / Receipt / Contra</strong> vouchers for standalone
            cash & bank entries — like Tally.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Ledgers",
              value: String(summary.accountCount),
              hint: "Chart of accounts",
              href: "/accounting/ledgers",
            },
            {
              label: "CA Reports",
              value: "Audit pack",
              hint: "CSV exports for auditor",
              href: "/accounting/ca-reports",
            },
            {
              label: "Vouchers",
              value: "Payment · Receipt · Contra",
              hint: "Cash & bank entries",
              href: "/accounting/vouchers",
            },
            {
              label: "Journal Entries",
              value: String(summary.journalCount),
              hint: "All vouchers",
              href: "/accounting/journals",
            },
            {
              label: "Net Profit",
              value: formatCurrency(summary.profitAndLoss.netProfit),
              hint: `Income ${formatCurrency(summary.profitAndLoss.income)}`,
              href: "/accounting/ledgers",
            },
            {
              label: "Trial Balance",
              value: summary.trialBalanced ? "Balanced" : "Check",
              hint: `${formatCurrency(summary.totalDebit)} Dr / ${formatCurrency(summary.totalCredit)} Cr`,
              href: "/accounting/trial-balance",
            },
          ].map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
            >
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{card.value}</p>
              <p className="mt-1 text-xs text-slate-500">{card.hint}</p>
            </Link>
          ))}
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Profit & Loss</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-600">Total Income</dt>
                <dd className="font-medium text-emerald-700">
                  {formatCurrency(summary.profitAndLoss.income)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Total Expenses</dt>
                <dd className="font-medium text-rose-700">
                  {formatCurrency(summary.profitAndLoss.expenses)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-3">
                <dt className="font-medium text-slate-900">Net Profit</dt>
                <dd className="font-bold text-indigo-600">
                  {formatCurrency(summary.profitAndLoss.netProfit)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Recent Journals</h2>
              <Link
                href="/accounting/journals"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                View all
              </Link>
            </div>
            {summary.recentJournals.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                No journal entries yet. Create an invoice or post a manual journal.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-100">
                {summary.recentJournals.map((entry) => (
                  <li key={entry.id} className="py-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900">
                        {entry.voucherNumber}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatDate(entry.entryDate)}
                      </span>
                    </div>
                    <p className="mt-1 text-slate-600">{entry.narration}</p>
                    <p className="mt-1 text-xs text-slate-400">{entry.voucherType}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </PageShell>
    </>
  );
}
