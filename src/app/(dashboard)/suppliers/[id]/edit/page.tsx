import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/app/(dashboard)/layout";
import { SupplierForm } from "@/components/forms/supplier-form";
import { FormCard } from "@/components/forms/form-fields";
import { getSupplierDb } from "@/lib/prisma-purchase";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/session";
import type { Supplier } from "@/types/models";

export const dynamic = "force-dynamic";

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { businessId } = await requireBusiness();
  const { id } = await params;

  const supplier = (await getSupplierDb(prisma).findFirst({
    where: { id, businessId },
  })) as Supplier | null;

  if (!supplier) {
    notFound();
  }

  return (
    <>
      <Header
        title="Edit Supplier"
        description={`Update details for ${supplier.name}`}
      />
      <PageShell>
        <FormCard title="Supplier Details">
          <SupplierForm supplier={supplier} />
        </FormCard>
      </PageShell>
    </>
  );
}
