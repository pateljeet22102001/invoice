import Link from "next/link";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/app/(dashboard)/layout";
import { getTrialBalance } from "@/lib/accounting/reports";
import { requireBusiness } from "@/lib/session";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TrialBalancePage() {
  const { businessId } = await requireBusiness();
  const rows = await getTrialBalance(businessId);

  const totalDebit = rows.reduce((sum, row) => sum + row.debit, 0);
  const totalCredit = rows.reduce((sum, row) => sum + row.credit, 0);
  const balanced = Math.round(totalDebit * 100) === Math.round(totalCredit * 100);

  return (
    <>
      <Header
        title="Trial Balance"
        description="Debit and credit totals across all ledgers"
      />
      <PageShell>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/accounting"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            ← Back to accounting
          </Link>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              balanced
                ? "bg-emerald-100 text-emerald-800"
                : "bg-rose-100 text-rose-800"
            }`}
          >
            {balanced ? "Books balanced" : "Out of balance — review journals"}
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          {rows.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-slate-500">
              No transactions posted yet.
            </p>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Ledger
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                    Debit
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                    Credit
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.code} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-mono text-slate-600">{row.code}</td>
                    <td className="px-6 py-3 font-medium text-slate-900">{row.name}</td>
                    <td className="px-6 py-3 text-slate-500">{row.type}</td>
                    <td className="px-6 py-3 text-right text-slate-700">
                      {row.debit > 0 ? formatCurrency(row.debit) : "—"}
                    </td>
                    <td className="px-6 py-3 text-right text-slate-700">
                      {row.credit > 0 ? formatCurrency(row.credit) : "—"}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-semibold">
                  <td colSpan={3} className="px-6 py-3 text-slate-900">
                    Total
                  </td>
                  <td className="px-6 py-3 text-right text-slate-900">
                    {formatCurrency(totalDebit)}
                  </td>
                  <td className="px-6 py-3 text-right text-slate-900">
                    {formatCurrency(totalCredit)}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </PageShell>
    </>
  );
}
