"use client";

import { useActionState, useMemo, useState } from "react";
import { createJournalAction } from "@/actions/accounting";
import {
  FormActions,
  FormCard,
  FormError,
  FormField,
  FormSelect,
  FormTextarea,
} from "@/components/forms/form-fields";
import type { Account } from "@/types/models";
import { formatCurrency } from "@/lib/utils";

type LineState = {
  accountCode: string;
  debit: string;
  credit: string;
};

const initialLine = (): LineState => ({
  accountCode: "",
  debit: "",
  credit: "",
});

export function JournalForm({ accounts }: { accounts: Account[] }) {
  const [state, action, pending] = useActionState(createJournalAction, {});
  const [lines, setLines] = useState<LineState[]>([initialLine(), initialLine()]);

  const accountOptions = accounts.map((account) => ({
    value: account.code,
    label: `${account.code} — ${account.name}`,
  }));

  const totals = useMemo(() => {
    let debit = 0;
    let credit = 0;
    for (const line of lines) {
      debit += Number(line.debit) || 0;
      credit += Number(line.credit) || 0;
    }
    return {
      debit: Math.round(debit * 100) / 100,
      credit: Math.round(credit * 100) / 100,
      balanced: Math.round(debit * 100) === Math.round(credit * 100) && debit > 0,
    };
  }, [lines]);

  const serializedLines = JSON.stringify(
    lines
      .filter((line) => line.accountCode)
      .map((line) => ({
        accountCode: line.accountCode,
        debit: Number(line.debit) || 0,
        credit: Number(line.credit) || 0,
      })),
  );

  function updateLine(index: number, patch: Partial<LineState>) {
    setLines((current) =>
      current.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    );
  }

  function addLine() {
    setLines((current) => [...current, initialLine()]);
  }

  function removeLine(index: number) {
    setLines((current) => current.filter((_, i) => i !== index));
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action}>
      <FormCard
        title="Journal Voucher"
        description="Double-entry journal — total debit must equal total credit"
      >
        <FormError message={state.error} />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Entry Date"
            id="entryDate"
            name="entryDate"
            type="date"
            required
            defaultValue={today}
          />
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <p className="font-medium text-slate-700">Totals</p>
            <p className="mt-1 text-slate-600">
              Debit: {formatCurrency(totals.debit)} · Credit:{" "}
              {formatCurrency(totals.credit)}
            </p>
            <p
              className={`mt-1 text-xs font-medium ${
                totals.balanced ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {totals.balanced ? "Balanced" : "Debits and credits must match"}
            </p>
          </div>
        </div>

        <FormTextarea
          label="Narration"
          id="narration"
          name="narration"
          required
          rows={2}
          placeholder="Purpose of this journal entry"
          className="mt-4"
        />

        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Ledger Lines</h3>
            <button
              type="button"
              onClick={addLine}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              + Add line
            </button>
          </div>

          {lines.map((line, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-4"
            >
              <FormSelect
                label="Ledger"
                id={`account-${index}`}
                required
                options={accountOptions}
                value={line.accountCode}
                onChange={(event) =>
                  updateLine(index, { accountCode: event.target.value })
                }
                className="sm:col-span-2"
              />
              <FormField
                label="Debit (₹)"
                id={`debit-${index}`}
                type="number"
                min="0"
                step="0.01"
                value={line.debit}
                onChange={(event) =>
                  updateLine(index, { debit: event.target.value, credit: "" })
                }
              />
              <div className="flex gap-2">
                <FormField
                  label="Credit (₹)"
                  id={`credit-${index}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.credit}
                  onChange={(event) =>
                    updateLine(index, { credit: event.target.value, debit: "" })
                  }
                  className="flex-1"
                />
                {lines.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeLine(index)}
                    className="mt-6 text-sm text-rose-600 hover:text-rose-500"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <input type="hidden" name="lines" value={serializedLines} />

        <FormActions
          submitLabel="Post Journal"
          cancelHref="/accounting/journals"
          pending={pending || !totals.balanced}
        />
      </FormCard>
    </form>
  );
}
