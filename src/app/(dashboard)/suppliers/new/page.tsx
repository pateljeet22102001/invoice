import { Header } from "@/components/layout/header";
import { PageShell } from "@/app/(dashboard)/layout";
import { SupplierForm } from "@/components/forms/supplier-form";
import { FormCard } from "@/components/forms/form-fields";

export default function NewSupplierPage() {
  return (
    <>
      <Header
        title="Add Supplier"
        description="Add a B2B supplier, farmer, or APMC agent"
      />
      <PageShell>
        <FormCard
          title="Supplier Details"
          description="Fields change by type — B2B needs GSTIN only; farmers need name and village."
        >
          <SupplierForm />
        </FormCard>
      </PageShell>
    </>
  );
}
