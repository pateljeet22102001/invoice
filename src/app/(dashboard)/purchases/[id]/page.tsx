import Link from "next/link";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/app/(dashboard)/layout";
import { PurchaseStatusForm } from "@/components/forms/purchase-status-form";
import { FormCard } from "@/components/forms/form-fields";
import { PurchasePrintActions } from "@/components/purchases/purchase-print-actions";
import { purchaseTypeLabel } from "@/lib/constants/supplier-types";
import { purchasePaymentModeLabel } from "@/lib/constants/payment-modes";
import { getPurchaseDetail } from "@/lib/purchases";
import { requireBusiness } from "@/lib/session";
import { splitGstTax } from "@/lib/gst";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const statusColors: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  RECEIVED: "bg-blue-100 text-blue-700",
  PAID: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

export default async function PurchaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { businessId } = await requireBusiness();
  const { id } = await params;
  const purchase = await getPurchaseDetail(businessId, id);

  const gstSplit =
    purchase.cgstAmount > 0 || purchase.sgstAmount > 0 || purchase.igstAmount > 0
      ? {
          cgst: purchase.cgstAmount,
          sgst: purchase.sgstAmount,
          igst: purchase.igstAmount,
          isInterState: purchase.isInterState,
          supplyLabel: purchase.isInterState
            ? "Inter-state purchase (IGST input)"
            : "Intra-state purchase (CGST + SGST input)",
        }
      : splitGstTax(
          purchase.taxAmount,
          purchase.business.state,
          purchase.supplier.state,
          purchase.business.gstin,
          purchase.supplier.gstin,
        );

  return (
    <>
      <Header
        title={purchase.purchaseNumber}
        description={`Purchase from ${purchase.supplier.name}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <PurchasePrintActions
              purchaseId={purchase.id}
              purchaseNumber={purchase.purchaseNumber}
              purchaseType={purchase.purchaseType}
            />
            <Link
              href="/purchases"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Back to Purchases
            </Link>
          </div>
        }
      />
      <PageShell>
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Purchase Bill
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-900">
                    {purchase.business.name}
                  </h2>
                  {purchase.business.gstin && (
                    <p className="text-sm text-slate-600">
                      GSTIN: {purchase.business.gstin}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                      statusColors[purchase.status]
                    }`}
                  >
                    {purchase.status}
                  </span>
                  <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                    {purchaseTypeLabel(purchase.purchaseType)}
                  </span>
                </div>
              </div>

              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {purchase.purchaseType === "APMC_MANDI"
                      ? "Mandi shop"
                      : purchase.purchaseType === "FARMER"
                        ? "Farmer"
                        : "Supplier"}
                  </p>
                  <p className="mt-2 font-medium text-slate-900">
                    {purchase.supplier.name}
                  </p>
                  {purchase.supplier.gstin && (
                    <p className="text-sm text-slate-600">
                      GSTIN: {purchase.supplier.gstin}
                    </p>
                  )}
                  {purchase.supplier.pan && (
                    <p className="text-sm text-slate-600">
                      PAN: {purchase.supplier.pan}
                    </p>
                  )}
                  {purchase.purchaseType === "APMC_MANDI" && purchase.mandiShopNo && (
                    <p className="text-sm text-slate-600">
                      Shop no.: {purchase.mandiShopNo}
                    </p>
                  )}
                  {purchase.purchaseType !== "APMC_MANDI" && purchase.supplier.village && (
                    <p className="text-sm text-slate-600">
                      {purchase.supplier.village}
                    </p>
                  )}
                  {purchase.supplier.phone && (
                    <p className="text-sm text-slate-600">
                      {purchase.supplier.phone}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Bill Info
                  </p>
                  <dl className="mt-2 space-y-1 text-sm text-slate-600">
                    <div className="flex justify-between gap-4">
                      <dt>Bill Date</dt>
                      <dd>{formatDate(purchase.billDate)}</dd>
                    </div>
                    {purchase.supplierInvoiceNo && (
                      <div className="flex justify-between gap-4">
                        <dt>
                          {purchase.purchaseType === "APMC_MANDI"
                            ? "I-Form No."
                            : "Supplier GST Bill No."}
                        </dt>
                        <dd>{purchase.supplierInvoiceNo}</dd>
                      </div>
                    )}
                    <div className="flex justify-between gap-4">
                      <dt>Payment</dt>
                      <dd>{purchasePaymentModeLabel(purchase.paymentMode ?? "CASH")}</dd>
                    </div>
                    {purchase.paymentMode === "CHEQUE" && purchase.chequeNumber && (
                      <div className="flex justify-between gap-4">
                        <dt>Cheque No.</dt>
                        <dd>{purchase.chequeNumber}</dd>
                      </div>
                    )}
                    {purchase.paymentMode !== "CASH" && (
                      <div className="flex justify-between gap-4">
                        <dt>
                          {purchase.paymentMode === "CHEQUE"
                            ? "Cheque Due Date"
                            : "Pay By Date"}
                        </dt>
                        <dd>{formatDate(purchase.dueDate)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between gap-4">
                      <dt>Type</dt>
                      <dd>{purchase.purchaseType}</dd>
                    </div>
                  </dl>
                </div>
              </div>

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
                    {purchase.items.map((item) => (
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
                          {formatCurrency(item.unitCost)}
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
                  <span>{formatCurrency(purchase.subtotal)}</span>
                </div>
                {gstSplit.isInterState ? (
                  <div className="flex justify-between text-slate-600">
                    <span>IGST (input)</span>
                    <span>{formatCurrency(gstSplit.igst)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>CGST (input)</span>
                      <span>{formatCurrency(gstSplit.cgst)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>SGST (input)</span>
                      <span>{formatCurrency(gstSplit.sgst)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between font-medium text-slate-700">
                  <span>GST Total</span>
                  <span>{formatCurrency(purchase.taxAmount)}</span>
                </div>
                {purchase.commissionAmount > 0 && (
                  <>
                    <div className="flex justify-between text-amber-800">
                      <span>
                        APMC Commission
                        {purchase.commissionRate != null
                          ? ` (${purchase.commissionRate}%)`
                          : ""}
                      </span>
                      <span>{formatCurrency(purchase.commissionAmount)}</span>
                    </div>
                    {purchase.commissionAgent && (
                      <p className="text-xs text-amber-700">
                        Commission agent: {purchase.commissionAgent.name}
                      </p>
                    )}
                  </>
                )}
                <p className="text-xs text-slate-500">{gstSplit.supplyLabel}</p>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900">
                  <span>Total Payable</span>
                  <span>{formatCurrency(purchase.total)}</span>
                </div>
              </div>

              {purchase.notes && (
                <div className="mt-6 rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">Notes</p>
                  <p className="mt-1 text-sm text-slate-700">{purchase.notes}</p>
                </div>
              )}
            </div>
          </div>

          <FormCard title="Update Purchase">
            <PurchaseStatusForm
              purchaseId={purchase.id}
              status={purchase.status}
              notes={purchase.notes}
            />
          </FormCard>
        </div>
      </PageShell>
    </>
  );
}
