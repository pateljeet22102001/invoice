import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/app/(dashboard)/layout";
import { PurchaseForm, type PurchaseSupplierOption } from "@/components/forms/purchase-form";
import { getSupplierDb } from "@/lib/prisma-purchase";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function NewPurchasePage() {
  const { businessId } = await requireBusiness();

  const [business, suppliers, products] = await Promise.all([
    prisma.business.findUnique({
      where: { id: businessId },
      select: {
        state: true,
        gstin: true,
        commissionRate: true,
        name: true,
      },
    }),
    getSupplierDb(prisma).findMany({
      where: { businessId },
      select: {
        id: true,
        name: true,
        state: true,
        village: true,
        gstin: true,
        supplierType: true,
      },
      orderBy: { name: "asc" },
    }) as Promise<PurchaseSupplierOption[]>,
    prisma.product.findMany({
      where: { businessId },
      include: { inventory: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/purchases"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200/80 bg-white text-stone-600 shadow-sm transition hover:border-stone-300 hover:bg-stone-50 hover:text-stone-900"
            aria-label="Back to purchases"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
              Purchase Bill
            </h1>
            <p className="mt-0.5 text-sm text-stone-500">{business?.name}</p>
          </div>
        </div>

        <PurchaseForm
          businessState={business?.state ?? null}
          businessGstin={business?.gstin ?? null}
          defaultCommissionRate={business?.commissionRate ?? 2.5}
          suppliers={suppliers}
          products={products.map((product) => ({
            id: product.id,
            name: product.name,
            sku: product.sku,
            costPrice: product.costPrice,
            unit: product.unit,
            gstRate: product.gstRate,
            hsnCode: product.hsnCode,
            stock: product.inventory?.quantity ?? 0,
          }))}
        />
      </div>
    </PageShell>
  );
}
