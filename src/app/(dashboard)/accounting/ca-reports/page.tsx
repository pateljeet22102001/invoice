import Link from "next/link";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/app/(dashboard)/layout";
import {
  CaExportLinks,
  CaPeriodForm,
} from "@/components/accounting/ca-reports-panel";
import { getCaReportPack } from "@/lib/accounting/ca-reports";
import {
  formatPeriodLabel,
  parseReportPeriod,
} from "@/lib/accounting/period";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/session";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CaReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { businessId } = await requireBusiness();
  const params = await searchParams;
  const period = parseReportPeriod(params.from, params.to);
  const fromStr = period.from.toISOString().slice(0, 10);
  const toStr = period.to.toISOString().slice(0, 10);

  const [business, pack] = await Promise.all([
    prisma.business.findUnique({
      where: { id: businessId },
      select: {
        name: true,
        tradeName: true,
        gstin: true,
        pan: true,
        state: true,
        address: true,
        city: true,
      },
    }),
    getCaReportPack(businessId, period),
  ]);

  return (
    <>
      <Header
        title="CA / Auditor Reports"
        description="Books of account, audit trail & CSV exports for your chartered accountant"
      />
      <PageShell>
        <div className="mb-6 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900">
          <p className="font-medium">For Chartered Accountants & tax auditors</p>
          <p className="mt-1 text-violet-800">
            Download trial balance, P&L, balance sheet, day book & audit trail as
            CSV. Default period is the current Indian financial year (Apr–Mar).
          </p>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Business profile</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Legal name</dt>
              <dd className="font-medium text-slate-900">{business?.name}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Trade name</dt>
              <dd className="font-medium text-slate-900">
                {business?.tradeName ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">GSTIN</dt>
              <dd className="font-mono font-medium text-slate-900">
                {business?.gstin ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">PAN</dt>
              <dd className="font-mono font-medium text-slate-900">
                {business?.pan ?? "—"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-slate-500">Address</dt>
              <dd className="font-medium text-slate-900">
                {[business?.address, business?.city, business?.state]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mb-6">
          <CaPeriodForm from={fromStr} to={toStr} />
        </div>

        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Export for CA</h2>
              <p className="mt-1 text-sm text-slate-500">
                Period: {formatPeriodLabel(period)}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                pack.trialBalanced
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {pack.trialBalanced ? "Trial balance OK" : "Review trial balance"}
            </span>
          </div>
          <div className="mt-4">
            <CaExportLinks from={fromStr} to={toStr} />
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Profit & Loss</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-600">Income</dt>
                <dd className="font-medium text-emerald-700">
                  {formatCurrency(pack.profitAndLoss.income)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Expenses</dt>
                <dd className="font-medium text-rose-700">
                  {formatCurrency(pack.profitAndLoss.expenses)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <dt className="font-medium text-slate-900">Net profit</dt>
                <dd className="font-bold text-indigo-600">
                  {formatCurrency(pack.profitAndLoss.netProfit)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Balance Sheet</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-600">Total assets</dt>
                <dd className="font-medium text-slate-900">
                  {formatCurrency(pack.balanceSheet.totalAssets)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Liabilities + equity + P&L</dt>
                <dd className="font-medium text-slate-900">
                  {formatCurrency(pack.balanceSheet.totalLiabilitiesAndEquity)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <dt className="font-medium text-slate-900">Status</dt>
                <dd
                  className={
                    pack.balanceSheet.balanced
                      ? "font-medium text-emerald-600"
                      : "font-medium text-amber-600"
                  }
                >
                  {pack.balanceSheet.balanced ? "Balanced" : "Check books"}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <section className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Day book</h2>
            <p className="text-sm text-slate-500">
              Chronological voucher lines in selected period
            </p>
          </div>
          {pack.dayBook.length === 0 ? (
            <p className="px-6 py-8 text-sm text-slate-500">No entries in this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Voucher
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Ledger
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                      Dr
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                      Cr
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pack.dayBook.slice(0, 40).map((row, index) => (
                    <tr key={`${row.voucherNumber}-${index}`} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(row.entryDate)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">
                          {row.voucherNumber}
                        </span>
                        <p className="text-xs text-slate-400">{row.voucherType}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {row.accountCode} — {row.accountName}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">
                        {row.debit > 0 ? formatCurrency(row.debit) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">
                        {row.credit > 0 ? formatCurrency(row.credit) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Audit trail</h2>
            <p className="text-sm text-slate-500">
              Who changed invoices, journals & vouchers
            </p>
          </div>
          {pack.auditLogs.length === 0 ? (
            <p className="px-6 py-8 text-sm text-slate-500">
              No audit events in this period yet.
            </p>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    When
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Reference
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    User
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pack.auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {log.action.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {log.entityLabel ?? log.entityType}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{log.performedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/accounting" className="text-indigo-600 hover:text-indigo-500">
            ← Back to accounting
          </Link>
        </p>
      </PageShell>
    </>
  );
}
