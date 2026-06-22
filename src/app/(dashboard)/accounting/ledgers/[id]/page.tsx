import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/app/(dashboard)/layout";
import { getLedgerStatement } from "@/lib/accounting/reports";
import { requireBusiness } from "@/lib/session";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LedgerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { businessId } = await requireBusiness();
  const { id } = await params;
  const statement = await getLedgerStatement(businessId, id);

  if (!statement) {
    notFound();
  }

  const { account, entries } = statement;
  const closingBalance =
    entries.length > 0 ? entries[entries.length - 1].runningBalance : 0;

  return (
    <>
      <Header
        title={`${account.code} — ${account.name}`}
        description={`${account.type} ledger statement`}
      />
      <PageShell>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/accounting/ledgers"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            ← Back to ledgers
          </Link>
          <p className="text-sm text-slate-600">
            Closing balance:{" "}
            <span className="font-semibold text-slate-900">
              {formatCurrency(closingBalance)}
            </span>
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {entries.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-slate-500">
              No transactions in this ledger yet.
            </p>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Voucher
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Narration
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                    Debit
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                    Credit
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(entry.entryDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-900">
                        {entry.voucherNumber}
                      </span>
                      <p className="text-xs text-slate-400">{entry.voucherType}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{entry.narration}</td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {entry.debit > 0 ? formatCurrency(entry.debit) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {entry.credit > 0 ? formatCurrency(entry.credit) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      {formatCurrency(entry.runningBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </PageShell>
    </>
  );
}
