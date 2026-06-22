import { getAuditLogs } from "@/lib/accounting/audit-log";
import { getCaReportPack } from "@/lib/accounting/ca-reports";
import {
  auditLogToCsv,
  balanceSheetToCsv,
  csvResponse,
  dayBookToCsv,
  profitLossToCsv,
  trialBalanceToCsv,
} from "@/lib/accounting/csv-export";
import { parseReportPeriod } from "@/lib/accounting/period";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/session";

export async function GET(request: Request) {
  const { businessId, businessName } = await requireBusiness();
  const { searchParams } = new URL(request.url);

  const report = searchParams.get("report") ?? "trial-balance";
  const period = parseReportPeriod(
    searchParams.get("from"),
    searchParams.get("to"),
  );

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { name: true, gstin: true, pan: true },
  });

  const displayName = business?.name ?? businessName;
  const suffix = `${period.from.toISOString().slice(0, 10)}_${period.to.toISOString().slice(0, 10)}`;

  const pack = await getCaReportPack(businessId, period);

  switch (report) {
    case "trial-balance":
      return csvResponse(
        trialBalanceToCsv(displayName, period, pack.trialBalance),
        `trial-balance_${suffix}.csv`,
      );
    case "profit-loss":
      return csvResponse(
        profitLossToCsv(displayName, period, pack.profitAndLoss),
        `profit-loss_${suffix}.csv`,
      );
    case "balance-sheet":
      return csvResponse(
        balanceSheetToCsv(displayName, period, pack.balanceSheet),
        `balance-sheet_${suffix}.csv`,
      );
    case "day-book":
      return csvResponse(
        dayBookToCsv(displayName, period, pack.dayBook),
        `day-book_${suffix}.csv`,
      );
    case "audit-log": {
      const logs = await getAuditLogs(businessId, {
        from: period.from,
        to: period.to,
        limit: 5000,
      });
      return csvResponse(
        auditLogToCsv(displayName, period, logs),
        `audit-trail_${suffix}.csv`,
      );
    }
    default:
      return new Response("Unknown report type", { status: 400 });
  }
}
