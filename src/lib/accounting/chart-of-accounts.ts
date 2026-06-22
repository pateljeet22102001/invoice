import { ACCOUNT_CODES } from "@/lib/accounting/account-codes";
import { getAccountingDb } from "@/lib/prisma-accounting";

type AccountSeed = {
  code: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE";
};

export const DEFAULT_CHART_OF_ACCOUNTS: AccountSeed[] = [
  { code: ACCOUNT_CODES.CASH, name: "Cash in Hand", type: "ASSET" },
  { code: ACCOUNT_CODES.BANK, name: "Bank Account", type: "ASSET" },
  { code: ACCOUNT_CODES.SUNDRY_DEBTORS, name: "Sundry Debtors", type: "ASSET" },
  { code: ACCOUNT_CODES.INVENTORY, name: "Stock / Inventory", type: "ASSET" },
  { code: ACCOUNT_CODES.GST_INPUT_CGST, name: "GST Input CGST", type: "ASSET" },
  { code: ACCOUNT_CODES.GST_INPUT_SGST, name: "GST Input SGST", type: "ASSET" },
  { code: ACCOUNT_CODES.GST_INPUT_IGST, name: "GST Input IGST", type: "ASSET" },
  { code: ACCOUNT_CODES.SUNDRY_CREDITORS, name: "Sundry Creditors", type: "LIABILITY" },
  { code: ACCOUNT_CODES.GST_OUTPUT_CGST, name: "GST Output CGST", type: "LIABILITY" },
  { code: ACCOUNT_CODES.GST_OUTPUT_SGST, name: "GST Output SGST", type: "LIABILITY" },
  { code: ACCOUNT_CODES.GST_OUTPUT_IGST, name: "GST Output IGST", type: "LIABILITY" },
  { code: ACCOUNT_CODES.CAPITAL, name: "Capital Account", type: "EQUITY" },
  { code: ACCOUNT_CODES.SALES, name: "Sales", type: "INCOME" },
  { code: ACCOUNT_CODES.COGS, name: "Cost of Goods Sold", type: "EXPENSE" },
  { code: ACCOUNT_CODES.PURCHASE, name: "Purchase", type: "EXPENSE" },
  { code: ACCOUNT_CODES.APMC_COMMISSION, name: "APMC Market Commission", type: "EXPENSE" },
];

export async function ensureChartOfAccounts(
  businessId: string,
  client?: unknown,
) {
  const db = getAccountingDb(client);

  for (const account of DEFAULT_CHART_OF_ACCOUNTS) {
    const existing = (await db.account.findFirst({
      where: { businessId, code: account.code },
      select: { id: true },
    })) as { id: string } | null;

    if (!existing) {
      await db.account.create({
        data: {
          businessId,
          code: account.code,
          name: account.name,
          type: account.type,
          isSystem: true,
        },
      });
    }
  }
}
