import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Business, Customer, Invoice, Product } from "@/types/models";

export type InvoiceItemDetail = {
  id: string;
  invoiceId: string;
  productId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  gstRate: number;
  total: number;
  product: Pick<Product, "id" | "name" | "sku" | "hsnCode"> | null;
};

export type InvoiceDetail = Invoice & {
  business: Business;
  customer: Customer;
  items: InvoiceItemDetail[];
};

export async function getInvoiceDetail(
  businessId: string,
  invoiceId: string,
): Promise<InvoiceDetail> {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, businessId },
    include: {
      customer: true,
      business: true,
      items: {
        include: { product: true },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!invoice) {
    notFound();
  }

  return invoice as InvoiceDetail;
}
