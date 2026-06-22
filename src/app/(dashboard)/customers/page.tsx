import Link from "next/link";
import { Header } from "@/components/layout/header";
import { PageShell, PrimaryButton } from "@/app/(dashboard)/layout";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/session";
import type { CustomerWithInvoiceCount } from "@/types/models";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const { businessId } = await requireBusiness();

  const customers: CustomerWithInvoiceCount[] = await prisma.customer.findMany({
    where: { businessId },
    include: { _count: { select: { invoices: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <Header
        title="Customers"
        description="Manage your customer directory with GSTIN support"
        action={<PrimaryButton href="/customers/new">+ Add Customer</PrimaryButton>}
      />
      <PageShell>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {customers.length === 0 ? (
            <p className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              No customers yet. Click &quot;Add Customer&quot; to create your first one.
            </p>
          ) : (
            customers.map((customer) => (
            <article
              key={customer.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-slate-900">
                {customer.name}
              </h3>
              {customer.email && (
                <p className="mt-2 text-sm text-slate-500">{customer.email}</p>
              )}
              {customer.phone && (
                <p className="text-sm text-slate-500">{customer.phone}</p>
              )}
              {customer.gstin && (
                <p className="mt-1 text-xs text-slate-500">
                  GSTIN: {customer.gstin}
                </p>
              )}
              {customer.state && (
                <p className="text-xs text-slate-500">{customer.state}</p>
              )}
              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-indigo-600">
                {customer._count.invoices} invoice
                {customer._count.invoices === 1 ? "" : "s"}
              </p>
              <Link
                href={`/customers/${customer.id}/edit`}
                className="mt-4 inline-flex text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Edit
              </Link>
            </article>
            ))
          )}
        </div>
      </PageShell>
    </>
  );
}
