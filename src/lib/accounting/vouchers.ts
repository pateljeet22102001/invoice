import type { Account } from "@/types/models";
import { CASH_BANK_CODES } from "@/lib/accounting/account-codes";

export type StandaloneVoucherType = "PAYMENT" | "RECEIPT" | "CONTRA";

export const VOUCHER_META: Record<
  StandaloneVoucherType,
  {
    title: string;
    description: string;
    submitLabel: string;
    bankLabel: string;
    partyLabel: string;
    fromLabel: string;
    toLabel: string;
    hint: string;
  }
> = {
  PAYMENT: {
    title: "Payment Voucher",
    description: "Money paid out — debit expense or creditor, credit cash/bank",
    submitLabel: "Post Payment",
    bankLabel: "Paid from (Cash / Bank)",
    partyLabel: "Paid to (Creditor / Expense)",
    fromLabel: "",
    toLabel: "",
    hint: "Example: pay supplier from bank, or pay rent from cash.",
  },
  RECEIPT: {
    title: "Receipt Voucher",
    description: "Money received — debit cash/bank, credit debtor or income",
    submitLabel: "Post Receipt",
    bankLabel: "Received in (Cash / Bank)",
    partyLabel: "Received from (Debtor / Income)",
    fromLabel: "",
    toLabel: "",
    hint: "Example: customer payment to cash, or commission received in bank.",
  },
  CONTRA: {
    title: "Contra Voucher",
    description: "Cash ↔ bank transfer — no third party",
    submitLabel: "Post Contra",
    bankLabel: "",
    partyLabel: "",
    fromLabel: "Transfer from",
    toLabel: "Transfer to",
    hint: "Example: deposit cash to bank, or withdraw bank to cash.",
  },
};

export function getCashBankAccounts(accounts: Account[]) {
  return accounts.filter((account) =>
    (CASH_BANK_CODES as readonly string[]).includes(account.code),
  );
}

export function getPartyAccounts(accounts: Account[]) {
  return accounts.filter(
    (account) => !(CASH_BANK_CODES as readonly string[]).includes(account.code),
  );
}

export function accountOptions(accounts: Account[]) {
  return accounts.map((account) => ({
    value: account.code,
    label: `${account.code} — ${account.name}`,
  }));
}

export function defaultCashBankCode(accounts: Account[]) {
  return (
    accounts.find((account) => account.code === CASH_BANK_CODES[0])?.code ??
    accounts[0]?.code ??
    ""
  );
}

export function defaultPartyCode(accounts: Account[], type: StandaloneVoucherType) {
  const preferred =
    type === "PAYMENT"
      ? "2100"
      : type === "RECEIPT"
        ? "1200"
        : "";
  return (
    accounts.find((account) => account.code === preferred)?.code ??
    accounts[0]?.code ??
    ""
  );
}
