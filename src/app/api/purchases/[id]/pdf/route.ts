import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { PurchasePdfDocument } from "@/components/pdf/purchase-pdf-document";
import { getPurchaseDetail } from "@/lib/purchases";
import { requireBusiness } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { businessId } = await requireBusiness();
  const { id } = await params;
  const purchase = await getPurchaseDetail(businessId, id);

  const buffer = await renderToBuffer(
    createElement(PurchasePdfDocument, { purchase }) as never,
  );

  const filename = `${purchase.purchaseNumber}-receipt.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}
