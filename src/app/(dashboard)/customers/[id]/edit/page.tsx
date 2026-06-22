import { Header } from "@/components/layout/header";
import { PageShell } from "@/app/(dashboard)/layout";
import { CustomerForm } from "@/components/forms/customer-form";
import { FormCard } from "@/components/forms/form-fields";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/session";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { businessId } = await requireBusiness();
  const { id } = await params;

  const customer = await prisma.customer.findFirst({
    where: { id, businessId },
  });

  if (!customer) {
    notFound();
  }

  return (
    <>
      <Header
        title="Edit Customer"
        description={`Update details for ${customer.name}`}
      />
      <PageShell>
        <FormCard title="Customer Details">
          <CustomerForm customer={customer} />
        </FormCard>
      </PageShell>
    </>
  );
}
