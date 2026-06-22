import type { ReportPeriod } from "@/lib/accounting/period";
import { formatPeriodLabel } from "@/lib/accounting/period";
import type { BalanceSheet, DayBookRow } from "@/lib/accounting/ca-reports";

function escapeCsv(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function row(values: (string | number | null | undefined)[]) {
  return values.map(escapeCsv).join(",");
}

export function trialBalanceToCsv(
  businessName: string,
  period: ReportPeriod,
  rows: Array<{
    code: string;
    name: string;
    type: string;
    debit: number;
    credit: number;
  }>,
) {
  const lines = [
    `Trial Balance - ${businessName}`,
    `Period,${formatPeriodLabel(period)}`,
    "",
    row(["Code", "Ledger", "Type", "Debit (INR)", "Credit (INR)"]),
  ];

  let totalDebit = 0;
  let totalCredit = 0;

  for (const item of rows) {
    totalDebit += item.debit;
    totalCredit += item.credit;
    lines.push(
      row([item.code, item.name, item.type, item.debit, item.credit]),
    );
  }

  lines.push(row(["", "", "TOTAL", totalDebit, totalCredit]));
  return lines.join("\n");
}

export function profitLossToCsv(
  businessName: string,
  period: ReportPeriod,
  data: {
    income: number;
    expenses: number;
    netProfit: number;
    incomeAccounts: Array<{ code: string; name: string; balance: number }>;
    expenseAccounts: Array<{ code: string; name: string; balance: number }>;
  },
) {
  const lines = [
    `Profit & Loss - ${businessName}`,
    `Period,${formatPeriodLabel(period)}`,
    "",
    "Income",
    row(["Code", "Ledger", "Amount (INR)"]),
  ];

  for (const account of data.incomeAccounts) {
    lines.push(row([account.code, account.name, account.balance]));
  }
  lines.push(row(["", "Total Income", data.income]));
  lines.push("");
  lines.push("Expenses");
  lines.push(row(["Code", "Ledger", "Amount (INR)"]));

  for (const account of data.expenseAccounts) {
    lines.push(row([account.code, account.name, account.balance]));
  }

  lines.push(row(["", "Total Expenses", data.expenses]));
  lines.push(row(["", "Net Profit", data.netProfit]));
  return lines.join("\n");
}

export function balanceSheetToCsv(
  businessName: string,
  period: ReportPeriod,
  sheet: BalanceSheet,
) {
  const lines = [
    `Balance Sheet - ${businessName}`,
    `As on,${period.to.toLocaleDateString("en-IN")}`,
    "",
    "Assets",
    row(["Code", "Ledger", "Amount (INR)"]),
  ];

  for (const account of sheet.assets) {
    lines.push(row([account.code, account.name, account.balance]));
  }
  lines.push(row(["", "Total Assets", sheet.totalAssets]));
  lines.push("");
  lines.push("Liabilities");
  lines.push(row(["Code", "Ledger", "Amount (INR)"]));

  for (const account of sheet.liabilities) {
    lines.push(row([account.code, account.name, account.balance]));
  }

  lines.push("");
  lines.push("Equity");
  lines.push(row(["Code", "Ledger", "Amount (INR)"]));

  for (const account of sheet.equity) {
    lines.push(row([account.code, account.name, account.balance]));
  }
  lines.push(row(["", "Profit & Loss A/c (period)", sheet.netProfit]));
  lines.push(
    row(["", "Total Liabilities & Equity", sheet.totalLiabilitiesAndEquity]),
  );

  return lines.join("\n");
}

export function dayBookToCsv(
  businessName: string,
  period: ReportPeriod,
  rows: DayBookRow[],
) {
  const lines = [
    `Day Book - ${businessName}`,
    `Period,${formatPeriodLabel(period)}`,
    "",
    row([
      "Date",
      "Voucher",
      "Type",
      "Narration",
      "Ledger Code",
      "Ledger Name",
      "Debit",
      "Credit",
    ]),
  ];

  for (const item of rows) {
    lines.push(
      row([
        item.entryDate.toISOString().slice(0, 10),
        item.voucherNumber,
        item.voucherType,
        item.narration,
        item.accountCode,
        item.accountName,
        item.debit,
        item.credit,
      ]),
    );
  }

  return lines.join("\n");
}

export function auditLogToCsv(
  businessName: string,
  period: ReportPeriod,
  logs: Array<{
    createdAt: Date;
    action: string;
    entityType: string;
    entityLabel: string | null;
    performedBy: string;
    details: string | null;
  }>,
) {
  const lines = [
    `Audit Trail - ${businessName}`,
    `Period,${formatPeriodLabel(period)}`,
    "",
    row(["Date/Time", "Action", "Entity", "Reference", "User", "Details"]),
  ];

  for (const log of logs) {
    lines.push(
      row([
        log.createdAt.toISOString(),
        log.action,
        log.entityType,
        log.entityLabel,
        log.performedBy,
        log.details,
      ]),
    );
  }

  return lines.join("\n");
}

export function csvResponse(csv: string, filename: string) {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
