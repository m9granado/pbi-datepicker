export type PresetId = "thisPeriod" | "prevPeriod";

export const toStartOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
export const toEndOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

// Helper for start of week (assuming Sunday is the first day)
export const toStartOfWeek = (d: Date) => {
    const day = d.getDay();
    const diff = d.getDate() - day;
    return toStartOfDay(new Date(new Date(d).setDate(diff)));
}

export function getRange(presetId: PresetId, granularity: "Y" | "M" | "D" = "M"): { from: Date; to: Date } {
  const now = new Date();
  const today0 = toStartOfDay(now);
  switch (presetId) {
    case "thisPeriod": {
      if (granularity === "Y") {
        return {
          from: new Date(now.getFullYear(), 0, 1),
          to: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
        };
      }
      if (granularity === "D") {
        return { from: today0, to: toEndOfDay(now) };
      }
      // Default M (Month)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: new Date(now.getFullYear(), now.getMonth(), lastDay, 23, 59, 59, 999)
      };
    }
    case "prevPeriod": {
      if (granularity === "Y") {
        return {
          from: new Date(now.getFullYear() - 1, 0, 1),
          to: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999)
        };
      }
      if (granularity === "D") {
        const y = addDays(today0, -1);
        return { from: y, to: toEndOfDay(y) };
      }
      // Default M (Month)
      const prevMonth = now.getMonth() - 1;
      const prevYear = prevMonth < 0 ? now.getFullYear() - 1 : now.getFullYear();
      const adjustedMonth = prevMonth < 0 ? 11 : prevMonth;
      const lastDayOfPrevMonth = new Date(prevYear, adjustedMonth + 1, 0).getDate();
      return {
        from: new Date(prevYear, adjustedMonth, 1),
        to: new Date(prevYear, adjustedMonth, lastDayOfPrevMonth, 23, 59, 59, 999)
      };
    }
    default:
      return { from: today0, to: toEndOfDay(now) };
  }
}

export interface DateRange {
  from: Date;
  to: Date;
}

export function formatBadge(from?: Date, to?: Date, locale: string = "es-CL"): string {
  if (!from || !to) return "Sin filtro";
  const fmt = new Intl.DateTimeFormat(locale);
  return `${fmt.format(from)} – ${fmt.format(to)}`;
}

export type NavGranularity = "Y" | "M" | "D";

// Single source of truth for "what's the next/previous period" so navigation
// (useDateFilter) and the disabled-button heuristic (MonthSelector) can never
// drift apart again. `step` distinguishes the single-step (< >) buttons from
// the bigger year-jump (<< >>) buttons.
export function getAdjacentRange(
  step: "period" | "year",
  direction: 1 | -1,
  refDate: Date,
  granularity: NavGranularity = "M"
): DateRange {
  if (step === "year") {
    if (granularity === "Y") {
      const newYear = refDate.getFullYear() + direction * 5;
      return {
        from: new Date(newYear, 0, 1, 0, 0, 0, 0),
        to: new Date(newYear, 11, 31, 23, 59, 59, 999)
      };
    }
    if (granularity === "D") {
      const newDate = new Date(refDate.getFullYear(), refDate.getMonth() + direction, refDate.getDate());
      return {
        from: new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate(), 0, 0, 0, 0),
        to: new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate(), 23, 59, 59, 999)
      };
    }
    // Month (M): jump 1 year, staying on the same month index
    const newYear = refDate.getFullYear() + direction;
    const month = refDate.getMonth();
    const lastDay = new Date(newYear, month + 1, 0).getDate();
    return {
      from: new Date(newYear, month, 1, 0, 0, 0, 0),
      to: new Date(newYear, month, lastDay, 23, 59, 59, 999)
    };
  }

  // step === "period"
  if (granularity === "Y") {
    const newYear = refDate.getFullYear() + direction;
    return {
      from: new Date(newYear, 0, 1, 0, 0, 0, 0),
      to: new Date(newYear, 11, 31, 23, 59, 59, 999)
    };
  }
  if (granularity === "D") {
    const newDate = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() + direction);
    return {
      from: new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate(), 0, 0, 0, 0),
      to: new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate(), 23, 59, 59, 999)
    };
  }
  // Month (M)
  const newMonthDate = new Date(refDate.getFullYear(), refDate.getMonth() + direction, 1);
  const lastDay = new Date(newMonthDate.getFullYear(), newMonthDate.getMonth() + 1, 0).getDate();
  return {
    from: new Date(newMonthDate.getFullYear(), newMonthDate.getMonth(), 1, 0, 0, 0, 0),
    to: new Date(newMonthDate.getFullYear(), newMonthDate.getMonth(), lastDay, 23, 59, 59, 999)
  };
}

// True when a range has no overlap at all with [minDate, maxDate].
export function isRangeOutOfBounds(range: DateRange, minDate?: Date, maxDate?: Date): boolean {
  if (minDate && range.to < minDate) return true;
  if (maxDate && range.from > maxDate) return true;
  return false;
}

// Clamps a range's edges to [minDate, maxDate]. If the range has no overlap
// with the bounds at all, it collapses to a single day at the nearest
// boundary rather than producing an inverted (from > to) range.
export function clampRangeToLimits(range: DateRange, minDate?: Date, maxDate?: Date): DateRange {
  if (isRangeOutOfBounds(range, minDate, maxDate)) {
    const boundary = (minDate && range.to < minDate) ? minDate : (maxDate as Date);
    return { from: new Date(boundary.getTime()), to: new Date(boundary.getTime()) };
  }
  const from = minDate && range.from < minDate ? new Date(minDate.getTime()) : range.from;
  const to = maxDate && range.to > maxDate ? new Date(maxDate.getTime()) : range.to;
  return { from, to };
}