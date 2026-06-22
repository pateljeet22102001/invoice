/** Indian GST state codes (first 2 digits of GSTIN) → state name */
const GST_STATE_CODE_TO_NAME: Record<string, string> = {
  "01": "Jammu and Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "25": "Dadra and Nagar Haveli and Daman and Diu",
  "26": "Dadra and Nagar Haveli and Daman and Diu",
  "27": "Maharashtra",
  "28": "Andhra Pradesh",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman and Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh",
};

const GSTIN_REGEX =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export function normalizeGstin(gstin: string) {
  return gstin.trim().toUpperCase();
}

export function isValidGstin(gstin: string) {
  return GSTIN_REGEX.test(normalizeGstin(gstin));
}

export function getStateCodeFromGstin(gstin: string): string | null {
  const normalized = normalizeGstin(gstin);
  if (normalized.length < 2) return null;
  return normalized.slice(0, 2);
}

export function getStateFromGstin(gstin: string): string | null {
  const code = getStateCodeFromGstin(gstin);
  if (!code) return null;
  return GST_STATE_CODE_TO_NAME[code] ?? null;
}

/** PAN is embedded in GSTIN at positions 3–12 (index 2–11) */
export function getPanFromGstin(gstin: string): string | null {
  const normalized = normalizeGstin(gstin);
  if (normalized.length < 12) return null;
  if (normalized.length === 15 && !isValidGstin(normalized)) return null;
  return normalized.slice(2, 12);
}

/** Progressive auto-fill while typing (does not require full valid GSTIN). */
export function parseGstinAutoFill(gstin: string) {
  const normalized = normalizeGstin(gstin);

  if (normalized.length < 2) {
    return {
      state: null as string | null,
      pan: null as string | null,
      stateCode: null as string | null,
      hint: null as string | null,
      complete: false,
      valid: false,
    };
  }

  const stateCode = getStateCodeFromGstin(normalized);
  const state = getStateFromGstin(normalized);
  const pan = getPanFromGstin(normalized);
  const complete = normalized.length >= 15;
  const valid = complete && isValidGstin(normalized);

  let hint: string | null = null;
  if (state && stateCode) {
    hint = `State auto-filled from GSTIN (code ${stateCode})`;
  }
  if (complete && !valid) {
    hint = "Enter a valid 15-character GSTIN.";
  }
  if (valid && pan) {
    hint = `State & PAN auto-filled from GSTIN (code ${stateCode})`;
  }

  return { state, pan, stateCode, hint, complete, valid };
}

export function resolvePartyState(
  state: string | null | undefined,
  gstin: string | null | undefined,
): string | null {
  if (state?.trim()) return state.trim();
  if (gstin?.trim()) return getStateFromGstin(gstin);
  return null;
}

export function isInterStateSupply(
  sellerState: string | null | undefined,
  buyerState: string | null | undefined,
  sellerGstin?: string | null,
  buyerGstin?: string | null,
): boolean {
  const seller = resolvePartyState(sellerState, sellerGstin);
  const buyer = resolvePartyState(buyerState, buyerGstin);

  if (!seller || !buyer) return false;

  return seller.toLowerCase() !== buyer.toLowerCase();
}

export type GstTaxSplit = {
  cgst: number;
  sgst: number;
  igst: number;
  isInterState: boolean;
  supplyLabel: string;
};

export function splitGstTax(
  taxAmount: number,
  sellerState: string | null | undefined,
  buyerState: string | null | undefined,
  sellerGstin?: string | null,
  buyerGstin?: string | null,
): GstTaxSplit {
  const interState = isInterStateSupply(
    sellerState,
    buyerState,
    sellerGstin,
    buyerGstin,
  );

  if (interState) {
    return {
      cgst: 0,
      sgst: 0,
      igst: roundMoney(taxAmount),
      isInterState: true,
      supplyLabel: "Inter-state supply (IGST)",
    };
  }

  const cgst = roundMoney(taxAmount / 2);
  const sgst = roundMoney(taxAmount - cgst);

  return {
    cgst,
    sgst,
    igst: 0,
    isInterState: false,
    supplyLabel: "Intra-state supply (CGST + SGST)",
  };
}

function roundMoney(amount: number) {
  return Math.round(amount * 100) / 100;
}

export function parseGstinDetails(gstin: string) {
  const normalized = normalizeGstin(gstin);

  if (!isValidGstin(normalized)) {
    return { valid: false as const, state: null, pan: null, stateCode: null };
  }

  return {
    valid: true as const,
    state: getStateFromGstin(normalized),
    pan: getPanFromGstin(normalized),
    stateCode: getStateCodeFromGstin(normalized),
  };
}
