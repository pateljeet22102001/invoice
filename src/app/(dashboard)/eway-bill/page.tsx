import Link from "next/link";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/app/(dashboard)/layout";
import { EwayBillIntegrationComingSoon } from "@/components/eway-bill/integration-coming-soon";
import { BRAND } from "@/lib/constants/brand";
import { EWAY_BILL_GOVT_PORTAL } from "@/lib/eway-bill";

export const dynamic = "force-dynamic";

export default function EwayBillPage() {
  return (
    <>
      <Header
        title="E-way Bill Integration"
        description="Government GST portal connection — coming soon"
      />
      <PageShell>
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">For now (until API is connected)</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-amber-800">
            <li>Create your B2B GST Invoice or Delivery Challan in {BRAND.name}</li>
            <li>
              Generate e-way bill on{" "}
              <a
                href={EWAY_BILL_GOVT_PORTAL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline"
              >
                ewaybillgst.gov.in
              </a>
            </li>
            <li>
              Open the invoice → paste the 12-digit government number → Save
            </li>
          </ol>
        </div>

        <EwayBillIntegrationComingSoon />

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link
            href="/invoices"
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300"
          >
            <p className="font-semibold text-slate-900">B2B GST Invoices</p>
            <p className="mt-1 text-sm text-slate-500">
              Sale with tax — link e-way bill number after government generates it
            </p>
          </Link>
          <Link
            href="/challans"
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300"
          >
            <p className="font-semibold text-slate-900">Delivery Challans</p>
            <p className="mt-1 text-sm text-slate-500">
              Stock transfer — e-way bill for goods movement without sale
            </p>
          </Link>
        </div>
      </PageShell>
    </>
  );
}
