"use client";

import { useActionState } from "react";
import {
  createContraVoucherAction,
  createPaymentVoucherAction,
  createReceiptVoucherAction,
} from "@/actions/accounting";
import {
  FormActions,
  FormCard,
  FormError,
  FormField,
  FormSelect,
  FormTextarea,
} from "@/components/forms/form-fields";
import {
  accountOptions,
  defaultCashBankCode,
  defaultPartyCode,
  getCashBankAccounts,
  getPartyAccounts,
  VOUCHER_META,
  type StandaloneVoucherType,
} from "@/lib/accounting/vouchers";
import type { Account } from "@/types/models";

const ACTIONS: Record<StandaloneVoucherType, typeof createPaymentVoucherAction> = {
  PAYMENT: createPaymentVoucherAction,
  RECEIPT: createReceiptVoucherAction,
  CONTRA: createContraVoucherAction,
};

export function VoucherForm({
  voucherType,
  accounts,
}: {
  voucherType: StandaloneVoucherType;
  accounts: Account[];
}) {
  const meta = VOUCHER_META[voucherType];
  const [state, action, pending] = useActionState(ACTIONS[voucherType], {});

  const cashBankAccounts = getCashBankAccounts(accounts);
  const partyAccounts = getPartyAccounts(accounts);
  const cashBankOptions = accountOptions(cashBankAccounts);
  const partyOptions = accountOptions(partyAccounts);

  const defaultBank = defaultCashBankCode(cashBankAccounts);
  const defaultParty = defaultPartyCode(partyAccounts, voucherType);
  const defaultTo =
    cashBankAccounts.find((account) => account.code !== defaultBank)?.code ??
    cashBankAccounts[1]?.code ??
    "";

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action}>
      <input type="hidden" name="voucherType" value={voucherType} />

      <FormCard title={meta.title} description={meta.description}>
        <FormError message={state.error} />

        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {meta.hint}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Voucher Date"
            id="entryDate"
            name="entryDate"
            type="date"
            required
            defaultValue={today}
          />
          <FormField
            label="Amount (₹)"
            id="amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            required
            placeholder="0.00"
          />
        </div>

        {voucherType === "CONTRA" ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FormSelect
              label={meta.fromLabel}
              id="fromAccountCode"
              name="fromAccountCode"
              required
              options={cashBankOptions}
              defaultValue={defaultBank}
            />
            <FormSelect
              label={meta.toLabel}
              id="toAccountCode"
              name="toAccountCode"
              required
              options={cashBankOptions}
              defaultValue={defaultTo}
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FormSelect
              label={meta.bankLabel}
              id="bankAccountCode"
              name="bankAccountCode"
              required
              options={cashBankOptions}
              defaultValue={defaultBank}
            />
            <FormSelect
              label={meta.partyLabel}
              id="partyAccountCode"
              name="partyAccountCode"
              required
              options={partyOptions}
              defaultValue={defaultParty}
            />
          </div>
        )}

        <FormTextarea
          label="Narration"
          id="narration"
          name="narration"
          required
          rows={2}
          placeholder="Cheque no., party name, purpose..."
          className="mt-4"
        />

        <FormActions
          submitLabel={meta.submitLabel}
          cancelHref="/accounting/vouchers"
          pending={pending}
        />
      </FormCard>
    </form>
  );
}
