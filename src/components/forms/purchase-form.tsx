"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  CreditCard,
  FileText,
  Info,
  Package,
  Plus,
  Receipt,
  Trash2,
} from "lucide-react";
import { createPurchaseAction } from "@/actions/purchases";
import {
  FormError,
} from "@/components/forms/form-fields";
import { PURCHASE_TYPE_OPTIONS, PURCHASE_TYPE_HINTS } from "@/lib/constants/supplier-types";
import { PURCHASE_PAYMENT_MODE_OPTIONS } from "@/lib/constants/payment-modes";
import { defaultGstForPurchaseType } from "@/lib/constants/purchase-gst";
import { unitAllowsDecimals } from "@/lib/constants/product-units";
import { splitGstTax } from "@/lib/gst";
import { cn, formatCurrency } from "@/lib/utils";
import type { FormState } from "@/lib/form";

export type PurchaseSupplierOption = {
  id: string;
  name: string;
  state: string | null;
  village: string | null;
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
  hsnCode: string | null;
  stock: number;
};

type LineRow = {
  id: string;
  productId: string;
  isNewProduct: boolean;
  newProductName: string;
  hsnCode: string;
  quantity: string;
  unitCost: string;
  unitPrice: number;
  gstRate: number;
};

function parseDecimalField(value: string): number {
  const trimmed = value.trim().replace(/,/g, "");
  if (!trimmed || trimmed === ".") return 0;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : 0;
}

function decimalInputAllowed(raw: string, maxDecimals: number) {
  if (raw === "") return true;
  const pattern =
    maxDecimals > 0
      ? new RegExp(`^\\d*(?:\\.\\d{0,${maxDecimals}})?$`)
      : /^\d+$/;
  return pattern.test(raw);
}

function trimTrailingDecimal(value: string) {
  return value.trim().replace(/\.$/, "");
}

const NEW_PRODUCT_VALUE = "__NEW__";

const PARTY_SUPPLIER_TYPES = ["FARMER", "UNREGISTERED", "OTHER"] as const;

const MANDI_PARTY_SUPPLIER_TYPES = [
  "FARMER",
  "UNREGISTERED",
  "OTHER",
  "B2B_SUPPLIER",
] as const;

function farmerPartySuppliers(suppliers: PurchaseSupplierOption[]) {
  return suppliers.filter((s) =>
    PARTY_SUPPLIER_TYPES.includes(s.supplierType as (typeof PARTY_SUPPLIER_TYPES)[number]),
  );
}

function mandiPartySuppliers(suppliers: PurchaseSupplierOption[]) {
  return suppliers.filter((s) =>
    MANDI_PARTY_SUPPLIER_TYPES.includes(
      s.supplierType as (typeof MANDI_PARTY_SUPPLIER_TYPES)[number],
    ),
  );
}

function inlinePartySuppliers(
  suppliers: PurchaseSupplierOption[],
  purchaseType: string,
) {
  if (purchaseType === "APMC_MANDI") {
    return mandiPartySuppliers(suppliers);
  }
  return farmerPartySuppliers(suppliers);
}

const INLINE_SUPPLIER_PURCHASE_TYPES = ["FARMER", "UNREGISTERED"] as const;

const initialState: FormState = {};

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function dueDateString() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

function newLine(costPrice = 0, preferNew = false, defaultGst = 0): LineRow {
  return {
    id: crypto.randomUUID(),
    productId: preferNew ? NEW_PRODUCT_VALUE : "",
    isNewProduct: preferNew,
    newProductName: "",
    hsnCode: "",
    quantity: preferNew ? "" : "1",
    unitCost: costPrice > 0 ? String(costPrice) : "",
    unitPrice: costPrice,
    gstRate: defaultGst,
  };
}

function defaultHsnForPurchase(purchaseType: string) {
  return purchaseType === "B2B" ? "2401" : "";
}

function usesRawProduceGstDefault(purchaseType: string) {
  return (
    purchaseType === "FARMER" ||
    purchaseType === "UNREGISTERED" ||
    purchaseType === "APMC_MANDI"
  );
}

const inputCls =
  "no-spinner w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 hover:border-stone-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10";

const selectCls = `${inputCls} cursor-pointer`;

const GST_OPTIONS = [0, 5, 12, 18, 28] as const;

function FormSection({
  icon: Icon,
  title,
  description,
  children,
  className,
  tone = "default",
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  tone?: "default" | "muted" | "accent";
}) {
  return (
    <section
      className={cn(
        "border-b border-stone-100 px-5 py-5 sm:px-6 sm:py-6",
        tone === "muted" && "bg-stone-50/70",
        tone === "accent" && "bg-gradient-to-br from-emerald-50/80 via-white to-white",
        className,
      )}
    >
      <div className="mb-4 flex items-start gap-3">
        {Icon ? (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-stone-200/80">
            <Icon className="h-4 w-4 text-emerald-700" />
          </div>
        ) : null}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-tight text-stone-900">{title}</h3>
          {description ? (
            <p className="mt-0.5 text-xs leading-relaxed text-stone-500">{description}</p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
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
  const [lines, setLines] = useState<LineRow[]>([
    newLine(0, products.length === 0, defaultGstForPurchaseType("FARMER")),
  ]);
  const [supplierId, setSupplierId] = useState("");
  const [partyName, setPartyName] = useState("");
  const [partyVillage, setPartyVillage] = useState("");
  const [partySuggestionsOpen, setPartySuggestionsOpen] = useState(false);
  const [purchaseType, setPurchaseType] = useState("FARMER");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [billStatus, setBillStatus] = useState("RECEIVED");
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState("");
  const [chequeNumber, setChequeNumber] = useState("");
  const [payByDate, setPayByDate] = useState(dueDateString());
  const [mandiOwnerName, setMandiOwnerName] = useState("");
  const [mandiShopNo, setMandiShopNo] = useState("");
  const [mandiGstin, setMandiGstin] = useState("");
  const [commissionRate, setCommissionRate] = useState(String(defaultCommissionRate));
  const [showGstColumn, setShowGstColumn] = useState(false);
  const [openItemLineId, setOpenItemLineId] = useState<string | null>(null);

  const gstColumnVisible = showGstColumn || purchaseType === "B2B";

  const isApmcMandi = purchaseType === "APMC_MANDI";
  const needsB2bGstBill = purchaseType === "B2B";
  const needsGstBill = needsB2bGstBill;

  const simplePaymentFlow =
    purchaseType === "FARMER" ||
    purchaseType === "UNREGISTERED" ||
    purchaseType === "APMC_MANDI";
  const allowsInlineSupplier = INLINE_SUPPLIER_PURCHASE_TYPES.includes(
    purchaseType as (typeof INLINE_SUPPLIER_PURCHASE_TYPES)[number],
  );

  const supplierFieldLabel =
    purchaseType === "FARMER"
      ? "Farmer"
      : purchaseType === "UNREGISTERED"
        ? "Farmer / party (contract)"
        : "Supplier";

  const partyNamePlaceholder =
    purchaseType === "UNREGISTERED" ? "Party / trader name" : "Farmer name";

  const partyLocationPlaceholder =
    purchaseType === "UNREGISTERED" ? "Location / area" : "Village";

  const partySuppliers = useMemo(
    () =>
      allowsInlineSupplier
        ? inlinePartySuppliers(suppliers, purchaseType)
        : suppliers,
    [suppliers, allowsInlineSupplier, purchaseType],
  );

  const b2bSuppliers = useMemo(
    () => suppliers.filter((s) => s.supplierType === "B2B_SUPPLIER"),
    [suppliers],
  );

  const supplierOptions = purchaseType === "B2B" ? b2bSuppliers : suppliers;

  const partySuggestions = useMemo(() => {
    const q = partyName.trim().toLowerCase();
    const list = q
      ? partySuppliers.filter((s) => s.name.toLowerCase().includes(q))
      : partySuppliers;
    return list.slice(0, 8);
  }, [partyName, partySuppliers]);

  const supplierMap = useMemo(
    () => new Map(suppliers.map((s) => [s.id, s])),
    [suppliers],
  );

  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );

  const activeParty = useMemo(() => {
    if (!allowsInlineSupplier) {
      return supplierId ? supplierMap.get(supplierId) : undefined;
    }
    if (supplierId) {
      return supplierMap.get(supplierId);
    }
    const q = partyName.trim().toLowerCase();
    if (!q) return undefined;
    return partySuppliers.find((s) => s.name.toLowerCase() === q);
  }, [allowsInlineSupplier, supplierId, partyName, partySuppliers, supplierMap]);

  const totals = useMemo(() => {
    let subtotal = 0;
    let taxAmount = 0;

    for (const line of lines) {
      const isNew = line.isNewProduct || line.productId === NEW_PRODUCT_VALUE;
      if (!isNew && !line.productId) continue;
      if (isNew && !line.newProductName.trim()) continue;

      const quantity = parseDecimalField(line.quantity);
      const unitCost = parseDecimalField(line.unitCost);
      if (quantity <= 0) continue;

      const gstRate = line.gstRate;

      const lineSubtotal = quantity * unitCost;
      subtotal += lineSubtotal;
      taxAmount += lineSubtotal * (gstRate / 100);
    }

    const gstSplit = splitGstTax(
      taxAmount,
      businessState,
      isApmcMandi ? undefined : activeParty?.state,
      businessGstin,
      isApmcMandi ? mandiGstin || undefined : activeParty?.gstin,
    );

    return {
      subtotal,
      taxAmount,
      commissionAmount:
        isApmcMandi && subtotal > 0
          ? Math.round(subtotal * ((Number(commissionRate) || 0) / 100) * 100) / 100
          : 0,
      total:
        subtotal +
        taxAmount +
        (isApmcMandi && subtotal > 0
          ? Math.round(subtotal * ((Number(commissionRate) || 0) / 100) * 100) / 100
          : 0),
      ...gstSplit,
    };
  }, [
    lines,
    productMap,
    businessState,
    businessGstin,
    activeParty?.state,
    activeParty?.gstin,
    purchaseType,
    commissionRate,
    isApmcMandi,
    mandiGstin,
  ]);

  const itemsJson = JSON.stringify(
    lines
      .filter((line) => {
        const isNew = line.isNewProduct || line.productId === NEW_PRODUCT_VALUE;
        const quantity = parseDecimalField(line.quantity);
        const unitCost = parseDecimalField(line.unitCost);
        if (quantity <= 0 || unitCost <= 0) return false;
        if (isNew) return line.newProductName.trim().length > 0;
        return Boolean(line.productId);
      })
      .map((line) => {
        const isNew = line.isNewProduct || line.productId === NEW_PRODUCT_VALUE;
        const quantity = parseDecimalField(line.quantity);
        const unitCost = parseDecimalField(line.unitCost);
        if (isNew) {
          return {
            newProductName: line.newProductName.trim(),
            quantity,
            unitCost,
            unitPrice: unitCost,
            gstRate: line.gstRate,
            hsnCode: line.hsnCode.trim() || undefined,
          };
        }
        return {
          productId: line.productId,
          quantity,
          unitCost,
          gstRate: line.gstRate,
          hsnCode: line.hsnCode.trim() || undefined,
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
        hsnCode: defaultHsnForPurchase(purchaseType),
        unitCost: "",
        unitPrice: 0,
        gstRate: defaultGstForPurchaseType(purchaseType),
      });
      return;
    }

    const product = productMap.get(productId);
    const gstRate =
      usesRawProduceGstDefault(purchaseType) && !gstColumnVisible
        ? 0
        : (product?.gstRate ?? defaultGstForPurchaseType(purchaseType));
    const cost = product?.costPrice ?? 0;
    updateLine(lineId, {
      productId,
      isNewProduct: false,
      newProductName: "",
      hsnCode: product?.hsnCode ?? defaultHsnForPurchase(purchaseType),
      unitCost: cost > 0 ? String(cost) : "",
      unitPrice: cost,
      gstRate,
    });
  }

  function addLine() {
    setLines((current) => [
      ...current,
      newLine(0, false, defaultGstForPurchaseType(purchaseType)),
    ]);
  }

  function removeLine(id: string) {
    setLines((current) =>
      current.length === 1 ? current : current.filter((line) => line.id !== id),
    );
  }

  function handlePurchaseTypeChange(nextType: string) {
    setPurchaseType(nextType);
    const nextGst = defaultGstForPurchaseType(nextType);
    if (nextType === "B2B") {
      setShowGstColumn(true);
    } else {
      setShowGstColumn(false);
    }
    if (nextType === "APMC_MANDI") {
      setMandiOwnerName("");
      setMandiShopNo("");
      setMandiGstin("");
    }
    setBillStatus("RECEIVED");
    setLines((current) =>
      current.map((line) => ({
        ...line,
        gstRate: nextType === "B2B" ? nextGst : 0,
        hsnCode:
          nextType === "B2B"
            ? line.hsnCode || defaultHsnForPurchase(nextType)
            : "",
      })),
    );
    if (nextType === "B2B") {
      setSupplierId("");
      setPartyName("");
      setPartyVillage("");
    } else if (
      INLINE_SUPPLIER_PURCHASE_TYPES.includes(
        nextType as (typeof INLINE_SUPPLIER_PURCHASE_TYPES)[number],
      )
    ) {
      setSupplierId("");
      setPartyName("");
      setPartyVillage("");
    }
  }

  function pickParty(s: PurchaseSupplierOption) {
    setPartyName(s.name);
    setPartyVillage(s.village ?? "");
    setSupplierId(s.id);
    setPartySuggestionsOpen(false);
  }

  function handlePartyNameChange(value: string) {
    setPartyName(value);
    setPartySuggestionsOpen(true);
    const exact = partySuppliers.find(
      (s) => s.name.toLowerCase() === value.trim().toLowerCase(),
    );
    if (exact) {
      setSupplierId(exact.id);
      setPartyVillage(exact.village ?? "");
    } else {
      setSupplierId("");
    }
  }

  function lineItemLabel(line: LineRow) {
    const isNew = line.isNewProduct || line.productId === NEW_PRODUCT_VALUE;
    if (isNew) return line.newProductName;
    if (line.productId) return productMap.get(line.productId)?.name ?? "";
    return "";
  }

  function itemSuggestionsFor(query: string) {
    const q = query.trim().toLowerCase();
    const list = q
      ? products.filter((p) => p.name.toLowerCase().includes(q))
      : products;
    return list.slice(0, 8);
  }

  function pickItem(lineId: string, product: PurchaseProductOption) {
    onProductChange(lineId, product.id);
    setOpenItemLineId(null);
  }

  function handleItemNameChange(lineId: string, value: string) {
    const exact = products.find(
      (p) => p.name.toLowerCase() === value.trim().toLowerCase(),
    );
    if (exact) {
      onProductChange(lineId, exact.id);
    } else if (!value.trim()) {
      updateLine(lineId, {
        productId: "",
        isNewProduct: false,
        newProductName: "",
        hsnCode: "",
        unitCost: "",
        unitPrice: 0,
      });
    } else {
      const line = lines.find((l) => l.id === lineId);
      updateLine(lineId, {
        productId: NEW_PRODUCT_VALUE,
        isNewProduct: true,
        newProductName: value,
        hsnCode: line?.hsnCode || defaultHsnForPurchase(purchaseType),
        unitCost: line?.unitCost ?? "",
        unitPrice: parseDecimalField(line?.unitCost ?? ""),
      });
    }
    setOpenItemLineId(lineId);
  }

  function paymentOptionLabel(mode: string) {
    if (purchaseType === "FARMER" || purchaseType === "UNREGISTERED") {
      if (mode === "CASH") return "Cash paid";
      if (mode === "CREDIT") return "Udhar";
      return "Cheque";
    }
    if (mode === "CASH") return "Cash";
    if (mode === "CREDIT") return "Credit (udhar)";
    return "Cheque";
  }

  function handlePaymentModeChange(mode: string) {
    setPaymentMode(mode);
  }

  const selectedB2bSupplier = supplierId ? supplierMap.get(supplierId) : undefined;
  const partyGstin =
    purchaseType === "B2B" ? selectedB2bSupplier?.gstin : activeParty?.gstin;
  const gstSupplyHint = needsB2bGstBill && activeParty
    ? totals.isInterState
      ? "Inter-state · IGST input credit"
      : "Same state · CGST + SGST input credit"
    : null;

  const lineGridClass = gstColumnVisible
    ? "sm:grid-cols-[minmax(0,1.4fr)_56px_108px_108px_56px_1fr_28px]"
    : "sm:grid-cols-[minmax(0,1fr)_108px_108px_120px_28px]";

  if (purchaseType === "B2B" && suppliers.length === 0) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Add at least one GST supplier before a B2B purchase bill.{" "}
        <a href="/suppliers/new" className="font-medium underline">
          Add supplier
        </a>
      </div>
    );
  }

  const fieldLabel = "mb-1.5 block text-sm font-medium text-stone-700";
  const fieldLabelSimple = "mb-1.5 block text-xs font-medium text-stone-600";

  function renderPaymentStatusBlock(compact = false) {
    return (
      <div
        className={cn(
          "grid gap-4",
          compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:max-w-2xl",
        )}
      >
        <div>
          <label htmlFor="paymentMode" className={fieldLabel}>
            Payment
          </label>
          <select
            id="paymentMode"
            name="paymentMode"
            required
            value={paymentMode}
            onChange={(e) => handlePaymentModeChange(e.target.value)}
            className={selectCls}
          >
            {PURCHASE_PAYMENT_MODE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {paymentOptionLabel(o.value)}
              </option>
            ))}
          </select>
          {!simplePaymentFlow && (
            <p className="mt-1.5 text-xs text-stone-500">Cash, cheque, or udhar</p>
          )}
        </div>
        <div>
          <label htmlFor="status" className={fieldLabel}>
            Status
          </label>
          <select
            id="status"
            name="status"
            value={billStatus}
            onChange={(e) => setBillStatus(e.target.value)}
            className={selectCls}
          >
            <option value="RECEIVED">Received</option>
            <option value="PAID">Paid</option>
            <option value="DRAFT">Draft</option>
          </select>
          {!simplePaymentFlow && (
            <p className="mt-1.5 text-xs text-stone-500">Stock updates when received or paid</p>
          )}
        </div>
      </div>
    );
  }

  function renderPaymentExtrasCard() {
    if (paymentMode !== "CHEQUE" && paymentMode !== "CREDIT") return null;

    return (
      <div className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/50 p-4">
        {renderPaymentExtras()}
      </div>
    );
  }

  function renderPaymentExtras() {
    if (paymentMode === "CHEQUE") {
      return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="chequeNumber" className={fieldLabelSimple}>
              Cheque no.
            </label>
            <input
              id="chequeNumber"
              name="chequeNumber"
              required
              placeholder="e.g. 123456"
              value={chequeNumber}
              onChange={(e) => setChequeNumber(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="dueDate" className={fieldLabelSimple}>
              Cheque date
            </label>
            <input
              id="dueDate"
              name="dueDate"
              type="date"
              required
              value={payByDate}
              onChange={(e) => setPayByDate(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
      );
    }
    if (paymentMode === "CREDIT") {
      return (
        <div className="max-w-xs">
          <label htmlFor="dueDate" className={fieldLabelSimple}>
            Pay by (udhar)
          </label>
          <input
            id="dueDate"
            name="dueDate"
            type="date"
            required
            value={payByDate}
            onChange={(e) => setPayByDate(e.target.value)}
            className={inputCls}
          />
        </div>
      );
    }
    return null;
  }

  function renderFarmerPartyField() {
    return (
      <div className="relative">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="partyName"
            required
            autoFocus
            placeholder={partyNamePlaceholder}
            value={partyName}
            onChange={(e) => handlePartyNameChange(e.target.value)}
            onFocus={() => setPartySuggestionsOpen(true)}
            onBlur={() => {
              setTimeout(() => setPartySuggestionsOpen(false), 150);
            }}
            autoComplete="off"
            className={cn(inputCls, "min-w-0 sm:flex-[1.4]")}
          />
          <input
            id="partyVillage"
            placeholder={partyLocationPlaceholder}
            value={partyVillage}
            onChange={(e) => setPartyVillage(e.target.value)}
            className={cn(inputCls, "sm:max-w-[11rem] sm:shrink-0")}
          />
        </div>
        {partySuggestionsOpen && partySuggestions.length > 0 && (
          <ul className="absolute z-30 mt-1.5 max-h-44 w-full overflow-auto rounded-xl border border-stone-200 bg-white py-1.5 shadow-xl ring-1 ring-black/5">
            {partySuggestions.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className="w-full px-3.5 py-2.5 text-left text-sm transition hover:bg-emerald-50/60"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pickParty(s);
                  }}
                >
                  <span className="font-medium text-stone-800">{s.name}</span>
                  {s.gstin ? (
                    <span className="text-stone-500"> · {s.gstin}</span>
                  ) : s.village ? (
                    <span className="text-stone-500"> · {s.village}</span>
                  ) : s.state ? (
                    <span className="text-stone-500"> · {s.state}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
        {supplierId ? (
          <input type="hidden" name="supplierId" value={supplierId} />
        ) : (
          <>
            <input type="hidden" name="newSupplierName" value={partyName} />
            <input type="hidden" name="newSupplierVillage" value={partyVillage} />
          </>
        )}
      </div>
    );
  }

  function renderBillTypeField() {
    const hint =
      PURCHASE_TYPE_HINTS[
        purchaseType as keyof typeof PURCHASE_TYPE_HINTS
      ] ?? "";

    return (
      <div>
        <label htmlFor="purchaseType" className={fieldLabel}>
          Bill type
        </label>
        <select
          id="purchaseType"
          name="purchaseType"
          required
          value={purchaseType}
          onChange={(e) => handlePurchaseTypeChange(e.target.value)}
          className={selectCls}
        >
          {PURCHASE_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {hint ? (
          <div className="mt-2 flex gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2.5">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
            <p className="text-xs leading-relaxed text-emerald-900/80">{hint}</p>
          </div>
        ) : null}
      </div>
    );
  }

  function renderSupplierField() {
    if (isApmcMandi || simplePaymentFlow) {
      return (
        <div>
          <label htmlFor="partyName" className={fieldLabel}>
            {supplierFieldLabel}
          </label>
          {renderFarmerPartyField()}
        </div>
      );
    }

    return (
      <div>
        <label htmlFor="supplierId" className={fieldLabel}>
          {supplierFieldLabel}
        </label>
        <select
          id="supplierId"
          name="supplierId"
          required
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
          className={selectCls}
        >
          <option value="" disabled>
            Select supplier…
          </option>
          {supplierOptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.gstin ? `${s.name} · ${s.gstin}` : s.name}
            </option>
          ))}
        </select>
        {purchaseType === "B2B" && (
          <Link
            href="/suppliers/new"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-900"
          >
            + Add B2B supplier
          </Link>
        )}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state.error} />

      <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_40px_rgba(0,0,0,0.06)]">
        <FormSection
          icon={FileText}
          title="Bill details"
          description="Farmer bill · Mandi bill · or B2B bill"
        >
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start">
            <div className={isApmcMandi ? "lg:col-span-6" : "lg:col-span-4"}>
              {renderBillTypeField()}
            </div>
            {!isApmcMandi && <div className="lg:col-span-5">{renderSupplierField()}</div>}
            <div className={isApmcMandi ? "lg:col-span-6" : "lg:col-span-3"}>
              <label htmlFor="billDate" className={fieldLabel}>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-stone-400" />
                  Date
                </span>
              </label>
              <input
                id="billDate"
                name="billDate"
                type="date"
                required
                defaultValue={todayString()}
                className={inputCls}
              />
            </div>
          </div>

          {isApmcMandi && (
            <div className="mt-5 space-y-5">
              <input type="hidden" name="apmcMandiRole" value="BUYER" />

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div>
                  <label htmlFor="mandiOwnerName" className={fieldLabel}>
                    Mandi owner name
                  </label>
                  <input
                    id="mandiOwnerName"
                    name="mandiOwnerName"
                    required
                    placeholder="Shop / owner name"
                    value={mandiOwnerName}
                    onChange={(e) => setMandiOwnerName(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label htmlFor="mandiShopNo" className={fieldLabel}>
                    Shop number
                  </label>
                  <input
                    id="mandiShopNo"
                    name="mandiShopNo"
                    required
                    placeholder="Mandi shop no."
                    value={mandiShopNo}
                    onChange={(e) => setMandiShopNo(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label htmlFor="mandiGstin" className={fieldLabel}>
                    GST number
                  </label>
                  <input
                    id="mandiGstin"
                    name="mandiGstin"
                    placeholder="If agent has GSTIN"
                    maxLength={15}
                    value={mandiGstin}
                    onChange={(e) => setMandiGstin(e.target.value.toUpperCase())}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="supplierInvoiceNo" className={fieldLabel}>
                    I-Form no.
                  </label>
                  <input
                    id="supplierInvoiceNo"
                    name="supplierInvoiceNo"
                    required
                    placeholder="Bill number"
                    value={supplierInvoiceNo}
                    onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label htmlFor="commissionRate" className={fieldLabel}>
                    Commission %
                  </label>
                  <input
                    id="commissionRate"
                    name="commissionRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    required
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    className={cn(inputCls, "no-spinner")}
                  />
                </div>
              </div>
            </div>
          )}
        </FormSection>

        {needsGstBill && (
          <FormSection
            icon={Receipt}
            title="GST invoice details"
            description="Supplier tax invoice for input credit"
            tone="muted"
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="supplierInvoiceNo" className={fieldLabel}>
                  Supplier GST bill no.
                </label>
                <input
                  id="supplierInvoiceNo"
                  name="supplierInvoiceNo"
                  required
                  placeholder="Tax invoice number"
                  value={supplierInvoiceNo}
                  onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="rounded-xl border border-stone-200 bg-white px-4 py-3">
                <p className={fieldLabel}>Supplier GSTIN</p>
                {partyGstin ? (
                  <p className="mt-1 font-mono text-sm font-medium text-stone-900">{partyGstin}</p>
                ) : (
                  <p className="mt-1 text-sm text-amber-800">
                    {supplierId ? "Add GSTIN in Suppliers" : "Select supplier"}
                  </p>
                )}
                {gstSupplyHint && (
                  <p className="mt-2 text-xs text-emerald-700">{gstSupplyHint}</p>
                )}
              </div>
            </div>
          </FormSection>
        )}

        <FormSection
          icon={CreditCard}
          title="Payment & status"
          description="How you paid and whether the bill is received, paid, or draft"
          tone="accent"
        >
          {renderPaymentStatusBlock()}
          {renderPaymentExtrasCard()}
        </FormSection>

        <FormSection
          icon={Package}
          title="Items"
          description="Add products, quantity, and rate"
          className="border-b-0 pb-2"
        >
          <div className="overflow-x-auto rounded-xl border border-stone-200/90 bg-white shadow-sm">
            <div className={cn(gstColumnVisible ? "sm:min-w-[720px]" : "sm:min-w-[560px]")}>
            <div
              className={cn(
                "hidden gap-x-3 border-b border-stone-200 bg-stone-50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-stone-400 sm:grid sm:items-center",
                lineGridClass,
              )}
            >
              <span>Item / grade</span>
              {gstColumnVisible && <span>HSN</span>}
              <span className="text-right">Qty</span>
              <span className="text-right">Rate</span>
              {gstColumnVisible && <span>GST</span>}
              <span className="text-right">Amount</span>
              <span className="sr-only">Remove</span>
            </div>

            <div className="divide-y divide-stone-100">
              {lines.map((line, index) => {
                const isNew = line.isNewProduct || line.productId === NEW_PRODUCT_VALUE;
                const product =
                  !isNew && line.productId ? productMap.get(line.productId) : undefined;
                const quantity = parseDecimalField(line.quantity);
                const unitCost = parseDecimalField(line.unitCost);
                const lineTotal = quantity * unitCost;
                const lineGst = gstColumnVisible ? lineTotal * (line.gstRate / 100) : 0;
                const unit = isNew ? "kg" : (product?.unit ?? "kg");
                const qtyDecimals = unitAllowsDecimals(unit) ? 3 : 0;

                return (
                  <div
                    key={line.id}
                    className={cn(
                      "grid grid-cols-1 gap-3 px-4 py-3 sm:grid sm:items-center sm:gap-x-3 sm:py-3.5",
                      lineGridClass,
                    )}
                  >
                    <div className="min-w-0">
                      <label className="mb-1.5 block text-xs font-medium text-stone-500 sm:sr-only">
                        Item
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="Type item name"
                          value={lineItemLabel(line)}
                          onChange={(e) => handleItemNameChange(line.id, e.target.value)}
                          onFocus={() => setOpenItemLineId(line.id)}
                          onBlur={() => {
                            setTimeout(() => setOpenItemLineId(null), 150);
                          }}
                          autoComplete="off"
                          className={inputCls}
                        />
                        {openItemLineId === line.id &&
                          itemSuggestionsFor(lineItemLabel(line)).length > 0 && (
                            <ul className="absolute z-30 mt-1 max-h-36 w-full overflow-auto rounded-xl border border-stone-200 bg-white py-1 shadow-xl ring-1 ring-black/5">
                              {itemSuggestionsFor(lineItemLabel(line)).map((p) => (
                                <li key={p.id}>
                                  <button
                                    type="button"
                                    className="w-full px-3.5 py-2 text-left text-sm hover:bg-emerald-50/60"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      pickItem(line.id, p);
                                    }}
                                  >
                                    <span className="font-medium text-stone-800">{p.name}</span>
                                    {p.costPrice > 0 ? (
                                      <span className="text-stone-500"> · ₹{p.costPrice}</span>
                                    ) : null}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                      </div>
                    </div>

                    {gstColumnVisible && (
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-stone-500 sm:sr-only">
                          HSN
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="2401"
                          value={line.hsnCode}
                          onChange={(e) =>
                            updateLine(line.id, { hsnCode: e.target.value })
                          }
                          className={cn(inputCls, "text-center font-mono text-xs")}
                          title="HSN / SAC code"
                        />
                      </div>
                    )}

                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-stone-500 sm:sr-only">
                        Qty ({unit})
                      </label>
                      <input
                        type="text"
                        inputMode={unitAllowsDecimals(unit) ? "decimal" : "numeric"}
                        required
                        placeholder={unitAllowsDecimals(unit) ? "0.000" : "1"}
                        value={line.quantity}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (!decimalInputAllowed(raw, qtyDecimals)) return;
                          updateLine(line.id, { quantity: raw });
                        }}
                        onBlur={() => {
                          const trimmed = trimTrailingDecimal(line.quantity);
                          if (trimmed !== line.quantity) {
                            updateLine(line.id, { quantity: trimmed });
                          }
                        }}
                        className={cn(inputCls, "text-right tabular-nums")}
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-stone-500 sm:sr-only">
                        Rate
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        required
                        placeholder="0.00"
                        value={line.unitCost}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (!decimalInputAllowed(raw, 2)) return;
                          const parsed = parseDecimalField(raw);
                          updateLine(line.id, {
                            unitCost: raw,
                            unitPrice: parsed,
                          });
                        }}
                        onBlur={() => {
                          const trimmed = trimTrailingDecimal(line.unitCost);
                          if (trimmed !== line.unitCost) {
                            updateLine(line.id, {
                              unitCost: trimmed,
                              unitPrice: parseDecimalField(trimmed),
                            });
                          }
                        }}
                        className={cn(inputCls, "text-right tabular-nums")}
                      />
                    </div>

                    {gstColumnVisible && (
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-stone-500 sm:sr-only">
                          GST
                        </label>
                        <select
                          value={line.gstRate}
                          onChange={(e) =>
                            updateLine(line.id, {
                              gstRate: Number(e.target.value),
                            })
                          }
                          className={selectCls}
                        >
                          {GST_OPTIONS.map((r) => (
                            <option key={r} value={r}>
                              {r}%
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 sm:justify-end">
                      <label className="text-xs font-medium text-stone-500 sm:sr-only">
                        Amount
                      </label>
                      <p className="text-sm font-semibold tabular-nums text-stone-900 sm:text-right">
                        {formatCurrency(lineTotal + lineGst)}
                      </p>
                    </div>

                    <div className="flex justify-end sm:justify-center">
                      <button
                        type="button"
                        onClick={() => removeLine(line.id)}
                        className="rounded-lg p-2 text-stone-400 transition hover:bg-red-50 hover:text-red-600"
                        aria-label={`Remove row ${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center gap-2 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 px-4 py-2 text-sm font-medium text-emerald-800 transition hover:border-emerald-400 hover:bg-emerald-50"
            >
              <Plus className="h-4 w-4" />
              Add item
            </button>
            {!gstColumnVisible && usesRawProduceGstDefault(purchaseType) && (
              <button
                type="button"
                onClick={() => setShowGstColumn(true)}
                className="text-sm text-stone-500 underline decoration-stone-300 underline-offset-2 hover:text-stone-800"
              >
                Add GST (processed product)
              </button>
            )}
          </div>
        </FormSection>

        <div className="grid gap-5 border-t border-stone-100 bg-stone-50/40 p-5 sm:grid-cols-[1fr_280px] sm:p-6">
          <div>
            <label htmlFor="notes" className={fieldLabel}>
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="Lot no., vehicle, mandi reference…"
              className={cn(inputCls, "resize-none")}
            />
          </div>

          <div className="rounded-2xl bg-stone-900 p-5 text-white shadow-lg">
            <p className="text-xs font-medium uppercase tracking-wider text-stone-400">
              Bill total
            </p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between text-stone-300">
                <span>Subtotal</span>
                <span className="tabular-nums font-medium text-white">
                  {formatCurrency(totals.subtotal)}
                </span>
              </div>
              {totals.taxAmount > 0 && (
                <>
                  {totals.igst > 0 ? (
                    <div className="flex justify-between text-stone-300">
                      <span>IGST</span>
                      <span className="tabular-nums">{formatCurrency(totals.igst)}</span>
                    </div>
                  ) : (
                    <>
                      {totals.cgst > 0 && (
                        <div className="flex justify-between text-stone-300">
                          <span>CGST</span>
                          <span className="tabular-nums">{formatCurrency(totals.cgst)}</span>
                        </div>
                      )}
                      {totals.sgst > 0 && (
                        <div className="flex justify-between text-stone-300">
                          <span>SGST</span>
                          <span className="tabular-nums">{formatCurrency(totals.sgst)}</span>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
              {totals.commissionAmount > 0 && (
                <div className="flex justify-between text-stone-300">
                  <span>Commission</span>
                  <span className="tabular-nums">
                    {formatCurrency(totals.commissionAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-stone-700 pt-3">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold tabular-nums tracking-tight">
                  {formatCurrency(totals.total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <input type="hidden" name="items" value={itemsJson} readOnly />

        <div className="flex flex-wrap gap-3 border-t border-stone-200 bg-white px-5 py-4 sm:px-6">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-w-[140px] items-center justify-center rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save bill"}
          </button>
          <a
            href="/purchases"
            className="inline-flex items-center justify-center rounded-xl border border-stone-200 bg-white px-6 py-3 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50"
          >
            Cancel
          </a>
        </div>
      </div>
    </form>
  );
}
