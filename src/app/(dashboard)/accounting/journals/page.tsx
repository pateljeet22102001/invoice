import Link from "next/link";
import { Header } from "@/components/layout/header";
import { PageShell, PrimaryButton } from "@/app/(dashboard)/layout";
import { getJournalEntries } from "@/lib/accounting/reports";
import { requireBusiness } from "@/lib/session";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function JournalsPage() {
  const { businessId } = await requireBusiness();
  const entries = await getJournalEntries(businessId);

  return (
    <>
      <Header
        title="Journal Register"
        description="All accounting vouchers — sales, receipts, and manual journals"
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/accounting/vouchers"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Vouchers
            </Link>
            <PrimaryButton href="/accounting/journals/new">+ Journal Entry</PrimaryButton>
          </div>
        }
      />
      <PageShell>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {entries.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-slate-500">
              No journal entries yet. Post an invoice or create a manual journal.
            </p>
          ) : (
            <div className="divide-y divide-slate-200">
              {entries.map((entry) => {
                const totalDebit = entry.lines.reduce((sum, line) => sum + line.debit, 0);

                return (
                  <div key={entry.id} className="px-6 py-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {entry.voucherNumber}
                          {entry.isReversal && (
                            <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                              Reversal
                            </span>
                          )}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">{entry.narration}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {entry.voucherType} · {formatDate(entry.entryDate)}
                          {entry.referenceType === "INVOICE" && entry.referenceId && (
                            <>
                              {" "}
                              ·{" "}
                              <Link
                                href={`/invoices/${entry.referenceId}`}
                                className="text-indigo-600 hover:text-indigo-500"
                              >
                                View invoice
                              </Link>
                            </>
                          )}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-slate-900">
                        {formatCurrency(totalDebit)}
                      </p>
                    </div>

                    <table className="mt-4 min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs font-semibold uppercase text-slate-500">
                          <th className="pb-2 pr-4">Ledger</th>
                          <th className="pb-2 pr-4 text-right">Debit</th>
                          <th className="pb-2 text-right">Credit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {entry.lines.map((line) => (
                          <tr key={line.id}>
                            <td className="py-2 pr-4 text-slate-700">
                              {line.account.code} — {line.account.name}
                            </td>
                            <td className="py-2 pr-4 text-right text-slate-700">
                              {line.debit > 0 ? formatCurrency(line.debit) : "—"}
                            </td>
                            <td className="py-2 text-right text-slate-700">
                              {line.credit > 0 ? formatCurrency(line.credit) : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PageShell>
    </>
  );
}
