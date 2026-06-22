import { Header } from "@/components/layout/header";
import { PageShell } from "@/app/(dashboard)/layout";
import { InvoiceForm } from "@/components/forms/invoice-form";
import { FormCard } from "@/components/forms/form-fields";
import { usesTraderWorkflow } from "@/lib/constants/trader-workflow";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
  const { businessId } = await requireBusiness();

  const [business, customers, products] = await Promise.all([
    prisma.business.findUnique({
      where: { id: businessId },
      select: { state: true, gstin: true, businessType: true },
    }),
    prisma.customer.findMany({
      where: { businessId },
      select: { id: true, name: true, state: true, gstin: true },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: { businessId },
      include: { inventory: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const traderMode = usesTraderWorkflow(business?.businessType ?? "GENERAL_TRADING");

  return (
    <>
      <Header
        title={traderMode ? "New Sales Bill" : "New Invoice"}
        description={
          traderMode
            ? "Sell purchased stock — party, kg, and rate"
            : "Create a GST invoice for your customer"
        }
      />
      <PageShell>
        <FormCard
          title={traderMode ? "Sales details" : "Invoice Details"}
          description={
            traderMode
              ? "Select party and items from stock. No stock? Record a Purchase Bill first."
              : "Select customer, add products, and review GST totals."
          }
        >
          <InvoiceForm
            traderMode={traderMode}
            businessState={business?.state ?? null}
            businessGstin={business?.gstin ?? null}
            customers={customers}
            products={products.map((product) => ({
              id: product.id,
              name: product.name,
              sku: product.sku,
              unit: product.unit,
              unitPrice: product.unitPrice,
              gstRate: product.gstRate,
              stock: product.inventory?.quantity ?? 0,
            }))}
          />
        </FormCard>
      </PageShell>
    </>
  );
}
