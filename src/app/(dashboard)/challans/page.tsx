import Link from "next/link";
import { Header } from "@/components/layout/header";
import { PageShell, PrimaryButton } from "@/app/(dashboard)/layout";
import { challanDb } from "@/lib/prisma-challan";
import { prisma } from "@/lib/prisma";
import { getChallanPurposeLabel } from "@/lib/constants/challan";
import { requireBusiness } from "@/lib/session";
import type { ChallanDetail } from "@/types/models";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const statusColors: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  DISPATCHED: "bg-blue-100 text-blue-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

export default async function ChallansPage() {
  const { businessId } = await requireBusiness();

  const challans = (await challanDb.findMany({
    where: { businessId },
    include: { customer: true, items: true },
    orderBy: { issueDate: "desc" },
  })) as (ChallanDetail & { items: ChallanDetail["items"] })[];

  return (
    <>
      <Header
        title="Delivery Challans"
        description="Stock transfer to other businesses — no GST tax invoice"
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/invoices/new"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              B2B GST Invoice
            </Link>
            <PrimaryButton href="/challans/new">+ New Challan</PrimaryButton>
          </div>
        }
      />
      <PageShell>
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>When to use:</strong> Sending stock to another businessman without
          a sale. For B2B sale with GST bill, use{" "}
          <Link href="/invoices/new" className="font-medium underline">
            GST Invoice
          </Link>
          .
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Challan #
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Receiver
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Purpose
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {challans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">
                    No delivery challans yet. Use this when moving stock to another
                    business without a GST sale.
                  </td>
                </tr>
              ) : (
                challans.map((challan) => (
                  <tr key={challan.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium">
                      <Link
                        href={`/challans/${challan.id}`}
                        className="text-indigo-600 hover:text-indigo-500"
                      >
                        {challan.challanNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {challan.customer.name}
                      {challan.customer.gstin && (
                        <p className="text-xs text-slate-400">
                          {challan.customer.gstin}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {getChallanPurposeLabel(challan.purpose)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDate(challan.issueDate)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {challan.items.length} item(s)
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          statusColors[challan.status]
                        }`}
                      >
                        {challan.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/challans/${challan.id}`}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        View
                      </Link>
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
