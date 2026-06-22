"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CASH_BANK_CODES } from "@/lib/accounting/account-codes";
import { AUDIT_ACTIONS, logAuditEvent } from "@/lib/accounting/audit-log";
import {
  createContraVoucher,
  createManualJournalEntry,
  createPaymentVoucher,
  createReceiptVoucher,
} from "@/lib/accounting/journal";
import type { StandaloneVoucherType } from "@/lib/accounting/vouchers";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/session";
import { getField, getNumber, type FormState } from "@/lib/form";

function revalidateAccounting() {
  revalidatePath("/accounting");
  revalidatePath("/accounting/journals");
  revalidatePath("/accounting/vouchers");
  revalidatePath("/accounting/ledgers");
  revalidatePath("/accounting/ca-reports");
}

function parseVoucherType(raw: string): StandaloneVoucherType | null {
  if (raw === "PAYMENT" || raw === "RECEIPT" || raw === "CONTRA") {
    return raw;
  }
  return null;
}

function parseEntryDate(raw: string) {
  const entryDate = new Date(raw);
  if (Number.isNaN(entryDate.getTime())) {
    return { error: "Enter a valid entry date." } as const;
  }
  return { entryDate } as const;
}

function assertCashBank(code: string) {
  if (!(CASH_BANK_CODES as readonly string[]).includes(code)) {
    return "Select a valid cash or bank ledger.";
  }
  return null;
}

type JournalLineInput = {
  accountCode: string;
  debit: number;
  credit: number;
};

function parseLines(raw: string): JournalLineInput[] | null {
  try {
    const parsed = JSON.parse(raw) as JournalLineInput[];
    if (!Array.isArray(parsed) || parsed.length < 2) return null;
    return parsed.filter(
      (line) =>
        typeof line.accountCode === "string" &&
        line.accountCode.length > 0 &&
        typeof line.debit === "number" &&
        typeof line.credit === "number" &&
        (line.debit > 0 || line.credit > 0),
    );
  } catch {
    return null;
  }
}

export async function createJournalAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { businessId, userName } = await requireBusiness();

  const entryDateRaw = getField(formData, "entryDate");
  const narration = getField(formData, "narration");
  const lines = parseLines(getField(formData, "lines"));

  if (!entryDateRaw) {
    return { error: "Entry date is required." };
  }

  if (!narration) {
    return { error: "Narration is required." };
  }

  if (!lines || lines.length < 2) {
    return { error: "Add at least two ledger lines with debit or credit." };
  }

  const entryDate = new Date(entryDateRaw);
  if (Number.isNaN(entryDate.getTime())) {
    return { error: "Enter a valid entry date." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await createManualJournalEntry(tx, businessId, {
        entryDate,
        narration,
        lines,
      });

      await logAuditEvent(tx, {
        businessId,
        action: AUDIT_ACTIONS.JOURNAL_POSTED,
        entityType: "JOURNAL",
        entityLabel: narration,
        details: { lineCount: lines.length },
        performedBy: userName,
      });
    });
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Could not create journal entry." };
  }

  revalidateAccounting();
  redirect("/accounting/journals");
}

export async function createVoucherAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { businessId, userName } = await requireBusiness();

  const voucherType = parseVoucherType(getField(formData, "voucherType"));
  const entryDateRaw = getField(formData, "entryDate");
  const narration = getField(formData, "narration");
  const amount = getNumber(formData, "amount");
  const bankAccountCode = getField(formData, "bankAccountCode");
  const partyAccountCode = getField(formData, "partyAccountCode");
  const fromAccountCode = getField(formData, "fromAccountCode");
  const toAccountCode = getField(formData, "toAccountCode");

  if (!voucherType) {
    return { error: "Invalid voucher type." };
  }

  if (!entryDateRaw) {
    return { error: "Entry date is required." };
  }

  if (!narration) {
    return { error: "Narration is required." };
  }

  if (!amount || amount <= 0) {
    return { error: "Enter a valid amount greater than zero." };
  }

  const parsedDate = parseEntryDate(entryDateRaw);
  if ("error" in parsedDate) {
    return { error: parsedDate.error };
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (voucherType === "PAYMENT") {
        if (!bankAccountCode || !partyAccountCode) {
          throw new Error("Select both paid-from and paid-to ledgers.");
        }
        const bankError = assertCashBank(bankAccountCode);
        if (bankError) throw new Error(bankError);

        await createPaymentVoucher(tx, businessId, {
          entryDate: parsedDate.entryDate,
          narration,
          amount,
          bankAccountCode,
          partyAccountCode,
        });

        await logAuditEvent(tx, {
          businessId,
          action: AUDIT_ACTIONS.VOUCHER_POSTED,
          entityType: "PAYMENT",
          entityLabel: narration,
          details: { amount, bankAccountCode, partyAccountCode },
          performedBy: userName,
        });
        return;
      }

      if (voucherType === "RECEIPT") {
        if (!bankAccountCode || !partyAccountCode) {
          throw new Error("Select both received-in and received-from ledgers.");
        }
        const bankError = assertCashBank(bankAccountCode);
        if (bankError) throw new Error(bankError);

        await createReceiptVoucher(tx, businessId, {
          entryDate: parsedDate.entryDate,
          narration,
          amount,
          bankAccountCode,
          partyAccountCode,
        });

        await logAuditEvent(tx, {
          businessId,
          action: AUDIT_ACTIONS.VOUCHER_POSTED,
          entityType: "RECEIPT",
          entityLabel: narration,
          details: { amount, bankAccountCode, partyAccountCode },
          performedBy: userName,
        });
        return;
      }

      if (!fromAccountCode || !toAccountCode) {
        throw new Error("Select both transfer-from and transfer-to ledgers.");
      }
      const fromError = assertCashBank(fromAccountCode);
      const toError = assertCashBank(toAccountCode);
      if (fromError || toError) {
        throw new Error("Contra transfers must use cash or bank ledgers only.");
      }

      await createContraVoucher(tx, businessId, {
        entryDate: parsedDate.entryDate,
        narration,
        amount,
        fromAccountCode,
        toAccountCode,
      });

      await logAuditEvent(tx, {
        businessId,
        action: AUDIT_ACTIONS.VOUCHER_POSTED,
        entityType: "CONTRA",
        entityLabel: narration,
        details: { amount, fromAccountCode, toAccountCode },
        performedBy: userName,
      });
    });
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Could not post voucher." };
  }

  revalidateAccounting();
  redirect("/accounting/vouchers");
}

export async function createPaymentVoucherAction(
  prev: FormState,
  formData: FormData,
): Promise<FormState> {
  formData.set("voucherType", "PAYMENT");
  return createVoucherAction(prev, formData);
}

export async function createReceiptVoucherAction(
  prev: FormState,
  formData: FormData,
): Promise<FormState> {
  formData.set("voucherType", "RECEIPT");
  return createVoucherAction(prev, formData);
}

export async function createContraVoucherAction(
  prev: FormState,
  formData: FormData,
): Promise<FormState> {
  formData.set("voucherType", "CONTRA");
  return createVoucherAction(prev, formData);
}
