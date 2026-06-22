import Link from "next/link";
import { Download } from "lucide-react";
import { Header } from "@/components/layout/header";
import { PageShell, PrimaryButton } from "@/app/(dashboard)/layout";
import { InvoiceStatusForm } from "@/components/forms/invoice-status-form";
import { FormCard } from "@/components/forms/form-fields";
import { InvoiceWhatsAppShare } from "@/components/invoices/invoice-whatsapp-share";
import { getInvoiceDetail } from "@/lib/invoices";
import { requireBusiness } from "@/lib/session";
import { splitGstTax } from "@/lib/gst";
import { formatEwayBillNumber } from "@/lib/eway-bill";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const statusColors: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SENT: "bg-blue-100 text-blue-700",
  PAID: "bg-emerald-100 text-emerald-700",
  OVERDUE: "bg-rose-100 text-rose-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { businessId } = await requireBusiness();
  const { id } = await params;
  const invoice = await getInvoiceDetail(businessId, id);

  const gstSplit =
    invoice.cgstAmount > 0 || invoice.sgstAmount > 0 || invoice.igstAmount > 0
      ? {
          cgst: invoice.cgstAmount,
          sgst: invoice.sgstAmount,
          igst: invoice.igstAmount,
          isInterState: invoice.isInterState,
          supplyLabel: invoice.isInterState
            ? "Inter-state supply (IGST)"
            : "Intra-state supply (CGST + SGST)",
        }
      : splitGstTax(
          invoice.taxAmount,
          invoice.business.state,
          invoice.customer.state,
          invoice.business.gstin,
          invoice.customer.gstin,
        );

  return (
    <>
      <Header
        title={invoice.invoiceNumber}
        description={`GST invoice for ${invoice.customer.name}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <InvoiceWhatsAppShare
              invoiceId={invoice.id}
              invoiceNumber={invoice.invoiceNumber}
              businessName={invoice.business.name}
              customerName={invoice.customer.name}
              customerPhone={invoice.customer.phone}
              totalLabel={formatCurrency(invoice.total)}
              dueDateLabel={formatDate(invoice.dueDate)}
            />
            <PrimaryButton href={`/api/invoices/${invoice.id}/pdf`}>
              <span className="inline-flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download PDF
              </span>
            </PrimaryButton>
            <Link
              href="/invoices"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Back to Invoices
            </Link>
          </div>
        }
      />
      <PageShell>
        {invoice.ewayBillNumber && (
          <div className="mb-6 rounded-xl border border-emerald-300 bg-emerald-50 px-6 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Government E-way Bill Linked
            </p>
            <p className="mt-1 font-mono text-2xl font-bold text-emerald-900">
              {formatEwayBillNumber(invoice.ewayBillNumber)}
            </p>
            <p className="mt-1 text-sm text-emerald-800">
              This number is from the GST government portal and appears on your invoice PDF.
            </p>
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Tax Invoice
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-900">
                    {invoice.business.name}
                  </h2>
                  {invoice.business.gstin && (
                    <p className="text-sm text-slate-600">
                      GSTIN: {invoice.business.gstin}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                      statusColors[invoice.status]
                    }`}
                  >
                    {invoice.status}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                      invoice.invoiceType === "B2B"
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {invoice.invoiceType} Invoice
                  </span>
                </div>
              </div>

              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Bill To
                  </p>
                  <p className="mt-2 font-medium text-slate-900">
                    {invoice.customer.name}
                  </p>
                  {invoice.customer.gstin && (
                    <p className="text-sm text-slate-600">
                      GSTIN: {invoice.customer.gstin}
                    </p>
                  )}
                  {invoice.customer.phone && (
                    <p className="text-sm text-slate-600">{invoice.customer.phone}</p>
                  )}
                  {invoice.customer.email && (
                    <p className="text-sm text-slate-600">{invoice.customer.email}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Invoice Info
                  </p>
                  <dl className="mt-2 space-y-1 text-sm text-slate-600">
                    <div className="flex justify-between gap-4">
                      <dt>Issue Date</dt>
                      <dd>{formatDate(invoice.issueDate)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt>Due Date</dt>
                      <dd>{formatDate(invoice.dueDate)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt>Type</dt>
                      <dd>{invoice.invoiceType}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {(invoice.dispatchPlace ||
                invoice.deliveryPlace ||
                invoice.vehicleNumber ||
                invoice.transporterName ||
                invoice.ewayBillNumber) && (
                <div className="mt-6 rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Transport / E-way Bill
                  </p>
                  <dl className="mt-2 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                    {invoice.dispatchPlace && (
                      <div>
                        <dt className="text-slate-500">Dispatch From</dt>
                        <dd>{invoice.dispatchPlace}</dd>
                      </div>
                    )}
                    {invoice.deliveryPlace && (
                      <div>
                        <dt className="text-slate-500">Delivery To</dt>
                        <dd>{invoice.deliveryPlace}</dd>
                      </div>
                    )}
                    {invoice.vehicleNumber && (
                      <div>
                        <dt className="text-slate-500">Vehicle</dt>
                        <dd>{invoice.vehicleNumber}</dd>
                      </div>
                    )}
                    {invoice.transporterName && (
                      <div>
                        <dt className="text-slate-500">Transporter</dt>
                        <dd>{invoice.transporterName}</dd>
                      </div>
                    )}
                    {invoice.ewayBillNumber && (
                      <div>
                        <dt className="text-slate-500">E-way Bill</dt>
                        <dd>{invoice.ewayBillNumber}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              <div className="mt-8 overflow-hidden rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                        Item
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                        HSN
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                        Rate
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                        GST
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoice.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm text-slate-900">
                          {item.description}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">
                          {item.product?.hsnCode ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-slate-700">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-slate-700">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-slate-700">
                          {item.gstRate}%
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-slate-900">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 ml-auto max-w-xs space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                {gstSplit.isInterState ? (
                  <div className="flex justify-between text-slate-600">
                    <span>IGST</span>
                    <span>{formatCurrency(gstSplit.igst)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>CGST</span>
                      <span>{formatCurrency(gstSplit.cgst)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>SGST</span>
                      <span>{formatCurrency(gstSplit.sgst)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between font-medium text-slate-700">
                  <span>GST Total</span>
                  <span>{formatCurrency(invoice.taxAmount)}</span>
                </div>
                <p className="text-xs text-slate-500">{gstSplit.supplyLabel}</p>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900">
                  <span>Grand Total</span>
                  <span>{formatCurrency(invoice.total)}</span>
                </div>
              </div>

              {invoice.notes && (
                <div className="mt-6 rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">Notes</p>
                  <p className="mt-1 text-sm text-slate-700">{invoice.notes}</p>
                </div>
              )}
            </div>
          </div>

          <FormCard title="E-way Bill & Update">
            <InvoiceStatusForm
              invoiceId={invoice.id}
              status={invoice.status}
              notes={invoice.notes}
              dispatchPlace={invoice.dispatchPlace}
              deliveryPlace={invoice.deliveryPlace}
              vehicleNumber={invoice.vehicleNumber}
              transporterName={invoice.transporterName}
              transporterGstin={invoice.transporterGstin}
              ewayBillNumber={invoice.ewayBillNumber}
            />
          </FormCard>
        </div>
      </PageShell>
    </>
  );
}
