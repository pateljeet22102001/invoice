import Link from "next/link";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/app/(dashboard)/layout";
import {
  getCustomerKhataList,
  getKhataSummary,
  getSupplierKhataList,
} from "@/lib/party-ledger";
import { requireBusiness } from "@/lib/session";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function KhataPage() {
  const { businessId } = await requireBusiness();

  const [summary, customers, suppliers] = await Promise.all([
    getKhataSummary(businessId),
    getCustomerKhataList(businessId),
    getSupplierKhataList(businessId),
  ]);

  return (
    <>
      <Header
        title="Party Ledger"
        description="Receivables and payables with parties — like a Tally ledger"
      />
      <PageShell>
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm font-medium text-emerald-800">You will receive</p>
            <p className="mt-2 text-2xl font-bold text-emerald-900">
              {formatCurrency(summary.totalReceivable)}
            </p>
            <p className="mt-1 text-xs text-emerald-700">
              {summary.customersWithDue} customers with pending invoices
            </p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
            <p className="text-sm font-medium text-rose-800">You will pay</p>
            <p className="mt-2 text-2xl font-bold text-rose-900">
              {formatCurrency(summary.totalPayable)}
            </p>
            <p className="mt-1 text-xs text-rose-700">
              {summary.suppliersWithDue} suppliers with unpaid purchases
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <KhataTable
            title="Customers — Receivable (to receive)"
            empty="No customer bills yet."
            rows={customers}
            hrefPrefix="/khata/customers"
            outstandingLabel="Pending"
          />
          <KhataTable
            title="Suppliers — Payable (to pay)"
            empty="No purchase bills yet."
            rows={suppliers}
            hrefPrefix="/khata/suppliers"
            outstandingLabel="Unpaid"
          />
        </div>
      </PageShell>
    </>
  );
}

function KhataTable({
  title,
  empty,
  rows,
  hrefPrefix,
  outstandingLabel,
}: {
  title: string;
  empty: string;
  rows: Array<{
    id: string;
    name: string;
    gstin: string | null;
    billCount: number;
    totalBilled: number;
    outstanding: number;
  }>;
  hrefPrefix: string;
  outstandingLabel: string;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </div>
      {rows.length === 0 ? (
        <p className="px-6 py-8 text-sm text-slate-500">{empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Party
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                  Bills
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                  Total
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                  {outstandingLabel}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`${hrefPrefix}/${row.id}`}
                      className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      {row.name}
                    </Link>
                    {row.gstin && (
                      <p className="text-xs text-slate-400">{row.gstin}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">{row.billCount}</td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    {formatCurrency(row.totalBilled)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-semibold ${
                      row.outstanding > 0 ? "text-rose-600" : "text-slate-400"
                    }`}
                  >
                    {formatCurrency(row.outstanding)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
