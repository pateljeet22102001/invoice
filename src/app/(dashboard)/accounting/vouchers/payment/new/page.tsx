import Link from "next/link";
import { Header } from "@/components/layout/header";
import { PageShell } from "@/app/(dashboard)/layout";
import { VoucherForm } from "@/components/forms/voucher-form";
import { accountingDb } from "@/lib/prisma-accounting";
import { ensureChartOfAccounts } from "@/lib/accounting/chart-of-accounts";
import { requireBusiness } from "@/lib/session";
import type { Account } from "@/types/models";

export const dynamic = "force-dynamic";

async function loadAccounts(businessId: string) {
  await ensureChartOfAccounts(businessId);
  return (await accountingDb.account.findMany({
    where: { businessId },
    orderBy: { code: "asc" },
  })) as Account[];
}

export default async function PaymentVoucherPage() {
  const { businessId } = await requireBusiness();
  const accounts = await loadAccounts(businessId);

  return (
    <>
      <Header
        title="Payment Voucher"
        description="Record money paid to suppliers, expenses, or creditors"
      />
      <PageShell>
        <Link
          href="/accounting/vouchers"
          className="mb-6 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          ← Back to vouchers
        </Link>
        <VoucherForm voucherType="PAYMENT" accounts={accounts} />
      </PageShell>
    </>
  );
}
