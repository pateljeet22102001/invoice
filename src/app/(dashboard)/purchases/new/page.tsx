import { Header } from "@/components/layout/header";
import { PageShell } from "@/app/(dashboard)/layout";
import { PurchaseForm, type PurchaseSupplierOption } from "@/components/forms/purchase-form";
import { FormCard } from "@/components/forms/form-fields";
import { getSupplierDb } from "@/lib/prisma-purchase";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function NewPurchasePage() {
  const { businessId } = await requireBusiness();

  const [business, suppliers, products] = await Promise.all([
    prisma.business.findUnique({
      where: { id: businessId },
      select: { state: true, gstin: true, commissionRate: true },
    }),
    getSupplierDb(prisma).findMany({
      where: { businessId },
      select: {
        id: true,
        name: true,
        state: true,
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
    <>
      <Header
        title="Purchase Stock — Purchase Bill"
        description="Type item name here. Stock + item list update together — like Tally purchase."
      />
      <PageShell>
        <FormCard
          title="Purchase details"
          description="Farmer, APMC market, or trader. New farmer and item names on this bill are saved automatically."
        >
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
              stock: product.inventory?.quantity ?? 0,
            }))}
          />
        </FormCard>
      </PageShell>
    </>
  );
}
