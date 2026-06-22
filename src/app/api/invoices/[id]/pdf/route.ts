import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoicePdfDocument } from "@/components/pdf/invoice-pdf-document";
import { getInvoiceDetail } from "@/lib/invoices";
import { requireBusiness } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { businessId } = await requireBusiness();
  const { id } = await params;
  const invoice = await getInvoiceDetail(businessId, id);

  const buffer = await renderToBuffer(
    createElement(InvoicePdfDocument, { invoice }) as never,
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
    },
  });
}
