import { Header } from "@/components/layout/header";
import { PageShell } from "@/app/(dashboard)/layout";
import { ProductForm } from "@/components/forms/product-form";
import { FormCard } from "@/components/forms/form-fields";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/session";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { businessId } = await requireBusiness();
  const { id } = await params;

  const [product, business] = await Promise.all([
    prisma.product.findFirst({
      where: { id, businessId },
      include: { inventory: true },
    }),
    prisma.business.findUnique({
      where: { id: businessId },
      select: { businessType: true },
    }),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <>
      <Header
        title="Edit Product"
        description={`Update details for ${product.name}`}
      />
      <PageShell>
        <FormCard title="Product Details">
          <ProductForm
            product={product}
            businessType={business?.businessType ?? "GENERAL_TRADING"}
          />
        </FormCard>
      </PageShell>
    </>
  );
}
