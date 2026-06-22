import Link from "next/link";
import { Download } from "lucide-react";
import { Header } from "@/components/layout/header";
import { PageShell, PrimaryButton } from "@/app/(dashboard)/layout";
import { ChallanStatusForm } from "@/components/forms/challan-status-form";
import { FormCard } from "@/components/forms/form-fields";
import { formatEwayBillNumber } from "@/lib/eway-bill";
import { getChallanPurposeLabel } from "@/lib/constants/challan";
import { getChallanDetail } from "@/lib/challans";
import { requireBusiness } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const statusColors: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  DISPATCHED: "bg-blue-100 text-blue-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

export default async function ChallanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { businessId } = await requireBusiness();
  const { id } = await params;
  const challan = await getChallanDetail(businessId, id);

  const hasTransport =
    challan.dispatchPlace ||
    challan.deliveryPlace ||
    challan.vehicleNumber ||
    challan.transporterName ||
    challan.ewayBillNumber;

  return (
    <>
      <Header
        title={challan.challanNumber}
        description={`Delivery challan to ${challan.customer.name}`}
        action={
          <div className="flex flex-wrap gap-2">
            <PrimaryButton href={`/api/challans/${challan.id}/pdf`}>
              <span className="inline-flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download PDF
              </span>
            </PrimaryButton>
            <Link
              href="/challans"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Back
            </Link>
          </div>
        }
      />
      <PageShell>
        {challan.ewayBillNumber && (
          <div className="mb-6 rounded-xl border border-emerald-300 bg-emerald-50 px-6 py-4">
            <p className="text-xs font-semibold uppercase text-emerald-700">
              Government E-way Bill Linked
            </p>
            <p className="mt-1 font-mono text-2xl font-bold text-emerald-900">
              {formatEwayBillNumber(challan.ewayBillNumber)}
            </p>
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Delivery Challan
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-900">
                    {challan.business.name}
                  </h2>
                  {challan.business.gstin && (
                    <p className="text-sm text-slate-600">
                      GSTIN: {challan.business.gstin}
                    </p>
                  )}
                </div>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                    statusColors[challan.status]
                  }`}
                >
                  {challan.status}
                </span>
              </div>

              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Sent To
                  </p>
                  <p className="mt-2 font-medium text-slate-900">
                    {challan.customer.name}
                  </p>
                  {challan.customer.gstin && (
                    <p className="text-sm text-slate-600">
                      GSTIN: {challan.customer.gstin}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Challan Info
                  </p>
                  <dl className="mt-2 space-y-1 text-sm text-slate-600">
                    <div className="flex justify-between gap-4">
                      <dt>Date</dt>
                      <dd>{formatDate(challan.issueDate)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt>Purpose</dt>
                      <dd>{getChallanPurposeLabel(challan.purpose)}</dd>
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {challan.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm text-slate-900">
                          {item.description}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">
                          {item.hsnCode ?? item.product?.hsnCode ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-slate-700">
                          {item.quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {hasTransport && (
                <div className="mt-6 rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Transport Details
                  </p>
                  <dl className="mt-2 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                    {challan.dispatchPlace && (
                      <div>
                        <dt className="text-slate-500">Dispatch From</dt>
                        <dd>{challan.dispatchPlace}</dd>
                      </div>
                    )}
                    {challan.deliveryPlace && (
                      <div>
                        <dt className="text-slate-500">Delivery To</dt>
                        <dd>{challan.deliveryPlace}</dd>
                      </div>
                    )}
                    {challan.vehicleNumber && (
                      <div>
                        <dt className="text-slate-500">Vehicle</dt>
                        <dd>{challan.vehicleNumber}</dd>
                      </div>
                    )}
                    {challan.transporterName && (
                      <div>
                        <dt className="text-slate-500">Transporter</dt>
                        <dd>{challan.transporterName}</dd>
                      </div>
                    )}
                    {challan.ewayBillNumber && (
                      <div>
                        <dt className="text-slate-500">E-way Bill</dt>
                        <dd>{challan.ewayBillNumber}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              {challan.notes && (
                <div className="mt-6 rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">Notes</p>
                  <p className="mt-1 text-sm text-slate-700">{challan.notes}</p>
                </div>
              )}

              <p className="mt-6 text-xs text-slate-500">
                This is not a tax invoice. No GST is charged on a delivery challan.
              </p>
            </div>
          </div>

          <FormCard title="E-way Bill & Update">
            <ChallanStatusForm
              challanId={challan.id}
              status={challan.status}
              notes={challan.notes}
              dispatchPlace={challan.dispatchPlace}
              deliveryPlace={challan.deliveryPlace}
              vehicleNumber={challan.vehicleNumber}
              transporterName={challan.transporterName}
              transporterGstin={challan.transporterGstin}
              ewayBillNumber={challan.ewayBillNumber}
            />
          </FormCard>
        </div>
      </PageShell>
    </>
  );
}
