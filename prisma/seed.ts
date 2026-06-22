import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { BRAND } from "../src/lib/constants/brand";
import { ensureChartOfAccounts } from "../src/lib/accounting/chart-of-accounts";
import {
  postInvoiceReceiptJournal,
  postInvoiceSaleJournal,
  postPurchaseBillJournal,
} from "../src/lib/accounting/journal";
import { getAccountingDb } from "../src/lib/prisma-accounting";
import {
  getPurchaseDb,
  getPurchaseItemDb,
  getSupplierDb,
} from "../src/lib/prisma-purchase";

const prisma = new PrismaClient();
const purchaseDb = getPurchaseDb(prisma);
const purchaseItemDb = getPurchaseItemDb(prisma);
const supplierDb = getSupplierDb(prisma);

async function main() {
  const accounting = getAccountingDb(prisma);

  await accounting.auditLog.deleteMany();
  await accounting.journalLine.deleteMany();
  await accounting.journalEntry.deleteMany();
  await accounting.account.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await purchaseItemDb.deleteMany();
  await purchaseDb.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await supplierDb.deleteMany();
  await prisma.user.deleteMany();
  await prisma.business.deleteMany();

  const passwordHash = await bcrypt.hash("demo123456", 12);

  const business = await prisma.business.create({
    data: {
      name: "Sharma Tobacco Traders",
      businessType: "TOBACCO",
      tradeName: "Sharma Traders",
      licenseNumber: "MH-TOB-2024-001",
      commissionRate: 2.5,
      email: BRAND.demoEmail,
      phone: "+91 98765 43210",
      address: "Shop 12, Andheri West",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400058",
      gstin: "27AABCS1429B1Z5",
      pan: "AABCS1429B",
      currency: "INR",
    },
  });

  await prisma.user.create({
    data: {
      name: "Rahul Sharma",
      email: BRAND.demoEmail,
      passwordHash,
      businessId: business.id,
    },
  });

  await ensureChartOfAccounts(business.id);

  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        businessId: business.id,
        name: "Patel Electronics",
        email: "billing@patel.in",
        phone: "+91 98200 11223",
        city: "Ahmedabad",
        state: "Gujarat",
        gstin: "24AABCP1234A1Z2",
      },
    }),
    prisma.customer.create({
      data: {
        businessId: business.id,
        name: "Reddy Wholesale",
        email: "accounts@reddy.in",
        phone: "+91 98480 55667",
        city: "Hyderabad",
        state: "Telangana",
      },
    }),
    prisma.customer.create({
      data: {
        businessId: business.id,
        name: "Singh Retail Mart",
        email: "finance@singh.in",
        city: "Delhi",
        state: "Delhi",
      },
    }),
  ]);

  const suppliers = await Promise.all([
    supplierDb.create({
      data: {
        businessId: business.id,
        supplierType: "B2B_SUPPLIER",
        name: "Gupta Electronics Wholesale",
        phone: "+91 98100 22334",
        city: "Mumbai",
        state: "Maharashtra",
        gstin: "27AABCG1234A1Z8",
      },
    }),
    supplierDb.create({
      data: {
        businessId: business.id,
        supplierType: "FARMER",
        name: "Ramesh Patil",
        phone: "+91 98220 44556",
        village: "Nashik Grape Market",
        state: "Maharashtra",
        pan: "ABCPR1234K",
      },
    }),
    supplierDb.create({
      data: {
        businessId: business.id,
        supplierType: "APMC_AGENT",
        name: "Nashik APMC Commission Agent",
        phone: "+91 98230 11223",
        city: "Nashik",
        state: "Maharashtra",
        village: "Nashik APMC",
      },
    }),
  ]) as Array<{ id: string }>;

  const products = await Promise.all([
    prisma.product.create({
      data: {
        businessId: business.id,
        sku: "TOB-001",
        name: "Virginia Tobacco Leaf",
        description: "Grade A Virginia tobacco",
        unit: "kg",
        unitPrice: 145,
        costPrice: 120,
        hsnCode: "2401",
        gstRate: 5,
        inventory: { create: { quantity: 0, lowStockThreshold: 50 } },
      },
    }),
    prisma.product.create({
      data: {
        businessId: business.id,
        sku: "TOB-002",
        name: "Burley Tobacco",
        unit: "kg",
        unitPrice: 130,
        costPrice: 105,
        hsnCode: "2401",
        gstRate: 5,
        inventory: { create: { quantity: 250.5, lowStockThreshold: 100 } },
      },
    }),
  ]);

  const paidInvoice = await prisma.invoice.create({
    data: {
      businessId: business.id,
      invoiceNumber: "INV-2026-001",
      customerId: customers[0].id,
      status: "PAID",
      issueDate: new Date("2026-06-01"),
      dueDate: new Date("2026-06-15"),
      subtotal: 23900,
      taxRate: 5,
      taxAmount: 1195,
      cgstAmount: 597.5,
      sgstAmount: 597.5,
      igstAmount: 0,
      isInterState: false,
      total: 25095,
      items: {
        create: [
          {
            productId: products[0].id,
            description: products[0].name,
            quantity: 120,
            unitPrice: 145,
            gstRate: 5,
            total: 17400,
          },
          {
            productId: products[1].id,
            description: products[1].name,
            quantity: 50,
            unitPrice: 130,
            gstRate: 5,
            total: 6500,
          },
        ],
      },
    },
    include: { items: true },
  });

  const sentInvoice = await prisma.invoice.create({
    data: {
      businessId: business.id,
      invoiceNumber: "INV-2026-002",
      customerId: customers[1].id,
      status: "SENT",
      issueDate: new Date("2026-06-10"),
      dueDate: new Date("2026-06-24"),
      subtotal: 13000,
      taxRate: 5,
      taxAmount: 650,
      cgstAmount: 325,
      sgstAmount: 325,
      igstAmount: 0,
      isInterState: false,
      total: 13650,
      items: {
        create: [
          {
            productId: products[1].id,
            description: products[1].name,
            quantity: 100,
            unitPrice: 130,
            gstRate: 5,
            total: 13000,
          },
        ],
      },
    },
    include: { items: true },
  });

  const costMap = new Map(
    products.map((product) => [product.id, { id: product.id, costPrice: product.costPrice }]),
  );

  await postInvoiceSaleJournal(prisma, business.id, paidInvoice, paidInvoice.items, costMap);
  await postInvoiceReceiptJournal(prisma, business.id, paidInvoice);
  await postInvoiceSaleJournal(prisma, business.id, sentInvoice, sentInvoice.items, costMap);

  const mandiCommission = Math.round(30000 * 0.025 * 100) / 100;

  const purchaseBill = (await purchaseDb.create({
    data: {
      businessId: business.id,
      purchaseNumber: "PUR-2026-001",
      purchaseType: "APMC_MANDI",
      supplierId: suppliers[1].id,
      commissionAgentId: suppliers[2].id,
      commissionRate: 2.5,
      commissionAmount: mandiCommission,
      status: "RECEIVED",
      billDate: new Date("2026-06-05"),
      dueDate: new Date("2026-06-20"),
      subtotal: 30000,
      taxRate: 5,
      taxAmount: 1500,
      cgstAmount: 750,
      sgstAmount: 750,
      igstAmount: 0,
      isInterState: false,
      total: 31500 + mandiCommission,
      items: {
        create: [
          {
            productId: products[0].id,
            description: products[0].name,
            quantity: 250,
            unitCost: 120,
            gstRate: 5,
            total: 30000,
          },
        ],
      },
    },
  })) as {
    id: string;
    purchaseNumber: string;
    billDate: Date;
    subtotal: number;
    total: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
  };

  await prisma.inventory.update({
    where: { productId: products[0].id },
    data: { quantity: { increment: 250 } },
  });

  await postPurchaseBillJournal(prisma, business.id, {
    id: purchaseBill.id,
    purchaseNumber: purchaseBill.purchaseNumber,
    billDate: purchaseBill.billDate,
    subtotal: purchaseBill.subtotal,
    total: purchaseBill.total,
    cgstAmount: purchaseBill.cgstAmount,
    sgstAmount: purchaseBill.sgstAmount,
    igstAmount: purchaseBill.igstAmount,
    commissionAmount: mandiCommission,
  });

  console.log(`Demo login: ${BRAND.demoEmail} / ${BRAND.demoPassword}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
