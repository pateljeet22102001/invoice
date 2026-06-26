import Link from "next/link";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/app/(dashboard)/layout";
import { getJournalEntries } from "@/lib/accounting/reports";
import { VOUCHER_META } from "@/lib/accounting/vouchers";
import { requireBusiness } from "@/lib/session";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const VOUCHER_TYPES = ["PAYMENT", "RECEIPT", "CONTRA"] as const;

const voucherLinks = [
  {
    type: "PAYMENT" as const,
    href: "/accounting/vouchers/payment/new",
    color: "border-rose-200 bg-rose-50 hover:border-rose-300",
    badge: "bg-rose-100 text-rose-800",
  },
  {
    type: "RECEIPT" as const,
    href: "/accounting/vouchers/receipt/new",
    color: "border-emerald-200 bg-emerald-50 hover:border-emerald-300",
    badge: "bg-emerald-100 text-emerald-800",
  },
  {
    type: "CONTRA" as const,
    href: "/accounting/vouchers/contra/new",
    color: "border-blue-200 bg-blue-50 hover:border-blue-300",
    badge: "bg-blue-100 text-blue-800",
  },
];

export default async function VouchersPage() {
  const { businessId } = await requireBusiness();
  const entries = await getJournalEntries(businessId);
  const vouchers = entries.filter(
    (entry) =>
      VOUCHER_TYPES.includes(entry.voucherType as (typeof VOUCHER_TYPES)[number]) &&
      entry.referenceType === "VOUCHER",
  );

  return (
    <>
      <Header
        title="Payment / Receipt / Contra"
        description="Tally-style cash vouchers — standalone from invoices"
      />
      <PageShell>
        <div className="grid gap-4 md:grid-cols-3">
          {voucherLinks.map((card) => {
            const meta = VOUCHER_META[card.type];
            return (
              <Link
                key={card.type}
                href={card.href}
                className={`rounded-2xl border p-6 shadow-sm transition ${card.color}`}
              >
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${card.badge}`}
                >
                  {card.type}
                </span>
                <h2 className="mt-3 text-lg font-semibold text-slate-900">
                  {meta.title}
                </h2>
                <p className="mt-2 text-sm text-slate-600">{meta.description}</p>
                <p className="mt-4 text-sm font-medium text-indigo-600">
                  + Create {card.type.toLowerCase()} →
                </p>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Recent Vouchers</h2>
            <p className="text-sm text-slate-500">
              Payment, receipt & contra entries (excludes invoice-linked receipts)
            </p>
          </div>

          {vouchers.length === 0 ? (
            <p className="px-6 py-8 text-sm text-slate-500">
              No vouchers yet. Create a payment, receipt, or contra entry above.
            </p>
          ) : (
            <div className="divide-y divide-slate-200">
              {vouchers.slice(0, 20).map((entry) => {
                const totalDebit = entry.lines.reduce(
                  (sum, line) => sum + line.debit,
                  0,
                );

                return (
                  <div key={entry.id} className="px-6 py-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {entry.voucherNumber}
                          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                            {entry.voucherType}
                          </span>
                        </p>
                        <p className="mt-1 text-sm text-slate-600">{entry.narration}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {formatDate(entry.entryDate)}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-slate-900">
                        {formatCurrency(totalDebit)}
                      </p>
                    </div>
                    <table className="mt-3 min-w-full text-sm">
                      <tbody className="divide-y divide-slate-100">
                        {entry.lines.map((line) => (
                          <tr key={line.id}>
                            <td className="py-1.5 text-slate-700">
                              {line.account.code} — {line.account.name}
                            </td>
                            <td className="py-1.5 text-right text-slate-600">
                              {line.debit > 0
                                ? `Dr ${formatCurrency(line.debit)}`
                                : `Cr ${formatCurrency(line.credit)}`}
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
