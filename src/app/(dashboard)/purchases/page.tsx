import Link from "next/link";
import { Header } from "@/components/layout/header";
import { PageShell, PrimaryButton } from "@/app/(dashboard)/layout";
import { getPurchaseDb } from "@/lib/prisma-purchase";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/session";
import type { PurchaseWithSupplier } from "@/types/models";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const statusColors: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  RECEIVED: "bg-blue-100 text-blue-700",
  PAID: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

export default async function PurchasesPage() {
  const { businessId } = await requireBusiness();

  const purchases = (await getPurchaseDb(prisma).findMany({
    where: { businessId },
    include: { supplier: true },
    orderBy: { billDate: "desc" },
  })) as PurchaseWithSupplier[];

  return (
    <>
      <Header
        title="Purchase Bills"
        description="Buy stock from suppliers and farmers — stock updates automatically"
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/suppliers/new"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Add Supplier
            </Link>
            <PrimaryButton href="/purchases/new">+ New Purchase</PrimaryButton>
          </div>
        }
      />
      <PageShell>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Bill #
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Bill Date
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
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-sm text-slate-500">
                    No purchase bills yet. Record your first stock purchase from a
                    supplier or farmer.
                  </td>
                </tr>
              ) : (
                purchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium">
                      <Link
                        href={`/purchases/${purchase.id}`}
                        className="text-indigo-600 hover:text-indigo-500"
                      >
                        {purchase.purchaseNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        {purchase.purchaseType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {purchase.supplier.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDate(purchase.billDate)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {purchase.taxRate}%
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {formatCurrency(purchase.total)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          statusColors[purchase.status]
                        }`}
                      >
                        {purchase.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/purchases/${purchase.id}`}
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
