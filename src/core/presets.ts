export type PresetId = "today" | "yesterday" | "last7" | "last30" | "last90" | "thisWeek" | "lastWeek" | "thisMonth" | "prevMonth" | "thisYear";

export type ComparisonId = "mtdVsPmtd" | "yoy" | "ytdVsYtd";

export const toStartOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
export const toEndOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

// Helper for start of week (assuming Sunday is the first day)
export const toStartOfWeek = (d: Date) => {
    const day = d.getDay();
    const diff = d.getDate() - day;
    return toStartOfDay(new Date(new Date(d).setDate(diff)));
}

export function getRange(presetId: PresetId): { from: Date; to: Date } {
  const now = new Date();
  const today0 = toStartOfDay(now);
  switch (presetId) {
    case "today":
      return { from: today0, to: toEndOfDay(now) };
    case "yesterday": {
      const y = addDays(today0, -1);
      return { from: y, to: toEndOfDay(y) };
    }
    case "last7":
      return { from: addDays(today0, -6), to: toEndOfDay(now) };
    case "last30":
      return { from: addDays(today0, -29), to: toEndOfDay(now) };
    case "last90":
      return { from: addDays(today0, -89), to: toEndOfDay(now) };
    case "thisWeek": {
        const sow = toStartOfWeek(now);
        return { from: sow, to: toEndOfDay(addDays(sow, 6)) };
    }
    case "lastWeek": {
        const sow = toStartOfWeek(now);
        const prevSow = addDays(sow, -7);
        return { from: prevSow, to: toEndOfDay(addDays(prevSow, 6)) };
    }
    case "thisMonth": {
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: new Date(now.getFullYear(), now.getMonth(), lastDay, 23, 59, 59, 999),
      };
    }
    case "prevMonth": {
      const prevMonth = now.getMonth() - 1;
      const prevYear = prevMonth < 0 ? now.getFullYear() - 1 : now.getFullYear();
      const adjustedMonth = prevMonth < 0 ? 11 : prevMonth;
      const lastDayOfPrevMonth = new Date(prevYear, adjustedMonth + 1, 0).getDate();

      const from = new Date(prevYear, adjustedMonth, 1);
      const to = new Date(prevYear, adjustedMonth, lastDayOfPrevMonth, 23, 59, 59, 999);
      return { from, to };
    }
    case "thisYear":
        return {
            from: new Date(now.getFullYear(), 0, 1),
            to: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
        };
    default:
      return { from: today0, to: toEndOfDay(now) };
  }
}

export interface DateRange {
  from: Date;
  to: Date;
}

export function getComparisonRanges(comparisonId: ComparisonId, refDate?: Date): DateRange[] {
  const now = refDate || new Date();

  switch (comparisonId) {
    case "mtdVsPmtd": {
      const dayOfMonth = now.getDate();

      // Current Month To Date (from 1st to today)
      const currentMTD: DateRange = {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: new Date(now.getFullYear(), now.getMonth(), dayOfMonth, 23, 59, 59, 999)
      };

      // Previous Month To Date (same number of days)
      const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMTD: DateRange = {
        from: new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), 1),
        to: new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), dayOfMonth, 23, 59, 59, 999)
      };

      return [currentMTD, prevMTD];
    }

    case "yoy": {
      // Current complete month vs same month last year (both complete months)
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // If we're not at the end of the current month, use the previous complete month
      const lastDayOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const isCurrentMonthComplete = now.getDate() === lastDayOfCurrentMonth;

      const targetMonth = isCurrentMonthComplete ? currentMonth : currentMonth - 1;
      const targetYear = isCurrentMonthComplete ? currentYear : (currentMonth === 0 ? currentYear - 1 : currentYear);

      // Current period (complete month)
      const currentYoY: DateRange = {
        from: new Date(targetYear, targetMonth, 1),
        to: new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999)
      };

      // Same month previous year (complete month)
      const prevYoY: DateRange = {
        from: new Date(targetYear - 1, targetMonth, 1),
        to: new Date(targetYear - 1, targetMonth + 1, 0, 23, 59, 59, 999)
      };

      return [currentYoY, prevYoY];
    }

    case "ytdVsYtd": {
      const currentYear = now.getFullYear();

      // Current YTD (January 1 to today)
      const currentYTD: DateRange = {
        from: new Date(currentYear, 0, 1),
        to: new Date(currentYear, now.getMonth(), now.getDate(), 23, 59, 59, 999)
      };

      // Previous YTD (January 1 to same date last year)
      const prevYTD: DateRange = {
        from: new Date(currentYear - 1, 0, 1),
        to: new Date(currentYear - 1, now.getMonth(), now.getDate(), 23, 59, 59, 999)
      };

      return [currentYTD, prevYTD];
    }

    default:
      return [];
  }
}

export function formatBadge(from?: Date, to?: Date, locale: string = "es-CL"): string {
  if (!from || !to) return "Sin filtro";
  const fmt = new Intl.DateTimeFormat(locale);
  return `${fmt.format(from)} – ${fmt.format(to)}`;
}

export function formatComparisonBadge(comparisonId: ComparisonId, locale: string = "es-CL"): string {
  const ranges = getComparisonRanges(comparisonId);
  if (ranges.length === 0) return "Sin comparación";

  const fmt = new Intl.DateTimeFormat(locale);
  const rangeTexts = ranges.map(r => `${fmt.format(r.from)} – ${fmt.format(r.to)}`);

  switch (comparisonId) {
    case "mtdVsPmtd":
      return `MTD vs PMTD: ${rangeTexts.join(" | ")}`;
    case "yoy":
      return `YoY: ${rangeTexts.join(" | ")}`;
    case "ytdVsYtd":
      return `YTD vs YTD: ${rangeTexts.join(" | ")}`;
    default:
      return rangeTexts.join(" | ");
  }
}