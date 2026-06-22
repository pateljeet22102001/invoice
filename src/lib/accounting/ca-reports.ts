import { getAuditLogs } from "@/lib/accounting/audit-log";
import { ensureChartOfAccounts } from "@/lib/accounting/chart-of-accounts";
import type { ReportPeriod } from "@/lib/accounting/period";
import type { Account, AccountType } from "@/types/models";
import { accountingDb } from "@/lib/prisma-accounting";

export type AccountBalance = {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  totalDebit: number;
  totalCredit: number;
  balance: number;
};

export type BalanceSheet = {
  assets: AccountBalance[];
  liabilities: AccountBalance[];
  equity: AccountBalance[];
  netProfit: number;
  totalAssets: number;
  totalLiabilitiesAndEquity: number;
  balanced: boolean;
};

export type DayBookRow = {
  entryDate: Date;
  voucherNumber: string;
  voucherType: string;
  narration: string | null;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
};

function balanceForType(type: AccountType, debit: number, credit: number) {
  if (type === "ASSET" || type === "EXPENSE") {
    return Math.round((debit - credit) * 100) / 100;
  }
  return Math.round((credit - debit) * 100) / 100;
}

function entryDateFilter(period: ReportPeriod, mode: "range" | "asOf") {
  if (mode === "asOf") {
    return { entryDate: { lte: period.to } };
  }
  return { entryDate: { gte: period.from, lte: period.to } };
}

async function getAccountBalancesForPeriod(
  businessId: string,
  period: ReportPeriod,
  options?: { accountTypes?: AccountType[]; mode?: "range" | "asOf" },
): Promise<AccountBalance[]> {
  await ensureChartOfAccounts(businessId);

  const accounts = (await accountingDb.account.findMany({
    where: { businessId },
    orderBy: { code: "asc" },
  })) as Account[];

  const mode = options?.mode ?? "asOf";
  const types = options?.accountTypes;
  const balances: AccountBalance[] = [];

  for (const account of accounts) {
    if (types && !types.includes(account.type)) continue;

    const agg = (await accountingDb.journalLine.aggregate({
      where: {
        accountId: account.id,
        entry: entryDateFilter(period, mode),
      },
      _sum: { debit: true, credit: true },
    })) as { _sum: { debit: number | null; credit: number | null } };

    const totalDebit = agg._sum.debit ?? 0;
    const totalCredit = agg._sum.credit ?? 0;

    if (totalDebit === 0 && totalCredit === 0) continue;

    balances.push({
      id: account.id,
      code: account.code,
      name: account.name,
      type: account.type,
      totalDebit,
      totalCredit,
      balance: balanceForType(account.type, totalDebit, totalCredit),
    });
  }

  return balances;
}

export async function getTrialBalanceForPeriod(
  businessId: string,
  period: ReportPeriod,
) {
  const balances = await getAccountBalancesForPeriod(businessId, period, {
    mode: "asOf",
  });

  const rows = [];
  for (const account of balances) {
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

export async function getProfitAndLossForPeriod(
  businessId: string,
  period: ReportPeriod,
) {
  const balances = await getAccountBalancesForPeriod(businessId, period, {
    accountTypes: ["INCOME", "EXPENSE"],
    mode: "range",
  });

  const incomeAccounts = balances.filter((a) => a.type === "INCOME");
  const expenseAccounts = balances.filter((a) => a.type === "EXPENSE");
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

export async function getBalanceSheetForPeriod(
  businessId: string,
  period: ReportPeriod,
): Promise<BalanceSheet> {
  const [assets, liabilities, equity, profitAndLoss] = await Promise.all([
    getAccountBalancesForPeriod(businessId, period, {
      accountTypes: ["ASSET"],
      mode: "asOf",
    }),
    getAccountBalancesForPeriod(businessId, period, {
      accountTypes: ["LIABILITY"],
      mode: "asOf",
    }),
    getAccountBalancesForPeriod(businessId, period, {
      accountTypes: ["EQUITY"],
      mode: "asOf",
    }),
    getProfitAndLossForPeriod(businessId, period),
  ]);

  const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
  const totalLiabilities = liabilities.reduce((sum, a) => sum + a.balance, 0);
  const totalEquity = equity.reduce((sum, a) => sum + a.balance, 0);
  const netProfit = profitAndLoss.netProfit;
  const totalLiabilitiesAndEquity =
    totalLiabilities + totalEquity + netProfit;

  return {
    assets,
    liabilities,
    equity,
    netProfit,
    totalAssets: Math.round(totalAssets * 100) / 100,
    totalLiabilitiesAndEquity: Math.round(totalLiabilitiesAndEquity * 100) / 100,
    balanced:
      Math.round(totalAssets * 100) ===
      Math.round(totalLiabilitiesAndEquity * 100),
  };
}

export async function getDayBookForPeriod(
  businessId: string,
  period: ReportPeriod,
): Promise<DayBookRow[]> {
  await ensureChartOfAccounts(businessId);

  const lines = (await accountingDb.journalLine.findMany({
    where: {
      entry: {
        businessId,
        ...entryDateFilter(period, "range"),
      },
    },
    include: {
      entry: true,
      account: { select: { code: true, name: true } },
    },
    orderBy: [
      { entry: { entryDate: "asc" } },
      { entry: { voucherNumber: "asc" } },
      { id: "asc" },
    ],
  })) as Array<{
    debit: number;
    credit: number;
    entry: {
      entryDate: Date;
      voucherNumber: string;
      voucherType: string;
      narration: string | null;
    };
    account: { code: string; name: string };
  }>;

  return lines.map((line) => ({
    entryDate: line.entry.entryDate,
    voucherNumber: line.entry.voucherNumber,
    voucherType: line.entry.voucherType,
    narration: line.entry.narration,
    accountCode: line.account.code,
    accountName: line.account.name,
    debit: line.debit,
    credit: line.credit,
  }));
}

export async function getCaReportPack(
  businessId: string,
  period: ReportPeriod,
) {
  const [trialBalance, profitAndLoss, balanceSheet, dayBook, auditLogs] =
    await Promise.all([
      getTrialBalanceForPeriod(businessId, period),
      getProfitAndLossForPeriod(businessId, period),
      getBalanceSheetForPeriod(businessId, period),
      getDayBookForPeriod(businessId, period),
      getAuditLogs(businessId, { from: period.from, to: period.to, limit: 50 }),
    ]);

  const totalDebit = trialBalance.reduce((sum, row) => sum + row.debit, 0);
  const totalCredit = trialBalance.reduce((sum, row) => sum + row.credit, 0);

  return {
    period,
    trialBalance,
    trialBalanced: Math.round(totalDebit * 100) === Math.round(totalCredit * 100),
    totalDebit,
    totalCredit,
    profitAndLoss,
    balanceSheet,
    dayBook,
    auditLogs,
  };
}
