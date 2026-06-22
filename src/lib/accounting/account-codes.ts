/** Standard chart-of-accounts codes (Tally-style Indian ERP) */
export const ACCOUNT_CODES = {
  CASH: "1100",
  BANK: "1110",
  SUNDRY_DEBTORS: "1200",
  INVENTORY: "1300",
  GST_INPUT_CGST: "1401",
  GST_INPUT_SGST: "1402",
  GST_INPUT_IGST: "1403",
  SUNDRY_CREDITORS: "2100",
  GST_OUTPUT_CGST: "2201",
  GST_OUTPUT_SGST: "2202",
  GST_OUTPUT_IGST: "2203",
  CAPITAL: "3000",
  SALES: "4000",
  COGS: "5000",
  PURCHASE: "5100",
  APMC_COMMISSION: "5200",
} as const;

export type AccountCode = (typeof ACCOUNT_CODES)[keyof typeof ACCOUNT_CODES];

export const CASH_BANK_CODES = [ACCOUNT_CODES.CASH, ACCOUNT_CODES.BANK] as const;
