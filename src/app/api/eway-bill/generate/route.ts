import { NextResponse } from "next/server";
import { generateEwayBillFromGovernment } from "@/lib/eway-bill";
import { requireBusiness } from "@/lib/session";

/**
 * Future endpoint — Government e-way bill API integration.
 * POST body: { invoiceId?, challanId?, dispatchPlace, deliveryPlace, ... }
 * Will return { ewayBillNumber } from GST NIC portal when connected.
 */
export async function POST(request: Request) {
  await requireBusiness();

  try {
    const body = await request.json();
    const result = await generateEwayBillFromGovernment(body);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "E-way bill API not available yet.";

    return NextResponse.json(
      {
        error: message,
        code: "EWAY_API_NOT_CONNECTED",
        hint:
          "Generate e-way bill on https://ewaybillgst.gov.in and paste the 12-digit number on your invoice.",
      },
      { status: 501 },
    );
  }
}
