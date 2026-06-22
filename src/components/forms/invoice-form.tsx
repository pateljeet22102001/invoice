"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createInvoiceAction } from "@/actions/invoices";
import {
  FormActions,
  FormError,
  FormField,
  FormSelect,
  FormTextarea,
} from "@/components/forms/form-fields";
import { EwayBillSection } from "@/components/forms/eway-bill-section";
import { splitGstTax } from "@/lib/gst";
import { formatQuantityWithUnit, quantityInputStep } from "@/lib/constants/product-units";
import { formatCurrency } from "@/lib/utils";
import type { FormState } from "@/lib/form";

export type InvoiceCustomerOption = {
  id: string;
  name: string;
  state: string | null;
  gstin: string | null;
};

export type InvoiceProductOption = {
  id: string;
  name: string;
  sku: string;
  unit: string;
  unitPrice: number;
  gstRate: number;
  stock: number;
};

type LineRow = {
  id: string;
  productId: string;
  quantity: number;
};

const initialState: FormState = {};

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function dueDateString() {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return date.toISOString().slice(0, 10);
}

function newLine(): LineRow {
  return { id: crypto.randomUUID(), productId: "", quantity: 1 };
}

export function InvoiceForm({
  customers,
  products,
  businessState,
  businessGstin,
  traderMode = false,
}: {
  customers: InvoiceCustomerOption[];
  products: InvoiceProductOption[];
  businessState: string | null;
  businessGstin: string | null;
  traderMode?: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    createInvoiceAction,
    initialState,
  );
  const [lines, setLines] = useState<LineRow[]>([newLine()]);
  const [customerId, setCustomerId] = useState("");
  const [invoiceType, setInvoiceType] = useState("B2B");

  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );

  const customerMap = useMemo(
    () => new Map(customers.map((c) => [c.id, c])),
    [customers],
  );

  const selectedCustomer = customerId ? customerMap.get(customerId) : undefined;

  const totals = useMemo(() => {
    let subtotal = 0;
    let taxAmount = 0;

    for (const line of lines) {
      if (!line.productId) continue;
      const product = productMap.get(line.productId);
      if (!product) continue;

      const lineSubtotal = line.quantity * product.unitPrice;
      subtotal += lineSubtotal;
      taxAmount += lineSubtotal * (product.gstRate / 100);
    }

    const gstSplit = splitGstTax(
      taxAmount,
      businessState,
      selectedCustomer?.state,
      businessGstin,
      selectedCustomer?.gstin,
    );

    return {
      subtotal,
      taxAmount,
      total: subtotal + taxAmount,
      ...gstSplit,
    };
  }, [
    lines,
    productMap,
    businessState,
    businessGstin,
    selectedCustomer?.state,
    selectedCustomer?.gstin,
  ]);

  const itemsJson = JSON.stringify(
    lines
      .filter((line) => line.productId && line.quantity > 0)
      .map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
      })),
  );

  function updateLine(id: string, patch: Partial<LineRow>) {
    setLines((current) =>
      current.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    );
  }

  function addLine() {
    setLines((current) => [...current, newLine()]);
  }

  function removeLine(id: string) {
    setLines((current) =>
      current.length === 1 ? current : current.filter((line) => line.id !== id),
    );
  }

  if (customers.length === 0 || products.length === 0) {
    return (
      <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
        <p className="font-medium">
          {traderMode ? "Sales Bill — what you need first" : "Before creating an invoice"}
        </p>
        {products.length === 0 && (
          <p>
            {traderMode ? (
              <>
                No stock yet.{" "}
                <Link href="/purchases/new" className="font-semibold text-indigo-700 underline">
                  Buy on Purchase Bill
                </Link>{" "}
                — type item name there; it appears here for selling.
              </>
            ) : (
              <>
                Add products first, or{" "}
                <Link href="/purchases/new" className="font-semibold text-indigo-700 underline">
                  record a purchase
                </Link>{" "}
                to add stock.
              </>
            )}
          </p>
        )}
        {customers.length === 0 && (
          <p>
            Add a customer (buyer / trader party).{" "}
            <Link href="/customers/new" className="font-semibold text-indigo-700 underline">
              Add customer
            </Link>
          </p>
        )}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <FormError message={state.error} />

      <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
        <p className="font-medium">
          {traderMode ? "Sales Bill — sell stock to party" : "B2B GST Tax Invoice"}
        </p>
        <p className="mt-1 text-xs text-indigo-800">
          {traderMode
            ? "Select items you already purchased. Stock reduces when the bill is saved."
            : "Sale to another business with GST. For stock movement without sale, use "}
          {!traderMode && (
            <>
              <a href="/challans/new" className="font-medium underline">
                Delivery Challan
              </a>
              .
            </>
          )}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="invoiceType"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Invoice Type <span className="text-rose-500">*</span>
          </label>
          <select
            id="invoiceType"
            name="invoiceType"
            required
            value={invoiceType}
            onChange={(e) => setInvoiceType(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="B2B">B2B — Business to Business (GSTIN required)</option>
            <option value="B2C">B2C — Retail / Consumer (no GSTIN needed)</option>
          </select>
        </div>
      </div>

      <FormSelect
        label={traderMode ? "Party (customer)" : "Customer"}
        id="customerId"
        required
        placeholder="Select customer"
        value={customerId}
        onChange={(e) => setCustomerId(e.target.value)}
        options={customers.map((c) => ({
          value: c.id,
          label: c.gstin
            ? `${c.name} (${c.gstin})`
            : c.state
              ? `${c.name} — ${c.state}`
              : c.name,
        }))}
      />

      {selectedCustomer && invoiceType === "B2B" && !selectedCustomer.gstin && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          This customer has no GSTIN. B2B invoice requires buyer GSTIN — add it in
          Customers or switch to B2C.
        </div>
      )}

      {selectedCustomer && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            totals.isInterState
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          <p className="font-medium">{totals.supplyLabel}</p>
          <p className="mt-1 text-xs opacity-80">
            {totals.isInterState
              ? "Customer is in a different state — full GST as IGST"
              : "Same state as your business — GST split as CGST + SGST (50% each)"}
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField
          label="Issue Date"
          id="issueDate"
          type="date"
          required
          defaultValue={todayString()}
        />
        <FormField
          label="Due Date"
          id="dueDate"
          type="date"
          required
          defaultValue={dueDateString()}
        />
        <FormSelect
          label="Status"
          id="status"
          defaultValue="SENT"
          options={[
            { value: "DRAFT", label: "Draft" },
            { value: "SENT", label: "Sent" },
            { value: "PAID", label: "Paid" },
          ]}
        />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-800">
            {traderMode ? "Items / line items" : "Line Items"}
          </h3>
          <button
            type="button"
            onClick={addLine}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Line
          </button>
        </div>

        <div className="space-y-3">
          {lines.map((line, index) => {
            const product = line.productId
              ? productMap.get(line.productId)
              : undefined;
            const lineTotal = product ? line.quantity * product.unitPrice : 0;

            return (
              <div
                key={line.id}
                className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_120px_120px_auto]"
              >
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    {traderMode ? `Item ${index + 1}` : `Product ${index + 1}`}
                  </label>
                  <select
                    value={line.productId}
                    onChange={(e) =>
                      updateLine(line.id, { productId: e.target.value })
                    }
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="" disabled>
                      {traderMode ? "Select item" : "Select product"}
                    </option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.unit === "kg" ? p.name : `${p.name} (${p.sku})`} — {formatCurrency(p.unitPrice)}/{p.unit} — Stock:{" "}
                        {formatQuantityWithUnit(p.stock, p.unit)}
                      </option>
                    ))}
                  </select>
                  {product && (
                    <p className="mt-1 text-xs text-slate-500">
                      GST {product.gstRate}% · Line: {formatCurrency(lineTotal)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Qty{product ? ` (${product.unit})` : ""}
                  </label>
                  <input
                    type="number"
                    min="0.001"
                    step={product ? quantityInputStep(product.unit) : "1"}
                    value={line.quantity}
                    onChange={(e) =>
                      updateLine(line.id, {
                        quantity: Math.max(
                          quantityInputStep(product?.unit ?? "pcs") === "1" ? 1 : 0.001,
                          Number(e.target.value) || 0,
                        ),
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="flex items-end">
                  <p className="pb-2 text-sm font-medium text-slate-900">
                    {formatCurrency(lineTotal)}
                  </p>
                </div>

                <div className="flex items-end justify-end">
                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-rose-600"
                    aria-label="Remove line"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <FormTextarea label="Notes" id="notes" placeholder="Optional payment terms or notes" rows={2} />

      <EwayBillSection documentLabel="invoice" />

      <input type="hidden" name="items" value={itemsJson} readOnly />

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex justify-between text-sm text-slate-600">
          <span>Subtotal</span>
          <span>{formatCurrency(totals.subtotal)}</span>
        </div>
        {totals.isInterState ? (
          <div className="mt-2 flex justify-between text-sm text-slate-600">
            <span>IGST</span>
            <span>{formatCurrency(totals.igst)}</span>
          </div>
        ) : (
          <>
            <div className="mt-2 flex justify-between text-sm text-slate-600">
              <span>CGST</span>
              <span>{formatCurrency(totals.cgst)}</span>
            </div>
            <div className="mt-2 flex justify-between text-sm text-slate-600">
              <span>SGST</span>
              <span>{formatCurrency(totals.sgst)}</span>
            </div>
          </>
        )}
        <div className="mt-2 flex justify-between text-sm font-medium text-slate-700">
          <span>GST Total</span>
          <span>{formatCurrency(totals.taxAmount)}</span>
        </div>
        <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-900">
          <span>Total</span>
          <span>{formatCurrency(totals.total)}</span>
        </div>
      </div>

      <FormActions
        cancelHref="/invoices"
        pending={pending}
        submitLabel={traderMode ? "Save Sales Bill" : "Create Invoice"}
      />
    </form>
  );
}
