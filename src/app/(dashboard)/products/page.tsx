import Link from "next/link";
import { Header } from "@/components/layout/header";
import { PageShell, PrimaryButton } from "@/app/(dashboard)/layout";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/session";
import type { ProductWithInventory } from "@/types/models";
import { formatCurrency } from "@/lib/utils";
import { formatQuantityWithUnit } from "@/lib/constants/product-units";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const { businessId } = await requireBusiness();

  const products: ProductWithInventory[] = await prisma.product.findMany({
    where: { businessId },
    include: { inventory: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <Header
        title="Products"
        description="Item list — items are added when you record a Purchase Bill"
        action={<PrimaryButton href="/purchases/new">+ Buy stock</PrimaryButton>}
      />
      <PageShell>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Price (INR)
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  GST %
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Stock
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                    No items yet. Go to{" "}
                    <Link href="/purchases/new" className="font-medium text-indigo-600 hover:underline">
                      Purchase Bill
                    </Link>{" "}
                    — enter item name on Purchase Bill; it is saved here automatically.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-900">
                      {product.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {product.unit === "kg" ? product.sku : `SKU: ${product.sku}`}
                      {product.hsnCode ? ` · HSN ${product.hsnCode}` : ""}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {formatCurrency(product.unitPrice)}
                    <span className="text-xs text-slate-400"> / {product.unit}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {product.gstRate}%
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {formatQuantityWithUnit(
                      product.inventory?.quantity ?? 0,
                      product.unit,
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/products/${product.id}/edit`}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Edit
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
