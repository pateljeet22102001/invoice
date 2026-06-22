import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  buildGstr1Export,
  gstr1B2bToCsv,
  gstr1HsnToCsv,
} from "@/lib/gst-gstr1";

export async function GET(request: Request) {
  const session = await auth();
  const businessId = session?.user?.businessId;

  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period =
    searchParams.get("period") ??
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const section = searchParams.get("section") ?? "b2b";

  if (!/^\d{4}-\d{2}$/.test(period)) {
    return NextResponse.json({ error: "Invalid period. Use YYYY-MM." }, { status: 400 });
  }

  const data = await buildGstr1Export(businessId, period);
  const safePeriod = period.replace(/[^0-9-]/g, "");

  if (section === "hsn") {
    const csv = gstr1HsnToCsv(data.hsnSummary);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="GSTR1-HSN-${safePeriod}.csv"`,
      },
    });
  }

  if (section === "json") {
    return NextResponse.json(data);
  }

  const csv = gstr1B2bToCsv(data.b2b);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="GSTR1-B2B-${safePeriod}.csv"`,
    },
  });
}
