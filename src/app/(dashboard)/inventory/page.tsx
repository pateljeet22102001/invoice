import Link from "next/link";
import { Header } from "@/components/layout/header";
import { PageShell, PrimaryButton } from "@/app/(dashboard)/layout";
import { usesTraderWorkflow } from "@/lib/constants/trader-workflow";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/session";
import type { InventoryWithProduct } from "@/types/models";
import { formatQuantityWithUnit } from "@/lib/constants/product-units";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const { businessId } = await requireBusiness();

  const [business, inventory] = await Promise.all([
    prisma.business.findUnique({
      where: { id: businessId },
      select: { businessType: true },
    }),
    prisma.inventory.findMany({
      where: { product: { businessId } },
      include: { product: true },
      orderBy: { quantity: "asc" },
    }) as Promise<InventoryWithProduct[]>,
  ]);

  const traderMode = usesTraderWorkflow(business?.businessType ?? "GENERAL_TRADING");

  return (
    <>
      <Header
        title={traderMode ? "Stock" : "Inventory"}
        description={
          traderMode
            ? "Stock in kg per item — updated from Purchase Bill"
            : "Track stock levels and low-stock alerts"
        }
        action={
          traderMode ? (
            <PrimaryButton href="/purchases/new">+ Purchase Stock</PrimaryButton>
          ) : undefined
        }
      />
      <PageShell>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {traderMode ? "Item" : "Product"}
                </th>
                {!traderMode && (
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    SKU
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Low Stock At
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inventory.length === 0 ? (
                <tr>
                  <td
                    colSpan={traderMode ? 4 : 5}
                    className="px-6 py-8 text-center text-sm text-slate-500"
                  >
                    {traderMode ? (
                      <>
                        No stock yet.{" "}
                        <Link
                          href="/purchases/new"
                          className="font-medium text-indigo-600 hover:underline"
                        >
                          Buy on Purchase Bill
                        </Link>{" "}
                        — enter item name and quantity in kg.
                      </>
                    ) : (
                      "No inventory records yet."
                    )}
                  </td>
                </tr>
              ) : (
                inventory.map((item) => {
                  const isLow = item.quantity <= item.lowStockThreshold;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {item.product.name}
                      </td>
                      {!traderMode && (
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {item.product.sku}
                        </td>
                      )}
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {formatQuantityWithUnit(item.quantity, item.product.unit)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {formatQuantityWithUnit(
                          item.lowStockThreshold,
                          item.product.unit,
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            isLow
                              ? "bg-rose-100 text-rose-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {isLow ? "Low Stock" : "In Stock"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </PageShell>
    </>
  );
}
