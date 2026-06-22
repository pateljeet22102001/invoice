"use client";

import { useActionState, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createPurchaseAction } from "@/actions/purchases";
import {
  FormActions,
  FormError,
  FormField,
  FormSelect,
  FormTextarea,
} from "@/components/forms/form-fields";
import { PURCHASE_TYPE_OPTIONS } from "@/lib/constants/supplier-types";
import { formatQuantityWithUnit, quantityInputStep } from "@/lib/constants/product-units";
import { splitGstTax } from "@/lib/gst";
import { formatCurrency } from "@/lib/utils";
import type { FormState } from "@/lib/form";

export type PurchaseSupplierOption = {
  id: string;
  name: string;
  state: string | null;
  gstin: string | null;
  supplierType: string;
};

export type PurchaseProductOption = {
  id: string;
  name: string;
  sku: string;
  unit: string;
  costPrice: number;
  gstRate: number;
  stock: number;
};

type LineRow = {
  id: string;
  productId: string;
  isNewProduct: boolean;
  newProductName: string;
  quantity: number;
  unitCost: number;
  unitPrice: number;
};

const NEW_PRODUCT_VALUE = "__NEW__";
const DEFAULT_NEW_GST = 5;

const initialState: FormState = {};

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function dueDateString() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

function newLine(costPrice = 0, preferNew = false): LineRow {
  return {
    id: crypto.randomUUID(),
    productId: preferNew ? NEW_PRODUCT_VALUE : "",
    isNewProduct: preferNew,
    newProductName: "",
    quantity: preferNew ? 0 : 1,
    unitCost: costPrice,
    unitPrice: costPrice,
  };
}

export function PurchaseForm({
  suppliers,
  products,
  businessState,
  businessGstin,
  defaultCommissionRate = 2.5,
}: {
  suppliers: PurchaseSupplierOption[];
  products: PurchaseProductOption[];
  businessState: string | null;
  businessGstin: string | null;
  defaultCommissionRate?: number;
}) {
  const [state, formAction, pending] = useActionState(
    createPurchaseAction,
    initialState,
  );
  const [lines, setLines] = useState<LineRow[]>([newLine(0, products.length === 0)]);
  const [supplierId, setSupplierId] = useState("");
  const [purchaseType, setPurchaseType] = useState("FARMER");
  const [commissionAgentId, setCommissionAgentId] = useState("");
  const [commissionRate, setCommissionRate] = useState(String(defaultCommissionRate));

  const apmcAgents = useMemo(
    () => suppliers.filter((s) => s.supplierType === "APMC_AGENT"),
    [suppliers],
  );

  const isApmcMandi = purchaseType === "APMC_MANDI";

  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );

  const supplierMap = useMemo(
    () => new Map(suppliers.map((s) => [s.id, s])),
    [suppliers],
  );

  const selectedSupplier = supplierId ? supplierMap.get(supplierId) : undefined;

  const totals = useMemo(() => {
    let subtotal = 0;
    let taxAmount = 0;

    for (const line of lines) {
      const isNew = line.isNewProduct || line.productId === NEW_PRODUCT_VALUE;
      if (!isNew && !line.productId) continue;
      if (isNew && !line.newProductName.trim()) continue;
      if (line.quantity <= 0) continue;

      const gstRate = isNew
        ? DEFAULT_NEW_GST
        : (productMap.get(line.productId)?.gstRate ?? DEFAULT_NEW_GST);

      const lineSubtotal = line.quantity * line.unitCost;
      subtotal += lineSubtotal;
      taxAmount += lineSubtotal * (gstRate / 100);
    }

    const gstSplit = splitGstTax(
      taxAmount,
      businessState,
      selectedSupplier?.state,
      businessGstin,
      selectedSupplier?.gstin,
    );

    return {
      subtotal,
      taxAmount,
      commissionAmount:
        purchaseType === "APMC_MANDI" && subtotal > 0
          ? Math.round(subtotal * ((Number(commissionRate) || 0) / 100) * 100) / 100
          : 0,
      total:
        subtotal +
        taxAmount +
        (purchaseType === "APMC_MANDI" && subtotal > 0
          ? Math.round(subtotal * ((Number(commissionRate) || 0) / 100) * 100) / 100
          : 0),
      ...gstSplit,
    };
  }, [
    lines,
    productMap,
    businessState,
    businessGstin,
    selectedSupplier?.state,
    selectedSupplier?.gstin,
    purchaseType,
    commissionRate,
  ]);

  const itemsJson = JSON.stringify(
    lines
      .filter((line) => {
        const isNew = line.isNewProduct || line.productId === NEW_PRODUCT_VALUE;
        if (line.quantity <= 0) return false;
        if (isNew) return line.newProductName.trim().length > 0;
        return Boolean(line.productId);
      })
      .map((line) => {
        const isNew = line.isNewProduct || line.productId === NEW_PRODUCT_VALUE;
        if (isNew) {
          return {
            newProductName: line.newProductName.trim(),
            quantity: line.quantity,
            unitCost: line.unitCost,
            unitPrice: line.unitPrice,
            gstRate: DEFAULT_NEW_GST,
          };
        }
        return {
          productId: line.productId,
          quantity: line.quantity,
          unitCost: line.unitCost,
        };
      }),
  );

  function updateLine(id: string, patch: Partial<LineRow>) {
    setLines((current) =>
      current.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    );
  }

  function onProductChange(lineId: string, productId: string) {
    if (productId === NEW_PRODUCT_VALUE) {
      updateLine(lineId, {
        productId: NEW_PRODUCT_VALUE,
        isNewProduct: true,
        newProductName: "",
        unitCost: 0,
        unitPrice: 0,
      });
      return;
    }

    const product = productMap.get(productId);
    updateLine(lineId, {
      productId,
      isNewProduct: false,
      newProductName: "",
      unitCost: product?.costPrice ?? 0,
      unitPrice: product?.costPrice ?? 0,
    });
  }

  function addLine() {
    setLines((current) => [...current, newLine(0, current.length === 0 && products.length === 0)]);
  }

  function removeLine(id: string) {
    setLines((current) =>
      current.length === 1 ? current : current.filter((line) => line.id !== id),
    );
  }

  if (suppliers.length === 0) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Add at least one supplier (farmer, APMC market, or trader) before creating a purchase bill.{" "}
        <a href="/suppliers/new" className="font-medium underline">
          Add supplier
        </a>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <FormError message={state.error} />

      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        <p className="font-medium">Purchase Bill — stock is added here</p>
        <p className="mt-1 text-xs text-emerald-800">
          Type item or grade name on the line — it is saved automatically. No separate
          add-product step. Stock increases when status is Received or Paid.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="purchaseType"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Purchase Type <span className="text-rose-500">*</span>
          </label>
          <select
            id="purchaseType"
            name="purchaseType"
            required
            value={purchaseType}
            onChange={(e) => setPurchaseType(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            {PURCHASE_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <FormSelect
        label={isApmcMandi ? "Seller (farmer / party at APMC market)" : "Supplier"}
        id="supplierId"
        required
        placeholder="Select supplier"
        value={supplierId}
        onChange={(e) => setSupplierId(e.target.value)}
        options={suppliers.map((s) => ({
          value: s.id,
          label: s.gstin
            ? `${s.name} (${s.gstin})`
            : s.state
              ? `${s.name} — ${s.state}`
              : s.name,
        }))}
      />

      {isApmcMandi && (
        <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">APMC market commission</p>
          <p className="text-xs text-amber-800">
            Commission is calculated on goods value and added to the total payable to the commission agent.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormSelect
              label="Commission agent (APMC)"
              id="commissionAgentId"
              required
              placeholder="Select APMC agent"
              value={commissionAgentId}
              onChange={(e) => setCommissionAgentId(e.target.value)}
              options={apmcAgents.map((s) => ({
                value: s.id,
                label: s.name,
              }))}
            />
            <FormField
              label="Commission rate (%)"
              id="commissionRate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              required
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              hint="Usually 1–3% on APMC market turnover"
            />
          </div>
          {apmcAgents.length === 0 && (
            <p className="text-xs text-amber-900">
              No APMC agent yet.{" "}
              <a href="/suppliers/new" className="font-medium underline">
                Add commission agent
              </a>{" "}
              in Suppliers first.
            </p>
          )}
        </div>
      )}

      {selectedSupplier && purchaseType === "B2B" && !selectedSupplier.gstin && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          This supplier has no GSTIN. B2B purchase needs supplier GSTIN for input tax
          credit — add it in Suppliers or use Farmer/Unregistered type.
        </div>
      )}

      {selectedSupplier && (
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
              ? "Supplier is in a different state — GST input as IGST"
              : "Same state — GST input split as CGST + SGST"}
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField
          label="Bill Date"
          id="billDate"
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
          defaultValue="RECEIVED"
          options={[
            { value: "DRAFT", label: "Draft (no stock yet)" },
            { value: "RECEIVED", label: "Received (add stock)" },
            { value: "PAID", label: "Paid (add stock + payment)" },
          ]}
        />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-slate-800">Items / line items</h3>
            <p className="text-xs text-slate-500">
              New name is saved to your item list. The same name again adds stock to that item.
            </p>
          </div>
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
            const isNew = line.isNewProduct || line.productId === NEW_PRODUCT_VALUE;
            const product =
              !isNew && line.productId ? productMap.get(line.productId) : undefined;
            const lineTotal = line.quantity * line.unitCost;
            const unit = isNew ? "kg" : (product?.unit ?? "kg");

            return (
              <div
                key={line.id}
                className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="grid gap-3 md:grid-cols-[1fr_100px_120px_120px_100px_auto]">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">
                      {isNew ? `Item name ${index + 1}` : `Item ${index + 1}`}
                    </label>
                    {isNew ? (
                      <input
                        type="text"
                        required
                        placeholder="Virginia Tobacco, Burley, FCV Grade A..."
                        value={line.newProductName}
                        onChange={(e) =>
                          updateLine(line.id, { newProductName: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    ) : (
                      <select
                        value={line.productId}
                        onChange={(e) => onProductChange(line.id, e.target.value)}
                        required
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="" disabled>
                          Select item
                        </option>
                        <option value={NEW_PRODUCT_VALUE}>+ Type new item name</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.unit === "kg" ? p.name : `${p.name} (${p.sku})`} — Stock:{" "}
                            {formatQuantityWithUnit(p.stock, p.unit)}
                          </option>
                        ))}
                      </select>
                    )}
                    {isNew ? (
                      <button
                        type="button"
                        onClick={() =>
                          updateLine(line.id, {
                            productId: "",
                            isNewProduct: false,
                            newProductName: "",
                          })
                        }
                        className="mt-1 text-xs text-indigo-600 hover:underline"
                      >
                        Pick from existing list instead
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onProductChange(line.id, NEW_PRODUCT_VALUE)}
                        className="mt-1 text-xs text-indigo-600 hover:underline"
                      >
                        + New item name
                      </button>
                    )}
                    {(product || isNew) && (
                      <p className="mt-1 text-xs text-slate-500">
                        GST {product?.gstRate ?? DEFAULT_NEW_GST}% · Line:{" "}
                        {formatCurrency(lineTotal)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">
                      Qty ({unit})
                    </label>
                    <input
                      type="number"
                      min="0.001"
                      step={quantityInputStep(unit)}
                      required
                      value={line.quantity || ""}
                      onChange={(e) =>
                        updateLine(line.id, {
                          quantity: Math.max(
                            quantityInputStep(unit) === "1" ? 1 : 0.001,
                            Number(e.target.value) || 0,
                          ),
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">
                      Buy rate / {unit}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={line.unitCost || ""}
                      onChange={(e) => {
                        const cost = Math.max(0, Number(e.target.value) || 0);
                        updateLine(line.id, {
                          unitCost: cost,
                          unitPrice:
                            line.unitPrice === line.unitCost || line.unitPrice === 0
                              ? cost
                              : line.unitPrice,
                        });
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  {isNew && (
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-slate-600">
                        Sale rate / {unit}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={line.unitPrice || ""}
                        onChange={(e) =>
                          updateLine(line.id, {
                            unitPrice: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  )}

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
              </div>
            );
          })}
        </div>
      </div>

      <FormTextarea
        label="Notes"
        id="notes"
        placeholder="Bill reference, market lot, vehicle no., etc."
        rows={2}
      />

      <input type="hidden" name="items" value={itemsJson} readOnly />

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex justify-between text-sm text-slate-600">
          <span>Subtotal</span>
          <span>{formatCurrency(totals.subtotal)}</span>
        </div>
        {totals.isInterState ? (
          <div className="mt-2 flex justify-between text-sm text-slate-600">
            <span>IGST (input)</span>
            <span>{formatCurrency(totals.igst)}</span>
          </div>
        ) : (
          <>
            <div className="mt-2 flex justify-between text-sm text-slate-600">
              <span>CGST (input)</span>
              <span>{formatCurrency(totals.cgst)}</span>
            </div>
            <div className="mt-2 flex justify-between text-sm text-slate-600">
              <span>SGST (input)</span>
              <span>{formatCurrency(totals.sgst)}</span>
            </div>
          </>
        )}
        <div className="mt-2 flex justify-between text-sm font-medium text-slate-700">
          <span>GST Total</span>
          <span>{formatCurrency(totals.taxAmount)}</span>
        </div>
        {totals.commissionAmount > 0 && (
          <div className="mt-2 flex justify-between text-sm text-amber-800">
            <span>APMC Commission ({commissionRate}%)</span>
            <span>{formatCurrency(totals.commissionAmount)}</span>
          </div>
        )}
        <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-900">
          <span>Total Payable</span>
          <span>{formatCurrency(totals.total)}</span>
        </div>
      </div>

      <FormActions
        cancelHref="/purchases"
        pending={pending}
        submitLabel="Create Purchase Bill"
      />
    </form>
  );
}
