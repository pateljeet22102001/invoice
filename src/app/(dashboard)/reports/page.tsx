import Link from "next/link";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/app/(dashboard)/layout";
import { Gstr1ExportPanel } from "@/components/reports/gstr1-export-panel";
import { getGstReportData } from "@/lib/gst-reports";
import { requireBusiness } from "@/lib/session";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default async function GstReportsPage() {
  const { businessId } = await requireBusiness();
  const report = await getGstReportData(businessId);

  return (
    <>
      <Header
        title="GST Reports"
        description="Sales summary with CGST, SGST & IGST breakdown (India GST rules)"
      />
      <PageShell>
        <div className="mb-6">
          <Gstr1ExportPanel defaultPeriod={currentPeriod()} />
        </div>
        <div className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
          <p className="font-medium">How tax is calculated</p>
          <p className="mt-1 text-indigo-800">
            Same state as your business → <strong>CGST + SGST</strong> (50% each).
            Different state → <strong>IGST</strong> (full tax).
            State is auto-detected from GSTIN (first 2 digits).
          </p>
          {report.summary.businessGstin && (
            <p className="mt-2 text-xs text-indigo-700">
              Your GSTIN: {report.summary.businessGstin}
              {report.summary.businessState && ` · State: ${report.summary.businessState}`}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Taxable Sales",
              value: formatCurrency(report.summary.totalSales),
              hint: `${report.summary.invoiceCount} invoices`,
            },
            {
              label: "Total GST",
              value: formatCurrency(report.summary.totalTax),
              hint: "Excl. draft & cancelled",
            },
            {
              label: "CGST + SGST",
              value: formatCurrency(
                report.summary.totalCgst + report.summary.totalSgst,
              ),
              hint: `${report.summary.intraStateCount} intra-state`,
            },
            {
              label: "IGST",
              value: formatCurrency(report.summary.totalIgst),
              hint: `${report.summary.interStateCount} inter-state`,
            },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{card.value}</p>
              <p className="mt-1 text-xs text-slate-500">{card.hint}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Monthly Summary</h2>
            <p className="mt-1 text-sm text-slate-500">Sales and tax by month</p>

            {report.monthly.length === 0 ? (
              <p className="mt-6 text-sm text-slate-500">No invoice data yet.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase text-slate-500">
                      <th className="py-3 pr-4">Month</th>
                      <th className="py-3 pr-4 text-right">Sales</th>
                      <th className="py-3 pr-4 text-right">CGST</th>
                      <th className="py-3 pr-4 text-right">SGST</th>
                      <th className="py-3 pr-4 text-right">IGST</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.monthly.map((row) => (
                      <tr key={row.month}>
                        <td className="py-3 pr-4 font-medium text-slate-900">
                          {row.label}
                          <span className="ml-2 text-xs font-normal text-slate-400">
                            ({row.count})
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-right text-slate-700">
                          {formatCurrency(row.sales)}
                        </td>
                        <td className="py-3 pr-4 text-right text-slate-700">
                          {formatCurrency(row.cgst)}
                        </td>
                        <td className="py-3 pr-4 text-right text-slate-700">
                          {formatCurrency(row.sgst)}
                        </td>
                        <td className="py-3 pr-4 text-right text-slate-700">
                          {formatCurrency(row.igst)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Tax Split</h2>
            <p className="mt-1 text-sm text-slate-500">CGST vs SGST vs IGST totals</p>
            <dl className="mt-6 space-y-4">
              <div className="flex justify-between">
                <dt className="text-slate-600">CGST (Central GST)</dt>
                <dd className="font-semibold text-slate-900">
                  {formatCurrency(report.summary.totalCgst)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">SGST (State GST)</dt>
                <dd className="font-semibold text-slate-900">
                  {formatCurrency(report.summary.totalSgst)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-4">
                <dt className="text-slate-600">IGST (Inter-state)</dt>
                <dd className="font-semibold text-slate-900">
                  {formatCurrency(report.summary.totalIgst)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-4 text-base">
                <dt className="font-medium text-slate-900">Total GST Collected</dt>
                <dd className="font-bold text-indigo-600">
                  {formatCurrency(report.summary.totalTax)}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Invoice-wise GST</h2>
            <p className="text-sm text-slate-500">
              Each invoice with supply type and tax breakdown
            </p>
          </div>

          {report.invoices.length === 0 ? (
            <p className="px-6 py-8 text-sm text-slate-500">
              Create invoices to see GST reports here.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Invoice
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Customer / GSTIN
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Supply
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                      Taxable
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                      CGST
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                      SGST
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                      IGST
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          {inv.invoiceNumber}
                        </Link>
                        <p className="text-xs text-slate-400">
                          {formatDate(inv.issueDate)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {inv.customerName}
                        {inv.customerGstin && (
                          <p className="text-xs text-slate-400">{inv.customerGstin}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            inv.isInterState
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {inv.isInterState ? "IGST" : "CGST+SGST"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">
                        {formatCurrency(inv.subtotal)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">
                        {formatCurrency(inv.cgst)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">
                        {formatCurrency(inv.sgst)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">
                        {formatCurrency(inv.igst)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PageShell>
    </>
  );
}
