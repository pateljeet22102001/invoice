import Link from "next/link";
import { Header } from "@/components/layout/header";
import { PageShell, PrimaryButton } from "@/app/(dashboard)/layout";
import { getSupplierDb } from "@/lib/prisma-purchase";
import { prisma } from "@/lib/prisma";
import { supplierTypeLabel } from "@/lib/constants/supplier-types";
import { requireBusiness } from "@/lib/session";
import type { SupplierWithPurchaseCount } from "@/types/models";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const { businessId } = await requireBusiness();

  const suppliers = (await getSupplierDb(prisma).findMany({
    where: { businessId },
    include: { _count: { select: { purchaseBills: true } } },
    orderBy: { name: "asc" },
  })) as SupplierWithPurchaseCount[];

  return (
    <>
      <Header
        title="Suppliers"
        description="B2B suppliers, farmers, APMC agents — your purchase parties"
        action={<PrimaryButton href="/suppliers/new">+ Add Supplier</PrimaryButton>}
      />
      <PageShell>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {suppliers.length === 0 ? (
            <p className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              No suppliers yet. Add B2B suppliers or farmers to record purchase bills.
            </p>
          ) : (
            suppliers.map((supplier) => (
              <article
                key={supplier.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                  {supplierTypeLabel(supplier.supplierType)}
                </span>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">
                  {supplier.name}
                </h3>
                {supplier.village && (
                  <p className="mt-1 text-sm text-slate-500">{supplier.village}</p>
                )}
                {supplier.phone && (
                  <p className="text-sm text-slate-500">{supplier.phone}</p>
                )}
                {supplier.gstin && (
                  <p className="mt-1 text-xs text-slate-500">
                    GSTIN: {supplier.gstin}
                  </p>
                )}
                {supplier.pan && (
                  <p className="text-xs text-slate-500">PAN: {supplier.pan}</p>
                )}
                {supplier.state && (
                  <p className="text-xs text-slate-500">{supplier.state}</p>
                )}
                <p className="mt-4 text-xs font-medium uppercase tracking-wide text-indigo-600">
                  {supplier._count.purchaseBills} purchase
                  {supplier._count.purchaseBills === 1 ? "" : "s"}
                </p>
                <Link
                  href={`/suppliers/${supplier.id}/edit`}
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
