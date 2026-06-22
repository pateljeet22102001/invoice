import { accountingDb } from "@/lib/prisma-accounting";
import { ensureChartOfAccounts } from "@/lib/accounting/chart-of-accounts";
import type { Account, AccountType, JournalEntry, JournalLine } from "@/types/models";

export type AccountBalance = Account & {
  totalDebit: number;
  totalCredit: number;
  balance: number;
};

export type LedgerEntry = {
  id: string;
  entryDate: Date;
  voucherNumber: string;
  voucherType: string;
  narration: string | null;
  debit: number;
  credit: number;
  runningBalance: number;
};

export type TrialBalanceRow = {
  code: string;
  name: string;
  type: AccountType;
  debit: number;
  credit: number;
};

export type ProfitAndLoss = {
  income: number;
  expenses: number;
  netProfit: number;
  incomeAccounts: AccountBalance[];
  expenseAccounts: AccountBalance[];
};

function balanceForType(type: AccountType, debit: number, credit: number) {
  if (type === "ASSET" || type === "EXPENSE") {
    return Math.round((debit - credit) * 100) / 100;
  }
  return Math.round((credit - debit) * 100) / 100;
}

export async function getAccountBalances(
  businessId: string,
): Promise<AccountBalance[]> {
  await ensureChartOfAccounts(businessId);

  const accounts = (await accountingDb.account.findMany({
    where: { businessId },
    orderBy: { code: "asc" },
  })) as Account[];

  const balances: AccountBalance[] = [];

  for (const account of accounts) {
    const agg = (await accountingDb.journalLine.aggregate({
      where: { accountId: account.id },
      _sum: { debit: true, credit: true },
    })) as { _sum: { debit: number | null; credit: number | null } };

    const totalDebit = agg._sum.debit ?? 0;
    const totalCredit = agg._sum.credit ?? 0;

    balances.push({
      ...account,
      totalDebit,
      totalCredit,
      balance: balanceForType(account.type, totalDebit, totalCredit),
    });
  }

  return balances;
}

export async function getLedgerStatement(
  businessId: string,
  accountId: string,
): Promise<{ account: Account; entries: LedgerEntry[] } | null> {
  await ensureChartOfAccounts(businessId);

  const account = (await accountingDb.account.findFirst({
    where: { id: accountId, businessId },
  })) as Account | null;

  if (!account) return null;

  const lines = (await accountingDb.journalLine.findMany({
    where: { accountId },
    include: {
      entry: true,
    },
    orderBy: [{ entry: { entryDate: "asc" } }, { entry: { createdAt: "asc" } }],
  })) as Array<
    JournalLine & {
      entry: JournalEntry;
    }
  >;

  let running = 0;
  const entries: LedgerEntry[] = lines.map((line) => {
    if (account.type === "ASSET" || account.type === "EXPENSE") {
      running += line.debit - line.credit;
    } else {
      running += line.credit - line.debit;
    }
    running = Math.round(running * 100) / 100;

    return {
      id: line.id,
      entryDate: line.entry.entryDate,
      voucherNumber: line.entry.voucherNumber,
      voucherType: line.entry.voucherType,
      narration: line.narration ?? line.entry.narration,
      debit: line.debit,
      credit: line.credit,
      runningBalance: running,
    };
  });

  return { account, entries };
}

export async function getTrialBalance(
  businessId: string,
): Promise<TrialBalanceRow[]> {
  const balances = await getAccountBalances(businessId);
  const rows: TrialBalanceRow[] = [];

  for (const account of balances) {
    if (account.totalDebit === 0 && account.totalCredit === 0) continue;

    if (account.type === "ASSET" || account.type === "EXPENSE") {
      const net = account.totalDebit - account.totalCredit;
      if (net > 0) {
        rows.push({
          code: account.code,
          name: account.name,
          type: account.type,
          debit: Math.round(net * 100) / 100,
          credit: 0,
        });
      } else if (net < 0) {
        rows.push({
          code: account.code,
          name: account.name,
          type: account.type,
          debit: 0,
          credit: Math.round(Math.abs(net) * 100) / 100,
        });
      }
    } else {
      const net = account.totalCredit - account.totalDebit;
      if (net > 0) {
        rows.push({
          code: account.code,
          name: account.name,
          type: account.type,
          debit: 0,
          credit: Math.round(net * 100) / 100,
        });
      } else if (net < 0) {
        rows.push({
          code: account.code,
          name: account.name,
          type: account.type,
          debit: Math.round(Math.abs(net) * 100) / 100,
          credit: 0,
        });
      }
    }
  }

  return rows;
}

export async function getProfitAndLoss(businessId: string): Promise<ProfitAndLoss> {
  const balances = await getAccountBalances(businessId);
  const incomeAccounts = balances.filter((a) => a.type === "INCOME" && a.balance !== 0);
  const expenseAccounts = balances.filter((a) => a.type === "EXPENSE" && a.balance !== 0);

  const income = incomeAccounts.reduce((sum, a) => sum + a.balance, 0);
  const expenses = expenseAccounts.reduce((sum, a) => sum + a.balance, 0);

  return {
    income: Math.round(income * 100) / 100,
    expenses: Math.round(expenses * 100) / 100,
    netProfit: Math.round((income - expenses) * 100) / 100,
    incomeAccounts,
    expenseAccounts,
  };
}

export async function getJournalEntries(businessId: string) {
  await ensureChartOfAccounts(businessId);

  return (await accountingDb.journalEntry.findMany({
    where: { businessId },
    include: {
      lines: {
        include: { account: { select: { code: true, name: true } } },
      },
    },
    orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }],
  })) as Array<
    JournalEntry & {
      lines: Array<
        JournalLine & { account: Pick<Account, "code" | "name"> }
      >;
    }
  >;
}

export async function getAccountingSummary(businessId: string) {
  const [balances, trialBalance, profitAndLoss, journals] = await Promise.all([
    getAccountBalances(businessId),
    getTrialBalance(businessId),
    getProfitAndLoss(businessId),
    getJournalEntries(businessId),
  ]);

  const totalDebit = trialBalance.reduce((sum, row) => sum + row.debit, 0);
  const totalCredit = trialBalance.reduce((sum, row) => sum + row.credit, 0);

  return {
    accountCount: balances.length,
    journalCount: journals.length,
    trialBalanced: Math.round(totalDebit * 100) === Math.round(totalCredit * 100),
    totalDebit,
    totalCredit,
    profitAndLoss,
    recentJournals: journals.slice(0, 10),
  };
}
