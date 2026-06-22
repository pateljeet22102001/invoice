import { ACCOUNT_CODES } from "@/lib/accounting/account-codes";
import { ensureChartOfAccounts } from "@/lib/accounting/chart-of-accounts";
import { getAccountingDb } from "@/lib/prisma-accounting";

type JournalLineInput = {
  accountCode: string;
  debit: number;
  credit: number;
  narration?: string;
};

type InvoiceForJournal = {
  id: string;
  invoiceNumber: string;
  issueDate: Date;
  subtotal: number;
  total: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
};

type InvoiceLineForCogs = {
  productId: string | null;
  quantity: number;
};

type ProductForCogs = {
  id: string;
  costPrice: number;
};

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

const VOUCHER_PREFIX: Record<string, string> = {
  JOURNAL: "JV",
  PAYMENT: "PY",
  RECEIPT: "RV",
  CONTRA: "CV",
  SALES: "SV",
  PURCHASE: "PV",
};

async function getAccountId(
  client: unknown,
  businessId: string,
  code: string,
): Promise<string> {
  const db = getAccountingDb(client);
  const account = (await db.account.findFirst({
    where: { businessId, code },
    select: { id: true },
  })) as { id: string } | null;

  if (!account) {
    throw new Error(`Account ${code} not found. Chart of accounts may be incomplete.`);
  }

  return account.id;
}

async function generateVoucherNumber(
  client: unknown,
  businessId: string,
  voucherType: string,
) {
  const db = getAccountingDb(client);
  const year = new Date().getFullYear();
  const prefix = `${VOUCHER_PREFIX[voucherType] ?? "JV"}-${year}-`;

  const latest = (await db.journalEntry.findFirst({
    where: { businessId, voucherNumber: { startsWith: prefix } },
    orderBy: { voucherNumber: "desc" },
    select: { voucherNumber: true },
  })) as { voucherNumber: string } | null;

  const lastSequence = latest
    ? Number.parseInt(latest.voucherNumber.replace(prefix, ""), 10)
    : 0;

  const next = Number.isFinite(lastSequence) ? lastSequence + 1 : 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

async function createBalancedEntry(
  client: unknown,
  businessId: string,
  params: {
    voucherType: string;
    entryDate: Date;
    narration: string;
    referenceType?: string;
    referenceId?: string;
    isReversal?: boolean;
    reversalOfId?: string;
    lines: JournalLineInput[];
  },
) {
  const db = getAccountingDb(client);
  const totalDebit = round2(params.lines.reduce((sum, line) => sum + line.debit, 0));
  const totalCredit = round2(params.lines.reduce((sum, line) => sum + line.credit, 0));

  if (totalDebit !== totalCredit || totalDebit === 0) {
    throw new Error("Journal entry must balance with non-zero amounts.");
  }

  const voucherNumber = await generateVoucherNumber(
    client,
    businessId,
    params.voucherType,
  );

  const lineCreates = [];
  for (const line of params.lines) {
    if (line.debit === 0 && line.credit === 0) continue;

    lineCreates.push({
      accountId: await getAccountId(client, businessId, line.accountCode),
      debit: round2(line.debit),
      credit: round2(line.credit),
      narration: line.narration,
    });
  }

  return db.journalEntry.create({
    data: {
      businessId,
      voucherType: params.voucherType,
      voucherNumber,
      entryDate: params.entryDate,
      narration: params.narration,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      isReversal: params.isReversal ?? false,
      reversalOfId: params.reversalOfId,
      lines: { create: lineCreates },
    },
  });
}

async function getActiveEntriesForInvoice(
  client: unknown,
  businessId: string,
  invoiceId: string,
) {
  const db = getAccountingDb(client);
  return (await db.journalEntry.findMany({
    where: {
      businessId,
      referenceType: "INVOICE",
      referenceId: invoiceId,
      isReversal: false,
      reversedBy: { is: null },
    },
    include: {
      lines: {
        include: { account: { select: { code: true, name: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  })) as Array<{
    id: string;
    voucherType: string;
    voucherNumber: string;
    lines: Array<{ debit: number; credit: number; account: { code: string } }>;
  }>;
}

export async function postInvoiceSaleJournal(
  client: unknown,
  businessId: string,
  invoice: InvoiceForJournal,
  items: InvoiceLineForCogs[],
  productMap: Map<string, ProductForCogs>,
) {
  await ensureChartOfAccounts(businessId, client);

  const existing = await getActiveEntriesForInvoice(client, businessId, invoice.id);
  if (existing.some((entry) => entry.voucherType === "SALES")) {
    return;
  }

  const lines: JournalLineInput[] = [
    {
      accountCode: ACCOUNT_CODES.SUNDRY_DEBTORS,
      debit: invoice.total,
      credit: 0,
      narration: invoice.invoiceNumber,
    },
    {
      accountCode: ACCOUNT_CODES.SALES,
      debit: 0,
      credit: invoice.subtotal,
      narration: invoice.invoiceNumber,
    },
  ];

  if (invoice.cgstAmount > 0) {
    lines.push({
      accountCode: ACCOUNT_CODES.GST_OUTPUT_CGST,
      debit: 0,
      credit: invoice.cgstAmount,
    });
  }
  if (invoice.sgstAmount > 0) {
    lines.push({
      accountCode: ACCOUNT_CODES.GST_OUTPUT_SGST,
      debit: 0,
      credit: invoice.sgstAmount,
    });
  }
  if (invoice.igstAmount > 0) {
    lines.push({
      accountCode: ACCOUNT_CODES.GST_OUTPUT_IGST,
      debit: 0,
      credit: invoice.igstAmount,
    });
  }

  let cogsTotal = 0;
  for (const item of items) {
    if (!item.productId) continue;
    const product = productMap.get(item.productId);
    if (!product) continue;
    cogsTotal += item.quantity * product.costPrice;
  }
  cogsTotal = round2(cogsTotal);

  if (cogsTotal > 0) {
    lines.push(
      {
        accountCode: ACCOUNT_CODES.COGS,
        debit: cogsTotal,
        credit: 0,
      },
      {
        accountCode: ACCOUNT_CODES.INVENTORY,
        debit: 0,
        credit: cogsTotal,
      },
    );
  }

  await createBalancedEntry(client, businessId, {
    voucherType: "SALES",
    entryDate: invoice.issueDate,
    narration: `Sales invoice ${invoice.invoiceNumber}`,
    referenceType: "INVOICE",
    referenceId: invoice.id,
    lines,
  });
}

export async function postInvoiceReceiptJournal(
  client: unknown,
  businessId: string,
  invoice: InvoiceForJournal,
) {
  await ensureChartOfAccounts(businessId, client);

  const existing = await getActiveEntriesForInvoice(client, businessId, invoice.id);
  if (existing.some((entry) => entry.voucherType === "RECEIPT")) {
    return;
  }

  if (!existing.some((entry) => entry.voucherType === "SALES")) {
    throw new Error("Cannot record payment before sales voucher is posted.");
  }

  await createBalancedEntry(client, businessId, {
    voucherType: "RECEIPT",
    entryDate: new Date(),
    narration: `Payment received for ${invoice.invoiceNumber}`,
    referenceType: "INVOICE",
    referenceId: invoice.id,
    lines: [
      {
        accountCode: ACCOUNT_CODES.CASH,
        debit: invoice.total,
        credit: 0,
      },
      {
        accountCode: ACCOUNT_CODES.SUNDRY_DEBTORS,
        debit: 0,
        credit: invoice.total,
      },
    ],
  });
}

export async function reverseInvoiceJournals(
  client: unknown,
  businessId: string,
  invoice: InvoiceForJournal,
) {
  const entries = await getActiveEntriesForInvoice(client, businessId, invoice.id);

  for (const entry of [...entries].reverse()) {
    const reversedLines: JournalLineInput[] = entry.lines.map((line) => ({
      accountCode: line.account.code,
      debit: line.credit,
      credit: line.debit,
    }));

    await createBalancedEntry(client, businessId, {
      voucherType: entry.voucherType,
      entryDate: new Date(),
      narration: `Reversal of ${entry.voucherNumber} for ${invoice.invoiceNumber}`,
      referenceType: "INVOICE",
      referenceId: invoice.id,
      isReversal: true,
      reversalOfId: entry.id,
      lines: reversedLines,
    });
  }
}

export async function createManualJournalEntry(
  client: unknown,
  businessId: string,
  params: {
    entryDate: Date;
    narration: string;
    lines: JournalLineInput[];
  },
) {
  await ensureChartOfAccounts(businessId, client);

  return createBalancedEntry(client, businessId, {
    voucherType: "JOURNAL",
    entryDate: params.entryDate,
    narration: params.narration,
    referenceType: "MANUAL",
    lines: params.lines,
  });
}

export async function createPaymentVoucher(
  client: unknown,
  businessId: string,
  params: {
    entryDate: Date;
    narration: string;
    amount: number;
    bankAccountCode: string;
    partyAccountCode: string;
    referenceId?: string;
  },
) {
  await ensureChartOfAccounts(businessId, client);

  const amount = round2(params.amount);
  if (amount <= 0) {
    throw new Error("Amount must be greater than zero.");
  }

  if (params.bankAccountCode === params.partyAccountCode) {
    throw new Error("Paid-from and paid-to ledgers must be different.");
  }

  return createBalancedEntry(client, businessId, {
    voucherType: "PAYMENT",
    entryDate: params.entryDate,
    narration: params.narration,
    referenceType: "VOUCHER",
    referenceId: params.referenceId,
    lines: [
      {
        accountCode: params.partyAccountCode,
        debit: amount,
        credit: 0,
        narration: params.narration,
      },
      {
        accountCode: params.bankAccountCode,
        debit: 0,
        credit: amount,
        narration: params.narration,
      },
    ],
  });
}

export async function createReceiptVoucher(
  client: unknown,
  businessId: string,
  params: {
    entryDate: Date;
    narration: string;
    amount: number;
    bankAccountCode: string;
    partyAccountCode: string;
    referenceId?: string;
  },
) {
  await ensureChartOfAccounts(businessId, client);

  const amount = round2(params.amount);
  if (amount <= 0) {
    throw new Error("Amount must be greater than zero.");
  }

  if (params.bankAccountCode === params.partyAccountCode) {
    throw new Error("Received-in and received-from ledgers must be different.");
  }

  return createBalancedEntry(client, businessId, {
    voucherType: "RECEIPT",
    entryDate: params.entryDate,
    narration: params.narration,
    referenceType: "VOUCHER",
    referenceId: params.referenceId,
    lines: [
      {
        accountCode: params.bankAccountCode,
        debit: amount,
        credit: 0,
        narration: params.narration,
      },
      {
        accountCode: params.partyAccountCode,
        debit: 0,
        credit: amount,
        narration: params.narration,
      },
    ],
  });
}

export async function createContraVoucher(
  client: unknown,
  businessId: string,
  params: {
    entryDate: Date;
    narration: string;
    amount: number;
    fromAccountCode: string;
    toAccountCode: string;
  },
) {
  await ensureChartOfAccounts(businessId, client);

  const amount = round2(params.amount);
  if (amount <= 0) {
    throw new Error("Amount must be greater than zero.");
  }

  if (params.fromAccountCode === params.toAccountCode) {
    throw new Error("Transfer-from and transfer-to must be different ledgers.");
  }

  return createBalancedEntry(client, businessId, {
    voucherType: "CONTRA",
    entryDate: params.entryDate,
    narration: params.narration,
    referenceType: "VOUCHER",
    lines: [
      {
        accountCode: params.toAccountCode,
        debit: amount,
        credit: 0,
        narration: params.narration,
      },
      {
        accountCode: params.fromAccountCode,
        debit: 0,
        credit: amount,
        narration: params.narration,
      },
    ],
  });
}

export function shouldPostSaleJournal(status: string) {
  return status !== "DRAFT" && status !== "CANCELLED";
}

export function shouldPostReceiptJournal(status: string) {
  return status === "PAID";
}

type PurchaseForJournal = {
  id: string;
  purchaseNumber: string;
  billDate: Date;
  subtotal: number;
  total: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  commissionAmount?: number;
};

async function getActiveEntriesForPurchase(
  client: unknown,
  businessId: string,
  purchaseId: string,
) {
  const db = getAccountingDb(client);
  return (await db.journalEntry.findMany({
    where: {
      businessId,
      referenceType: "PURCHASE",
      referenceId: purchaseId,
      isReversal: false,
      reversedBy: { is: null },
    },
    include: {
      lines: {
        include: { account: { select: { code: true, name: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  })) as Array<{
    id: string;
    voucherType: string;
    voucherNumber: string;
    lines: Array<{ debit: number; credit: number; account: { code: string } }>;
  }>;
}

export async function postPurchaseBillJournal(
  client: unknown,
  businessId: string,
  purchase: PurchaseForJournal,
) {
  await ensureChartOfAccounts(businessId, client);

  const existing = await getActiveEntriesForPurchase(client, businessId, purchase.id);
  if (existing.some((entry) => entry.voucherType === "PURCHASE")) {
    return;
  }

  const lines: JournalLineInput[] = [
    {
      accountCode: ACCOUNT_CODES.INVENTORY,
      debit: purchase.subtotal,
      credit: 0,
      narration: purchase.purchaseNumber,
    },
    {
      accountCode: ACCOUNT_CODES.SUNDRY_CREDITORS,
      debit: 0,
      credit: purchase.total,
      narration: purchase.purchaseNumber,
    },
  ];

  if (purchase.cgstAmount > 0) {
    lines.push({
      accountCode: ACCOUNT_CODES.GST_INPUT_CGST,
      debit: purchase.cgstAmount,
      credit: 0,
    });
  }
  if (purchase.sgstAmount > 0) {
    lines.push({
      accountCode: ACCOUNT_CODES.GST_INPUT_SGST,
      debit: purchase.sgstAmount,
      credit: 0,
    });
  }
  if (purchase.igstAmount > 0) {
    lines.push({
      accountCode: ACCOUNT_CODES.GST_INPUT_IGST,
      debit: purchase.igstAmount,
      credit: 0,
    });
  }

  const commission = purchase.commissionAmount ?? 0;
  if (commission > 0) {
    lines.push({
      accountCode: ACCOUNT_CODES.APMC_COMMISSION,
      debit: commission,
      credit: 0,
      narration: `APMC market commission — ${purchase.purchaseNumber}`,
    });
  }

  await createBalancedEntry(client, businessId, {
    voucherType: "PURCHASE",
    entryDate: purchase.billDate,
    narration: `Purchase bill ${purchase.purchaseNumber}`,
    referenceType: "PURCHASE",
    referenceId: purchase.id,
    lines,
  });
}

export async function postPurchasePaymentJournal(
  client: unknown,
  businessId: string,
  purchase: PurchaseForJournal,
) {
  await ensureChartOfAccounts(businessId, client);

  const existing = await getActiveEntriesForPurchase(client, businessId, purchase.id);
  if (existing.some((entry) => entry.voucherType === "PAYMENT")) {
    return;
  }

  if (!existing.some((entry) => entry.voucherType === "PURCHASE")) {
    throw new Error("Cannot record payment before purchase voucher is posted.");
  }

  await createBalancedEntry(client, businessId, {
    voucherType: "PAYMENT",
    entryDate: new Date(),
    narration: `Payment for ${purchase.purchaseNumber}`,
    referenceType: "PURCHASE",
    referenceId: purchase.id,
    lines: [
      {
        accountCode: ACCOUNT_CODES.SUNDRY_CREDITORS,
        debit: purchase.total,
        credit: 0,
      },
      {
        accountCode: ACCOUNT_CODES.CASH,
        debit: 0,
        credit: purchase.total,
      },
    ],
  });
}

export async function reversePurchaseJournals(
  client: unknown,
  businessId: string,
  purchase: PurchaseForJournal,
) {
  const entries = await getActiveEntriesForPurchase(client, businessId, purchase.id);

  for (const entry of [...entries].reverse()) {
    const reversedLines: JournalLineInput[] = entry.lines.map((line) => ({
      accountCode: line.account.code,
      debit: line.credit,
      credit: line.debit,
    }));

    await createBalancedEntry(client, businessId, {
      voucherType: entry.voucherType,
      entryDate: new Date(),
      narration: `Reversal of ${entry.voucherNumber} for ${purchase.purchaseNumber}`,
      referenceType: "PURCHASE",
      referenceId: purchase.id,
      isReversal: true,
      reversalOfId: entry.id,
      lines: reversedLines,
    });
  }
}

export function shouldPostPurchaseJournal(status: string) {
  return status !== "DRAFT" && status !== "CANCELLED";
}

export function shouldPostPurchasePaymentJournal(status: string) {
  return status === "PAID";
}
