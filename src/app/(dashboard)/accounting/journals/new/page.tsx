import { Header } from "@/components/layout/header";
import { PageShell } from "@/app/(dashboard)/layout";
import { JournalForm } from "@/components/forms/journal-form";
import { accountingDb } from "@/lib/prisma-accounting";
import { ensureChartOfAccounts } from "@/lib/accounting/chart-of-accounts";
import { requireBusiness } from "@/lib/session";
import type { Account } from "@/types/models";

export const dynamic = "force-dynamic";

export default async function NewJournalPage() {
  const { businessId } = await requireBusiness();
  await ensureChartOfAccounts(businessId);

  const accounts = (await accountingDb.account.findMany({
    where: { businessId },
    orderBy: { code: "asc" },
  })) as Account[];

  return (
    <>
      <Header
        title="New Journal Entry"
        description="Manual double-entry voucher for adjustments, expenses, or transfers"
      />
      <PageShell>
        <JournalForm accounts={accounts} />
      </PageShell>
    </>
  );
}
