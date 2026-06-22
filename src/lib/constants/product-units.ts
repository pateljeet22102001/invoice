/** Only two units — simple Indian daily use: count (pcs) or weight (kg) */
export const PRODUCT_UNITS = [
  { value: "pcs", label: "Pieces (pcs) — watch, phone, keyboard, counted items" },
  { value: "kg", label: "Kilogram (kg) — tobacco, grains, vegetables, farmer produce" },
] as const;

export type ProductUnit = "pcs" | "kg";

export const PRODUCT_UNIT_VALUES: ProductUnit[] = ["pcs", "kg"];

/** Default unit by business type (signup) */
export const BUSINESS_UNIT_PRESETS: Record<
  string,
  { defaultUnit: ProductUnit; hint: string }
> = {
  TOBACCO: {
    defaultUnit: "kg",
    hint: "Add each tobacco grade once. When you buy from farmer, use Purchase Bills — stock adds in kg automatically.",
  },
  AGRICULTURE: {
    defaultUnit: "kg",
    hint: "Add each crop once. Buying from farmer? Use Purchase Bills to add stock in kg.",
  },
  APMC_COMMISSION: {
    defaultUnit: "kg",
    hint: "APMC market trade is in kg. Record farmer purchases in Purchase Bills.",
  },
  RESTAURANT: {
    defaultUnit: "kg",
    hint: "Raw ingredients by kg. Packaged items can be pcs.",
  },
  RETAIL: {
    defaultUnit: "pcs",
    hint: "Shop items usually pcs. Rice/sugar sold loose → kg.",
  },
  WHOLESALE: {
    defaultUnit: "pcs",
    hint: "Packed goods in pcs. Bulk commodities (wheat, tobacco) in kg.",
  },
  GENERAL_TRADING: {
    defaultUnit: "kg",
    hint: "Tobacco and APMC markets use kg. Shop items use pcs.",
  },
  MANUFACTURING: {
    defaultUnit: "pcs",
    hint: "Finished goods in pcs. Raw material in kg.",
  },
  PHARMA: {
    defaultUnit: "pcs",
    hint: "Medicines counted in pcs (strips, bottles).",
  },
  SERVICES: {
    defaultUnit: "pcs",
    hint: "Stock items are usually pcs.",
  },
  TRANSPORT: {
    defaultUnit: "pcs",
    hint: "Spare parts are usually pcs.",
  },
  OTHER: {
    defaultUnit: "pcs",
    hint: "Only two choices: pcs (count) or kg (weight). Pick one per product.",
  },
};

const WEIGHT_FIRST_BUSINESSES = new Set([
  "TOBACCO",
  "AGRICULTURE",
  "APMC_COMMISSION",
  "RESTAURANT",
]);

export function getBusinessUnitPreset(businessType: string) {
  return BUSINESS_UNIT_PRESETS[businessType] ?? BUSINESS_UNIT_PRESETS.OTHER;
}

export function getDefaultUnitForBusiness(businessType: string): ProductUnit {
  return getBusinessUnitPreset(businessType).defaultUnit;
}

export function getUnitOptionsForBusiness(_businessType?: string) {
  return PRODUCT_UNITS.map((u) => ({ value: u.value, label: u.label }));
}

export function isWeightFirstBusiness(businessType: string) {
  return WEIGHT_FIRST_BUSINESSES.has(businessType);
}

export function isKgOnlyBusiness(businessType: string) {
  return (
    businessType === "TOBACCO" ||
    businessType === "AGRICULTURE" ||
    businessType === "APMC_COMMISSION"
  );
}

export function showUnitChoice(businessType: string) {
  return !isKgOnlyBusiness(businessType);
}

export function normalizeProductUnit(unit: string): ProductUnit {
  const lower = unit.trim().toLowerCase();
  if (lower === "kg" || lower === "kgs" || lower === "kilogram") return "kg";
  return "pcs";
}

export function unitAllowsDecimals(unit: string) {
  return normalizeProductUnit(unit) === "kg";
}

export function roundQuantity(quantity: number, unit: string) {
  if (!Number.isFinite(quantity) || quantity < 0) return 0;
  if (unitAllowsDecimals(unit)) {
    return Math.round(quantity * 1000) / 1000;
  }
  return Math.floor(quantity);
}

export function quantityInputStep(unit: string) {
  return unitAllowsDecimals(unit) ? "0.001" : "1";
}

export function formatQuantityWithUnit(quantity: number, unit: string) {
  const normalized = normalizeProductUnit(unit);
  const rounded = normalized === "kg"
    ? quantity.toLocaleString("en-IN", { maximumFractionDigits: 3 })
    : String(Math.floor(quantity));
  return `${rounded} ${normalized}`;
}

export function pricePerUnitLabel(unit: string) {
  const normalized = normalizeProductUnit(unit);
  return normalized === "kg" ? "Price per kg (INR)" : "Price per pcs (INR)";
}

export function unitSelectValue(storedUnit: string): ProductUnit {
  return normalizeProductUnit(storedUnit);
}

const COUNTED_ITEM_PATTERN =
  /\b(keyboard|mouse|watch|phone|mobile|laptop|charger|cable|hub|earphone|headphone|speaker|camera|tablet|electronics)\b/i;

const WEIGHT_ITEM_PATTERN =
  /\b(tobacco|tambaku|bidi|wheat|rice|tomato|onion|potato|apple|grape|grain|vegetable|fruit|flour|dal|sugar|produce|mandi|apmc|leaf)\b/i;

export function suggestUnitFromName(
  name: string,
  businessType = "GENERAL_TRADING",
): ProductUnit | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  if (WEIGHT_ITEM_PATTERN.test(trimmed)) return "kg";
  if (COUNTED_ITEM_PATTERN.test(trimmed)) return "pcs";
  if (isWeightFirstBusiness(businessType)) return "kg";
  return null;
}

export function unitMismatchWarning(
  name: string,
  unit: string,
  businessType = "GENERAL_TRADING",
): string | null {
  if (isKgOnlyBusiness(businessType)) return null;

  const trimmed = name.trim();
  if (!trimmed) return null;
  const normalized = normalizeProductUnit(unit);

  if (normalized === "kg" && COUNTED_ITEM_PATTERN.test(trimmed)) {
    return `"${trimmed}" is usually sold in pcs (pieces), not kg.`;
  }
  if (normalized === "pcs" && WEIGHT_ITEM_PATTERN.test(trimmed)) {
    return `"${trimmed}" is usually sold by kg (weight), not pcs.`;
  }
  if (
    isWeightFirstBusiness(businessType) &&
    normalized === "pcs" &&
    WEIGHT_ITEM_PATTERN.test(trimmed)
  ) {
    return `In ${businessType.replace(/_/g, " ").toLowerCase()}, "${trimmed}" is usually kg.`;
  }
  return null;
}

export function pricePlaceholder(unit: string) {
  return normalizeProductUnit(unit) === "kg" ? "e.g. 45" : "e.g. 999";
}

export function costPlaceholder(unit: string) {
  return normalizeProductUnit(unit) === "kg" ? "e.g. 30" : "e.g. 600";
}
