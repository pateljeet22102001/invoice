import Link from "next/link";
import { Header } from "@/components/layout/header";
import { PageShell, PrimaryButton } from "@/app/(dashboard)/layout";
import { getAccountBalances } from "@/lib/accounting/reports";
import { requireBusiness } from "@/lib/session";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

const typeColors: Record<string, string> = {
  ASSET: "bg-blue-100 text-blue-800",
  LIABILITY: "bg-amber-100 text-amber-800",
  EQUITY: "bg-purple-100 text-purple-800",
  INCOME: "bg-emerald-100 text-emerald-800",
  EXPENSE: "bg-rose-100 text-rose-800",
};

export default async function LedgersPage() {
  const { businessId } = await requireBusiness();
  const accounts = await getAccountBalances(businessId);

  return (
    <>
      <Header
        title="Ledgers"
        description="Chart of accounts with current balances"
        action={<PrimaryButton href="/accounting/journals/new">+ Journal</PrimaryButton>}
      />
      <PageShell>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Ledger Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Type
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Balance (₹)
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accounts.map((account) => (
                <tr key={account.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-mono text-slate-600">
                    {account.code}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {account.name}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        typeColors[account.type]
                      }`}
                    >
                      {account.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-slate-900">
                    {formatCurrency(account.balance)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/accounting/ledgers/${account.id}`}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Statement
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageShell>
    </>
  );
}
