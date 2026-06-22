import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/app/(dashboard)/layout";
import { getCustomerKhataDetail } from "@/lib/party-ledger";
import { requireBusiness } from "@/lib/session";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CustomerKhataPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { businessId } = await requireBusiness();
  const { id } = await params;
  const detail = await getCustomerKhataDetail(businessId, id);

  if (!detail) notFound();

  return (
    <>
      <Header
        title={`${detail.party.name} — Ledger`}
        description="Customer receivable ledger"
        action={
          <Link
            href="/khata"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back to Party Ledger
          </Link>
        }
      />
      <PageShell>
        <KhataDetailView
          partyLabel="Customer"
          outstandingLabel="They owe you"
          detail={detail}
        />
      </PageShell>
    </>
  );
}

function KhataDetailView({
  partyLabel,
  outstandingLabel,
  detail,
}: {
  partyLabel: string;
  outstandingLabel: string;
  detail: NonNullable<Awaited<ReturnType<typeof getCustomerKhataDetail>>>;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase text-slate-500">{partyLabel}</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{detail.party.name}</p>
          {detail.party.gstin && (
            <p className="text-sm text-slate-500">GSTIN: {detail.party.gstin}</p>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase text-slate-500">Total billed</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatCurrency(detail.totalBilled)}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-xs font-semibold uppercase text-emerald-700">
            {outstandingLabel}
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-900">
            {formatCurrency(detail.outstanding)}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                Bill
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                Amount
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                Pending
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {detail.entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={entry.href} className="font-medium text-indigo-600">
                    {entry.number}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{formatDate(entry.date)}</td>
                <td className="px-4 py-3 text-slate-600">{entry.status}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(entry.total)}</td>
                <td
                  className={`px-4 py-3 text-right font-medium ${
                    entry.outstanding > 0 ? "text-rose-600" : "text-slate-400"
                  }`}
                >
                  {formatCurrency(entry.outstanding)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
