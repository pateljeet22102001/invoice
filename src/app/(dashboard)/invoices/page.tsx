import Link from "next/link";
import { Header } from "@/components/layout/header";
import { PageShell, PrimaryButton } from "@/app/(dashboard)/layout";
import { InvoiceWhatsAppShare } from "@/components/invoices/invoice-whatsapp-share";
import { usesTraderWorkflow } from "@/lib/constants/trader-workflow";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/session";
import type { InvoiceWithCustomer } from "@/types/models";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const statusColors: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SENT: "bg-blue-100 text-blue-700",
  PAID: "bg-emerald-100 text-emerald-700",
  OVERDUE: "bg-rose-100 text-rose-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

export default async function InvoicesPage() {
  const { businessId, businessName } = await requireBusiness();

  const [business, invoices] = await Promise.all([
    prisma.business.findUnique({
      where: { id: businessId },
      select: { businessType: true },
    }),
    prisma.invoice.findMany({
      where: { businessId },
      include: { customer: true },
      orderBy: { issueDate: "desc" },
    }) as Promise<InvoiceWithCustomer[]>,
  ]);

  const traderMode = usesTraderWorkflow(business?.businessType ?? "GENERAL_TRADING");

  return (
    <>
      <Header
        title={traderMode ? "Sales Bill" : "Invoices"}
        description={
          traderMode
            ? "Sell stock to buyers — GST invoice when you have stock"
            : "B2B GST tax invoices and B2C retail bills"
        }
        action={
          <div className="flex flex-wrap gap-2">
            {traderMode && (
              <Link
                href="/purchases/new"
                className="inline-flex items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100"
              >
                Purchase stock first
              </Link>
            )}
            {!traderMode && (
              <Link
                href="/challans/new"
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Delivery Challan
              </Link>
            )}
            <PrimaryButton href="/invoices/new">
              {traderMode ? "+ New Sales Bill" : "+ B2B GST Invoice"}
            </PrimaryButton>
          </div>
        }
      />
      <PageShell>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Invoice #
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Issue Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  GST
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total (INR)
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-sm text-slate-500">
                    {traderMode ? (
                      <>
                        No sales yet. First{" "}
                        <Link href="/purchases/new" className="font-medium text-indigo-600 hover:underline">
                          purchase stock on Purchase Bill
                        </Link>
                        , then create a sales bill here.
                      </>
                    ) : (
                      <>
                        No invoices yet. Click &quot;New Invoice&quot; to create your first GST
                        invoice.
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium">
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="text-indigo-600 hover:text-indigo-500"
                    >
                      {invoice.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        invoice.invoiceType === "B2B"
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {invoice.invoiceType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900">
                    {invoice.customer.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {formatDate(invoice.issueDate)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {invoice.taxRate}%
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {formatCurrency(invoice.total)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        statusColors[invoice.status]
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <InvoiceWhatsAppShare
                        invoiceId={invoice.id}
                        invoiceNumber={invoice.invoiceNumber}
                        businessName={businessName}
                        customerName={invoice.customer.name}
                        customerPhone={invoice.customer.phone}
                        totalLabel={formatCurrency(invoice.total)}
                        dueDateLabel={formatDate(invoice.dueDate)}
                        compact
                      />
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        View
                      </Link>
                    </div>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </PageShell>
    </>
  );
}
