export type ReportPeriod = {
  from: Date;
  to: Date;
};

export function getIndianFinancialYear(reference = new Date()): ReportPeriod {
  const year = reference.getFullYear();
  const month = reference.getMonth();

  if (month >= 3) {
    return {
      from: new Date(year, 3, 1),
      to: endOfDay(new Date(year + 1, 2, 31)),
    };
  }

  return {
    from: new Date(year - 1, 3, 1),
    to: endOfDay(new Date(year, 2, 31)),
  };
}

export function endOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

export function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function parseReportPeriod(
  fromRaw?: string | null,
  toRaw?: string | null,
): ReportPeriod {
  const defaults = getIndianFinancialYear();

  const from = fromRaw ? startOfDay(new Date(fromRaw)) : defaults.from;
  let to = toRaw ? endOfDay(new Date(toRaw)) : defaults.to;

  if (Number.isNaN(from.getTime())) {
    return defaults;
  }

  if (Number.isNaN(to.getTime())) {
    to = defaults.to;
  }

  if (from > to) {
    return { from: to, to: from };
  }

  return { from, to };
}

export function formatPeriodLabel(period: ReportPeriod) {
  const fmt = (date: Date) =>
    date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return `${fmt(period.from)} – ${fmt(period.to)}`;
}
