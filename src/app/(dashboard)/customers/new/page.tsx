import { Header } from "@/components/layout/header";
import { PageShell } from "@/app/(dashboard)/layout";
import { CustomerForm } from "@/components/forms/customer-form";
import { FormCard } from "@/components/forms/form-fields";

export default function NewCustomerPage() {
  return (
    <>
      <Header
        title="Add Customer"
        description="Add a new customer to your business directory"
      />
      <PageShell>
        <FormCard
          title="Customer Details"
          description="Fill in the customer information below. GSTIN is optional."
        >
          <CustomerForm />
        </FormCard>
      </PageShell>
    </>
  );
}
