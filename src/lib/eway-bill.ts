/**
 * E-way Bill helpers — India GST government e-way bill (NIC / ewbillgst.gov.in)
 *
 * FUTURE: Government API integration will call generateEwayBill() and
 * automatically save the returned 12-digit number on the invoice/challan.
 */

export function normalizeEwayBillNumber(value: string) {
  return value.replace(/\s/g, "").trim();
}

/** Indian e-way bill numbers are typically 12 digits */
export function isValidEwayBillNumber(value: string) {
  const normalized = normalizeEwayBillNumber(value);
  return /^\d{12}$/.test(normalized);
}

export function formatEwayBillNumber(value: string) {
  const normalized = normalizeEwayBillNumber(value);
  if (normalized.length !== 12) return normalized;
  return `${normalized.slice(0, 4)} ${normalized.slice(4, 8)} ${normalized.slice(8)}`;
}

export type EwayBillGenerateRequest = {
  invoiceId?: string;
  challanId?: string;
  dispatchPlace: string;
  deliveryPlace: string;
  vehicleNumber?: string;
  transporterGstin?: string;
};

export type EwayBillGenerateResult = {
  ewayBillNumber: string;
  generatedAt: string;
  validUntil?: string;
};

/**
 * Placeholder for future Government of India e-way bill API integration.
 * Will connect to GST NIC portal / GSP provider when credentials are configured.
 */
export async function generateEwayBillFromGovernment(
  _request: EwayBillGenerateRequest,
): Promise<EwayBillGenerateResult> {
  throw new Error(
    "Government e-way bill API not connected yet. Generate on the GST portal and paste the 12-digit number on your invoice.",
  );
}

export const EWAY_BILL_GOVT_PORTAL = "https://ewaybillgst.gov.in";
