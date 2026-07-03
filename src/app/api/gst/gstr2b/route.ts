import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildGstr2bExport, gstr2bToCsv } from "@/lib/gst-gstr2b";

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
  const format = searchParams.get("format") ?? "csv";

  if (!/^\d{4}-\d{2}$/.test(period)) {
    return NextResponse.json({ error: "Invalid period. Use YYYY-MM." }, { status: 400 });
  }

  const data = await buildGstr2bExport(businessId, period);
  const safePeriod = period.replace(/[^0-9-]/g, "");

  if (format === "json") {
    return NextResponse.json(data);
  }

  const csv = gstr2bToCsv(data.inwardSupplies);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="GSTR2B-Inward-${safePeriod}.csv"`,
    },
  });
}
