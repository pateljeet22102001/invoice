"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  createProductAction,
  deleteProductAction,
  updateProductAction,
} from "@/actions/products";
import { DeleteButton } from "@/components/forms/delete-button";
import {
  FormActions,
  FormError,
  FormField,
  FormSelect,
  FormTextarea,
} from "@/components/forms/form-fields";
import { GST_RATES } from "@/lib/constants/india";
import {
  costPlaceholder,
  formatQuantityWithUnit,
  isKgOnlyBusiness,
  pricePlaceholder,
  quantityInputStep,
  showUnitChoice,
  suggestUnitFromName,
  type ProductUnit,
  unitSelectValue,
} from "@/lib/constants/product-units";
import { cn } from "@/lib/utils";
import type { FormState } from "@/lib/form";
import type { ProductWithInventory } from "@/types/models";

const initialState: FormState = {};

const PCS_RETAIL_TYPES = new Set(["RETAIL", "PHARMA"]);

function defaultUnitForNewItem(businessType: string): ProductUnit {
  if (isKgOnlyBusiness(businessType)) return "kg";
  if (PCS_RETAIL_TYPES.has(businessType)) return "pcs";
  return "kg";
}

function UnitPicker({
  value,
  onChange,
  compact,
}: {
  value: ProductUnit;
  onChange: (unit: ProductUnit) => void;
  compact?: boolean;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-800">
        Sell by weight or count? <span className="text-rose-500">*</span>
      </p>
      <div className={cn("grid gap-3", compact ? "grid-cols-2" : "sm:grid-cols-2")}>
        <button
          type="button"
          onClick={() => onChange("kg")}
          className={cn(
            "relative rounded-2xl border-2 px-4 py-4 text-left transition",
            value === "kg"
              ? "border-emerald-500 bg-emerald-50 shadow-sm ring-2 ring-emerald-500/20"
              : "border-slate-200 bg-white hover:border-emerald-300",
          )}
        >
          <span className="absolute right-3 top-3 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
            APMC
          </span>
          <p className="text-lg font-bold text-slate-900">kg</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            Tobacco, grain, vegetables — buy & sell in kilograms
          </p>
        </button>
        <button
          type="button"
          onClick={() => onChange("pcs")}
          className={cn(
            "rounded-2xl border-2 px-4 py-4 text-left transition",
            value === "pcs"
              ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20"
              : "border-slate-200 bg-white hover:border-slate-300",
          )}
        >
          <p className="text-lg font-bold text-slate-900">pcs</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            Counted items — phone, packet, piece
          </p>
        </button>
      </div>
    </div>
  );
}

export function ProductForm({
  product,
  businessType = "GENERAL_TRADING",
}: {
  product?: ProductWithInventory;
  businessType?: string;
}) {
  const action = product
    ? updateProductAction.bind(null, product.id)
    : createProductAction;

  const kgOnly = isKgOnlyBusiness(businessType);
  const defaultUnit = product?.unit
    ? unitSelectValue(product.unit)
    : defaultUnitForNewItem(businessType);

  const [state, formAction, pending] = useActionState(action, initialState);
  const [unitChoice, setUnitChoice] = useState<ProductUnit>(defaultUnit);
  const [productName, setProductName] = useState(product?.name ?? "");

  const isKg = unitChoice === "kg";
  const useKgWorkflow = kgOnly || isKg;
  const qtyStep = quantityInputStep(unitChoice);
  const currentStock = product?.inventory?.quantity ?? 0;
  const defaultGst = product?.gstRate ?? (useKgWorkflow ? 5 : 18);

  useEffect(() => {
    if (kgOnly || product) return;
    const suggested = suggestUnitFromName(productName, businessType);
    if (suggested) setUnitChoice(suggested);
  }, [productName, businessType, kgOnly, product]);

  return (
    <form action={formAction} className="space-y-6">
      <FormError message={state.error} />

      <input type="hidden" name="unit" value={unitChoice} readOnly />
      {!product && <input type="hidden" name="autoSku" value="1" readOnly />}
      {useKgWorkflow && !product && (
        <>
          <input type="hidden" name="quantity" value="0" readOnly />
          <input type="hidden" name="lowStockThreshold" value="50" readOnly />
        </>
      )}

      {!kgOnly && !product && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Tobacco / APMC market trader?</strong> Go to{" "}
          <Link href="/settings" className="font-semibold underline">
            Settings
          </Link>{" "}
          → set business type to <strong>Tobacco</strong> for a simpler kg-only screen.
        </div>
      )}

      {/* —— Main fields (only what you need daily) —— */}
      <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">1. Item name</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Same as Tally — only the name you use (no SKU to type)
          </p>
        </div>

        <FormField
          label={useKgWorkflow ? "Item / grade name" : "Item name"}
          id="name"
          placeholder={
            useKgWorkflow
              ? "Virginia Tobacco, Burley, FCV Grade A…"
              : "Item name"
          }
          required
          defaultValue={product?.name}
          onChange={(e) => setProductName(e.target.value)}
        />

        {kgOnly ? (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200">
            <span className="rounded-lg bg-emerald-600 px-3 py-1 text-sm font-bold text-white">
              kg
            </span>
            <span className="text-sm text-emerald-900">Weight in kilograms only</span>
          </div>
        ) : (
          showUnitChoice(businessType) && (
            <UnitPicker value={unitChoice} onChange={setUnitChoice} />
          )
        )}

        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">2. Rates (sale & buy)</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label={isKg ? "Sale rate per kg (₹)" : "Sale rate per pcs (₹)"}
              id="unitPrice"
              type="number"
              min="0"
              step="0.01"
              placeholder={pricePlaceholder(unitChoice)}
              required
              defaultValue={product?.unitPrice}
            />
            <FormField
              label={isKg ? "Buy rate per kg (₹)" : "Buy rate per pcs (₹)"}
              id="costPrice"
              type="number"
              min="0"
              step="0.01"
              placeholder={costPlaceholder(unitChoice)}
              hint={
                useKgWorkflow
                  ? "Your usual buy rate from farmer or APMC market — also updated on Purchase Bill"
                  : undefined
              }
              required
              defaultValue={product?.costPrice}
            />
          </div>
        </div>

        {useKgWorkflow && !product && (
          <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4">
            <p className="text-sm font-semibold text-emerald-900">How stock works</p>
            <ul className="mt-2 space-y-1.5 text-xs text-emerald-800">
              <li>
                <strong>Save here</strong> — name + sale rate + buy rate (stock starts at 0 kg)
              </li>
              <li>
                <strong>Buy</strong> →{" "}
                <Link href="/purchases/new" className="font-semibold underline">
                  Purchase Bill
                </Link>{" "}
                — stock is added when you buy from a farmer or APMC market
              </li>
              <li>
                <strong>Sell</strong> → Invoice — stock goes down
              </li>
            </ul>
          </div>
        )}
      </section>

      {/* —— Optional / advanced —— */}
      <details className="group rounded-2xl border border-slate-200 bg-slate-50/80 open:bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-5 py-4 text-sm font-semibold text-slate-800 [&::-webkit-details-marker]:hidden">
          <span>More options — GST, HSN, notes</span>
          <ChevronDown className="h-4 w-4 text-slate-500 transition group-open:rotate-180" />
        </summary>
        <div className="space-y-4 border-t border-slate-200 px-5 pb-5 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormSelect
              label="GST %"
              id="gstRate"
              required
              defaultValue={String(defaultGst)}
              options={GST_RATES.map((rate) => ({
                value: String(rate),
                label: `${rate}%`,
              }))}
            />
            <FormField
              label="HSN code"
              id="hsnCode"
              placeholder={useKgWorkflow ? "2401" : "847160"}
              hint="Optional — tobacco often 2401"
              defaultValue={product?.hsnCode ?? undefined}
            />
          </div>
          <FormTextarea
            label="Notes"
            id="description"
            placeholder="Grade, origin, quality…"
            rows={2}
            defaultValue={product?.description ?? undefined}
          />
        </div>
      </details>

      {/* —— Stock: only when editing, or pcs shop on create —— */}
      {product ? (
        <section className="space-y-4 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5">
          <h3 className="text-sm font-semibold text-indigo-900">Stock</h3>
          <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-indigo-100">
            <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
              Current stock
            </p>
            <p className="mt-1 text-3xl font-bold text-indigo-950">
              {formatQuantityWithUnit(currentStock, unitChoice)}
            </p>
            {useKgWorkflow && (
              <p className="mt-2 text-xs text-indigo-800">
                Add stock via{" "}
                <Link href="/purchases/new" className="font-semibold underline">
                  Purchase Bill
                </Link>
                . Change number here only to fix a mistake.
              </p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label={useKgWorkflow ? "Correct stock (kg)" : isKg ? "Stock (kg)" : "Stock (pcs)"}
              id="quantity"
              type="number"
              min="0"
              step={qtyStep}
              required
              defaultValue={currentStock}
            />
            <FormField
              label="Low stock alert"
              id="lowStockThreshold"
              type="number"
              min="0"
              step={qtyStep}
              defaultValue={product.inventory?.lowStockThreshold ?? (isKg ? 50 : 10)}
            />
          </div>
        </section>
      ) : (
        !useKgWorkflow && (
          <section className="space-y-4 rounded-2xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-800">Opening stock (shop)</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label={isKg ? "Quantity (kg)" : "Quantity (pcs)"}
                id="quantity"
                type="number"
                min="0"
                step={qtyStep}
                required
                defaultValue={0}
              />
              <FormField
                label="Low stock alert"
                id="lowStockThreshold"
                type="number"
                min="0"
                step={qtyStep}
                defaultValue={10}
              />
            </div>
          </section>
        )
      )}

      <FormActions
        cancelHref="/products"
        pending={pending}
        submitLabel={product ? "Update item" : "Save item"}
      />

      {product && (
        <div className="border-t border-slate-200 pt-4">
          <p className="mb-2 text-xs text-slate-500">Bill ref: {product.sku}</p>
          <DeleteButton
            action={deleteProductAction.bind(null, product.id)}
            confirmMessage={`Delete "${product.name}"? This cannot be undone.`}
          />
        </div>
      )}
    </form>
  );
}
