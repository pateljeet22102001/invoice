import { Header } from "@/components/layout/header";
import { PageShell } from "@/app/(dashboard)/layout";
import { ChallanForm } from "@/components/forms/challan-form";
import { FormCard } from "@/components/forms/form-fields";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function NewChallanPage() {
  const { businessId } = await requireBusiness();

  const [customers, products] = await Promise.all([
    prisma.customer.findMany({
      where: { businessId },
      select: { id: true, name: true, gstin: true, state: true },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: { businessId },
      include: { inventory: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <>
      <Header
        title="New Delivery Challan"
        description="Send stock to another business without a GST tax invoice"
      />
      <PageShell>
        <FormCard
          title="Stock Transfer"
          description="Goods movement only — no CGST/SGST/IGST on this document."
        >
          <ChallanForm
            customers={customers}
            products={products.map((product) => ({
              id: product.id,
              name: product.name,
              sku: product.sku,
              unit: product.unit,
              hsnCode: product.hsnCode,
              stock: product.inventory?.quantity ?? 0,
            }))}
          />
        </FormCard>
      </PageShell>
    </>
  );
}
