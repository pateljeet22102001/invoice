export type InvoiceStatus =
  | "DRAFT"
  | "SENT"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

export type BusinessType =
  | "GENERAL_TRADING"
  | "WHOLESALE"
  | "RETAIL"
  | "MANUFACTURING"
  | "SERVICES"
  | "TOBACCO"
  | "APMC_COMMISSION"
  | "AGRICULTURE"
  | "PHARMA"
  | "RESTAURANT"
  | "TRANSPORT"
  | "OTHER";

export interface Business {
  id: string;
  name: string;
  businessType: BusinessType;
  tradeName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  gstin: string | null;
  pan: string | null;
  licenseNumber: string | null;
  apmcMarketName: string | null;
  commissionRate: number | null;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  gstin: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  businessId: string;
  sku: string;
  name: string;
  description: string | null;
  unitPrice: number;
  costPrice: number;
  unit: string;
  hsnCode: string | null;
  gstRate: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Inventory {
  id: string;
  productId: string;
  quantity: number;
  lowStockThreshold: number;
  updatedAt: Date;
}

export type InvoiceType = "B2B" | "B2C";

export interface Invoice {
  id: string;
  businessId: string;
  invoiceNumber: string;
  invoiceType: InvoiceType;
  customerId: string;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  isInterState: boolean;
  total: number;
  notes: string | null;
  dispatchPlace: string | null;
  deliveryPlace: string | null;
  vehicleNumber: string | null;
  transporterName: string | null;
  transporterGstin: string | null;
  ewayBillNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CustomerWithInvoiceCount = Customer & {
  _count: { invoices: number };
};

export type ProductWithInventory = Product & {
  inventory: Inventory | null;
};

export type InventoryWithProduct = Inventory & {
  product: Product;
};

export type InvoiceWithCustomer = Invoice & {
  customer: Customer;
};

export type InvoiceStatsByStatus = {
  status: InvoiceStatus;
  _count: { status: number };
  _sum: { total: number | null };
};

export type ChallanStatus = "DRAFT" | "DISPATCHED" | "DELIVERED" | "CANCELLED";

export type ChallanPurpose =
  | "STOCK_TRANSFER"
  | "JOB_WORK"
  | "SALE_ON_APPROVAL"
  | "OTHER";

export interface DeliveryChallan {
  id: string;
  businessId: string;
  challanNumber: string;
  customerId: string;
  purpose: ChallanPurpose;
  status: ChallanStatus;
  issueDate: Date;
  dispatchPlace: string | null;
  deliveryPlace: string | null;
  vehicleNumber: string | null;
  transporterName: string | null;
  transporterGstin: string | null;
  ewayBillNumber: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChallanItem {
  id: string;
  challanId: string;
  productId: string | null;
  description: string;
  quantity: number;
  hsnCode: string | null;
  product: Pick<Product, "id" | "name" | "sku" | "hsnCode"> | null;
}

export type ChallanDetail = DeliveryChallan & {
  business: Business;
  customer: Customer;
  items: ChallanItem[];
};

export type SupplierType =
  | "B2B_SUPPLIER"
  | "FARMER"
  | "APMC_AGENT"
  | "UNREGISTERED"
  | "OTHER";

export type PurchaseType = "B2B" | "FARMER" | "UNREGISTERED" | "APMC_MANDI";

export type PurchaseStatus = "DRAFT" | "RECEIVED" | "PAID" | "CANCELLED";

export interface Supplier {
  id: string;
  businessId: string;
  supplierType: SupplierType;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  village: string | null;
  gstin: string | null;
  pan: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseBill {
  id: string;
  businessId: string;
  purchaseNumber: string;
  purchaseType: PurchaseType;
  supplierId: string;
  commissionAgentId: string | null;
  commissionRate: number | null;
  commissionAmount: number;
  status: PurchaseStatus;
  billDate: Date;
  dueDate: Date;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  isInterState: boolean;
  total: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseItem {
  id: string;
  purchaseId: string;
  productId: string | null;
  description: string;
  quantity: number;
  unitCost: number;
  gstRate: number;
  total: number;
  product: Pick<Product, "id" | "name" | "sku" | "hsnCode"> | null;
}

export type SupplierWithPurchaseCount = Supplier & {
  _count: { purchaseBills: number };
};

export type PurchaseWithSupplier = PurchaseBill & {
  supplier: Supplier;
};

export type PurchaseDetail = PurchaseBill & {
  business: Business;
  supplier: Supplier;
  commissionAgent: Supplier | null;
  items: PurchaseItem[];
};

export type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE";

export type VoucherType =
  | "JOURNAL"
  | "PAYMENT"
  | "RECEIPT"
  | "CONTRA"
  | "SALES"
  | "PURCHASE";

export interface Account {
  id: string;
  businessId: string;
  code: string;
  name: string;
  type: AccountType;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface JournalEntry {
  id: string;
  businessId: string;
  voucherType: VoucherType;
  voucherNumber: string;
  entryDate: Date;
  narration: string | null;
  referenceType: string | null;
  referenceId: string | null;
  isReversal: boolean;
  reversalOfId: string | null;
  createdAt: Date;
}

export interface JournalLine {
  id: string;
  entryId: string;
  accountId: string;
  debit: number;
  credit: number;
  narration: string | null;
}
