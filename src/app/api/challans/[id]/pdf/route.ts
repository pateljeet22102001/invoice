import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { ChallanPdfDocument } from "@/components/pdf/challan-pdf-document";
import { getChallanDetail } from "@/lib/challans";
import { requireBusiness } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { businessId } = await requireBusiness();
  const { id } = await params;
  const challan = await getChallanDetail(businessId, id);

  const buffer = await renderToBuffer(
    createElement(ChallanPdfDocument, { challan }) as never,
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${challan.challanNumber}.pdf"`,
    },
  });
}
